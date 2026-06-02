import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { accounts, transactions } from "@/lib/db/schema";

export const runtime = "nodejs";

type Row = {
  id: number;
  bookingDate: string | null;
  valueDate: string | null;
  amountCents: number;
  currency: string;
  creditorName: string | null;
  debtorName: string | null;
  memo: string | null;
  status: string;
  accountName: string | null;
  accountIban: string | null;
};

function ymOf(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET() {
  const acctCount = (await db.select().from(accounts)).length;
  if (acctCount === 0) {
    return NextResponse.json({ accounts: 0, empty: true });
  }

  const raw = await db
    .select({
      id: transactions.id,
      bookingDate: transactions.bookingDate,
      valueDate: transactions.valueDate,
      amountCents: transactions.amountCents,
      currency: transactions.currency,
      creditorName: transactions.creditorName,
      debtorName: transactions.debtorName,
      memo: transactions.memo,
      status: transactions.status,
      accountName: accounts.displayName,
      accountIban: accounts.iban,
    })
    .from(transactions)
    .leftJoin(accounts, eq(transactions.accountId, accounts.id));

  const rows: Row[] = raw.map((r) => ({
    ...r,
    amountCents: Number(r.amountCents),
  }));

  if (rows.length === 0) {
    return NextResponse.json({ accounts: acctCount, empty: true });
  }

  // ----- monthly aggregates -----
  const now = new Date();
  const thisYM = ymOf(now);
  const prevYM = ymOf(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  let mSpent = 0, mRecv = 0, pSpent = 0, pRecv = 0;
  for (const t of rows) {
    const d = t.bookingDate ?? t.valueDate;
    if (!d) continue;
    const ym = d.slice(0, 7);
    if (ym === thisYM) {
      if (t.amountCents < 0) mSpent += -t.amountCents;
      else mRecv += t.amountCents;
    } else if (ym === prevYM) {
      if (t.amountCents < 0) pSpent += -t.amountCents;
      else pRecv += t.amountCents;
    }
  }

  // ----- "this week" attention items -----
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const weekTxs = rows.filter((t) => (t.bookingDate ?? t.valueDate ?? "") >= weekStart);

  const attention: { type: string; reason: string; transaction: Row }[] = [];

  // 1) Largest outgoing this week — excluding obvious internal transfers
  // (no creditor name and a memo that looks like a transfer between own
  // accounts). On N26 these look like "Von <Space> nach Hauptkonto" or
  // "Monatliche Überweisung", which dwarf real spend.
  const isInternalTransfer = (t: Row) => {
    if (t.creditorName) return false;
    const memo = (t.memo ?? "").toLowerCase();
    return (
      memo.includes("nach hauptkonto") ||
      memo.includes("nach tagesgeldkonto") ||
      memo.includes("nach freelancer") ||
      memo.includes("nach gpu") ||
      memo.includes("nach poker") ||
      memo.includes("nach porsche") ||
      memo.includes("von hauptkonto") ||
      memo.includes("monatliche überweisung")
    );
  };
  const outgoing = weekTxs
    .filter((t) => t.amountCents < 0 && !isInternalTransfer(t))
    .sort((a, b) => a.amountCents - b.amountCents);
  if (outgoing.length > 0) {
    attention.push({
      type: "largest",
      reason: "Biggest single charge this week",
      transaction: outgoing[0],
    });
  }

  // 2) First-time merchant this week (creditor never seen before this week)
  const seenBefore = new Set<string>();
  for (const t of rows) {
    const d = t.bookingDate ?? t.valueDate ?? "";
    if (d >= weekStart) continue;
    const m = (t.creditorName ?? "").toLowerCase();
    if (m) seenBefore.add(m);
  }
  const firstTime = weekTxs.find((t) => {
    const m = (t.creditorName ?? "").toLowerCase();
    return t.amountCents < 0 && m && !seenBefore.has(m);
  });
  if (firstTime && !attention.some((a) => a.transaction.id === firstTime.id)) {
    attention.push({
      type: "new_merchant",
      reason: "First time you've paid this merchant",
      transaction: firstTime,
    });
  }

  // 3) Anomaly — an outgoing tx whose amount is >1.8x the avg charge from that same merchant
  const merchantHist = new Map<string, number[]>();
  for (const t of rows) {
    const d = t.bookingDate ?? t.valueDate ?? "";
    if (d >= weekStart) continue;
    if (t.amountCents >= 0) continue;
    const m = (t.creditorName ?? "").toLowerCase();
    if (!m) continue;
    const arr = merchantHist.get(m) ?? [];
    arr.push(-t.amountCents);
    merchantHist.set(m, arr);
  }
  let anomaly: { row: Row; avg: number } | null = null;
  for (const t of weekTxs) {
    if (t.amountCents >= 0) continue;
    const m = (t.creditorName ?? "").toLowerCase();
    if (!m) continue;
    const hist = merchantHist.get(m);
    if (!hist || hist.length < 2) continue;
    const avg = hist.reduce((a, b) => a + b, 0) / hist.length;
    const charge = -t.amountCents;
    if (charge > avg * 1.8 && (!anomaly || charge - avg > -anomaly.row.amountCents - anomaly.avg)) {
      anomaly = { row: t, avg };
    }
  }
  if (anomaly && !attention.some((a) => a.transaction.id === anomaly!.row.id)) {
    attention.push({
      type: "anomaly",
      reason: `${(((-anomaly.row.amountCents) / anomaly.avg - 1) * 100).toFixed(0)}% larger than your typical charge from this merchant`,
      transaction: anomaly.row,
    });
  }

  const lastPullAt = (await db.select({ d: accounts.lastPullAt }).from(accounts))
    .map((r) => r.d)
    .filter((d): d is Date => d != null)
    .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

  return NextResponse.json({
    accounts: acctCount,
    empty: false,
    month: { ym: thisYM, spent_cents: mSpent, received_cents: mRecv, net_cents: mRecv - mSpent },
    prev_month: { ym: prevYM, spent_cents: pSpent, received_cents: pRecv, net_cents: pRecv - pSpent },
    attention,
    last_pull_at: lastPullAt?.toISOString() ?? null,
  });
}
