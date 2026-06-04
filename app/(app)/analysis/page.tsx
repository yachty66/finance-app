import Link from "next/link";

/**
 * Analysis: deliberate placeholder for v1 launch.
 *
 * The five sub-dashboards (Overview, Categories, Budgets, Forecast, Net
 * worth) exist as standalone pages and have working APIs, but they aren't
 * polished into a single coherent narrative yet. Rather than ship five
 * stacked half-finished pages, the launch surface is intentionally narrow:
 * Contracts, Transactions, AI Chat. This page sets the expectation that
 * the depth is coming.
 */
const PLANNED: { name: string; body: string }[] = [
  {
    name: "Overview",
    body: "Spent vs received this month, what's worth your attention this week, and an AI-written brief of where the money went.",
  },
  {
    name: "Categories",
    body: "Auto-categorized spending across the last 6 months with one-click merchant overrides. Eat-out, groceries, transport — see exactly where it goes.",
  },
  {
    name: "Budgets",
    body: "Set a cap per category. Watch the progress bars. Get a warning before you blow it, not after.",
  },
  {
    name: "Forecast",
    body: "Your balance projected day-by-day for the next 30 days from recurring outgoing + recurring income. Spot the day you'd dip below zero before it happens.",
  },
  {
    name: "Net worth",
    body: "Bank balances + manual assets − liabilities, plotted over time. One number you can watch move.",
  },
];

export default function AnalysisPage() {
  return (
    <div className="p-8 max-w-3xl w-full">
      <header className="mb-8">
        <div className="text-xs uppercase tracking-[0.14em] text-muted mb-2">Analysis</div>
        <h1 className="text-3xl font-semibold tracking-tight">Coming soon.</h1>
        <p className="text-muted text-sm mt-3 leading-relaxed max-w-xl">
          v1 is focused on the two things this app does best: finding every
          contract you&apos;re paying for, and answering questions about
          your money through the chat. Deeper analysis lands here next.
        </p>
      </header>

      <section className="card divide-y divide-line">
        {PLANNED.map((p) => (
          <div key={p.name} className="px-6 py-4">
            <div className="text-sm font-semibold">{p.name}</div>
            <div className="text-sm text-muted leading-relaxed mt-1">{p.body}</div>
          </div>
        ))}
      </section>

      <div className="mt-8 text-sm text-muted">
        In the meantime —{" "}
        <Link href="/subscriptions" className="text-foreground underline underline-offset-4 hover:no-underline">
          your contracts
        </Link>
        ,{" "}
        <Link href="/transactions" className="text-foreground underline underline-offset-4 hover:no-underline">
          your transactions
        </Link>
        , or{" "}
        <Link href="/chat" className="text-foreground underline underline-offset-4 hover:no-underline">
          ask the chat
        </Link>
        .
      </div>
    </div>
  );
}
