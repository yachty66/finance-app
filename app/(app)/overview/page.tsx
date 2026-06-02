"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

type Overview =
  | { accounts: number; empty: true }
  | {
      accounts: number;
      empty: false;
      month: { ym: string; spent_cents: number; received_cents: number; net_cents: number };
      prev_month: { ym: string; spent_cents: number; received_cents: number; net_cents: number };
      attention: { type: string; reason: string; transaction: Row }[];
      last_pull_at: string | null;
    };

const eur = (cents: number) =>
  new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);

const eurSigned = (cents: number) =>
  new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
    signDisplay: "always",
  }).format(cents / 100);

function pctDelta(now: number, prev: number): string | null {
  if (prev === 0) return null;
  const pct = ((now - prev) / prev) * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}%`;
}

const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
};

export default function OverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [brief, setBrief] = useState<string | null>(null);
  const [briefCached, setBriefCached] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/overview");
      if (!r.ok) return;
      const d: Overview = await r.json();
      setData(d);
      if (!d.empty) loadCommentary(d);
    })();
  }, []);

  async function loadCommentary(d: Exclude<Overview, { empty: true }>) {
    const r = await fetch("/api/overview/commentary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(d),
    });
    if (!r.ok) {
      setBrief("(commentary unavailable)");
      return;
    }
    const j = await r.json();
    setBrief(j.text);
    setBriefCached(!!j.cached);
  }

  if (data === null) {
    return <div className="p-8 text-muted text-sm">Loading overview…</div>;
  }

  if (data.empty) {
    return (
      <div className="p-8 max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight mb-3">Overview</h1>
        <p className="text-muted text-sm mb-6">
          {data.accounts === 0
            ? "No bank connected yet."
            : "No transactions yet. Pull them from your connected account."}
        </p>
        <Link href="/subscriptions" className="btn btn-primary">
          {data.accounts === 0 ? "Connect a bank" : "Go to Subscriptions to pull"}
        </Link>
      </div>
    );
  }

  const spentDelta = pctDelta(data.month.spent_cents, data.prev_month.spent_cents);
  const recvDelta = pctDelta(data.month.received_cents, data.prev_month.received_cents);
  const netDiff = data.month.net_cents - data.prev_month.net_cents;

  return (
    <div className="p-8 max-w-6xl w-full">
      <header className="mb-6 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-muted mt-1">
            {monthLabel(data.month.ym)} · {data.accounts} account{data.accounts !== 1 ? "s" : ""} connected
            {data.last_pull_at && <> · last pull {new Date(data.last_pull_at).toLocaleString()}</>}
          </p>
        </div>
      </header>

      <section className="grid sm:grid-cols-3 gap-4 mb-8">
        <Metric
          label="Spent this month"
          value={eur(data.month.spent_cents)}
          delta={spentDelta}
          deltaHint={`vs ${eur(data.prev_month.spent_cents)} in ${monthLabel(data.prev_month.ym)}`}
          deltaPositiveIsBad
        />
        <Metric
          label="Received this month"
          value={eur(data.month.received_cents)}
          delta={recvDelta}
          deltaHint={`vs ${eur(data.prev_month.received_cents)} in ${monthLabel(data.prev_month.ym)}`}
        />
        <Metric
          label="Net this month"
          value={eurSigned(data.month.net_cents)}
          delta={netDiff !== 0 ? eurSigned(netDiff) : null}
          deltaHint={`vs ${eurSigned(data.prev_month.net_cents)} last month`}
        />
      </section>

      <section className="mb-8">
        <h2 className="text-sm uppercase tracking-wide text-muted mb-3">Worth your attention this week</h2>
        {data.attention.length === 0 ? (
          <div className="card p-6 text-sm text-muted">Nothing unusual flagged this week.</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {data.attention.map((a, i) => (
              <AttentionCard key={i} item={a} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-sm uppercase tracking-wide text-muted mb-3 flex items-center gap-2">
          What stands out
          {brief && briefCached && (
            <span className="text-[10px] normal-case tracking-normal text-muted/70">· cached</span>
          )}
        </h2>
        <div className="card p-6">
          {brief !== null ? (
            <div className="prose text-foreground/90">
              {brief.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm">Generating…</p>
          )}
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-4">
        <QuickLink href="/transactions" title="Transactions" desc="Browse and search every charge across your accounts." />
        <QuickLink href="/subscriptions" title="Subscriptions" desc="Every recurring charge, ranked by monthly cost." />
        <QuickLink href="/chat" title="AI Chat" desc="Ask anything about your finances." />
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  delta,
  deltaHint,
  deltaPositiveIsBad,
}: {
  label: string;
  value: string;
  delta: string | null;
  deltaHint: string;
  deltaPositiveIsBad?: boolean;
}) {
  // In a strict B&W theme we don't color deltas — we just use a + or − sign
  // and the surrounding "vs" context. The opacity of the delta hint signals
  // "for context."
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="text-3xl font-semibold tracking-tight mt-2 tabular-nums">{value}</div>
      <div className="mt-2 text-xs text-muted">
        {delta && <span className="text-foreground/80 tabular-nums">{delta}</span>}{" "}
        <span>{deltaHint}</span>
      </div>
    </div>
  );
}

function AttentionCard({ item }: { item: { type: string; reason: string; transaction: Row } }) {
  const t = item.transaction;
  const date = t.bookingDate ?? t.valueDate ?? "";
  // Fall back to the memo when no creditor/debtor name is present (common
  // for internal transfers like "Monatliche Überweisung" on N26).
  const merchant =
    (t.amountCents < 0 ? t.creditorName : t.debtorName) ??
    (t.memo ? t.memo.split(/\s+/).slice(0, 5).join(" ") : null);
  const label =
    item.type === "largest"
      ? "Biggest charge"
      : item.type === "new_merchant"
        ? "New merchant"
        : "Anomaly";
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wide text-muted mb-2">{label}</div>
      <div className="font-semibold text-base truncate" title={merchant ?? ""}>
        {merchant ?? "—"}
      </div>
      <div className="text-2xl font-semibold tabular-nums mt-2">{eurSigned(t.amountCents)}</div>
      <div className="text-xs text-muted mt-2">
        {date}
        {t.accountName && <> · {t.accountName}</>}
      </div>
      <div className="text-xs text-muted mt-2 leading-relaxed">{item.reason}</div>
    </div>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="card p-5 block hover:border-foreground/40 transition">
      <div className="font-semibold">{title}</div>
      <div className="text-xs text-muted mt-1 leading-relaxed">{desc}</div>
      <div className="text-xs text-foreground/80 mt-3">Open →</div>
    </Link>
  );
}
