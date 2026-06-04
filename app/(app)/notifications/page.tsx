import Link from "next/link";

/**
 * Notifications: deliberate placeholder for v1 launch.
 *
 * The shape: users connect WhatsApp and/or Telegram, and the app pushes a
 * short daily brief: what you spent yesterday across your accounts, plus
 * any contract charges hitting in the next few days so nothing surprises
 * you. The work is real (Telegram bot + WhatsApp Business API + a cron
 * that builds the brief from the same finance-context the AI chat uses),
 * but it isn't shipped yet. This page sets the expectation.
 */
const CHANNELS: { name: string; body: string }[] = [
  {
    name: "Telegram",
    body: "Connect a bot once. Wake up to a 3-line brief: yesterday's spend, accounts pinged, and any contract charges landing this week.",
  },
  {
    name: "WhatsApp",
    body: "Same brief, in the messenger you already check. One-tap opt-in via a verified business number, one-tap snooze when you're traveling.",
  },
];

const SAMPLE = [
  "Yesterday: −€42.10 across 4 transactions (groceries €23.40, transit €4.20, eating out €14.50).",
  "Heads-up: Claude Pro €97.36 on the 8th, Health Insurance €286.31 on the 14th.",
  "Reply 'why' to ask the chat for a breakdown.",
];

export default function NotificationsPage() {
  return (
    <div className="p-8 max-w-3xl w-full">
      <header className="mb-8">
        <div className="text-xs uppercase tracking-[0.14em] text-muted mb-2">Notifications</div>
        <h1 className="text-3xl font-semibold tracking-tight">Coming soon.</h1>
        <p className="text-muted text-sm mt-3 leading-relaxed max-w-xl">
          A short daily brief on WhatsApp or Telegram: what you spent
          yesterday, and what your contracts are about to charge. No app
          to open. It just arrives.
        </p>
      </header>

      <section className="card divide-y divide-line">
        {CHANNELS.map((c) => (
          <div key={c.name} className="px-6 py-4">
            <div className="text-sm font-semibold">{c.name}</div>
            <div className="text-sm text-muted leading-relaxed mt-1">{c.body}</div>
          </div>
        ))}
      </section>

      <section className="mt-6 card px-6 py-5">
        <div className="text-xs uppercase tracking-[0.14em] text-muted mb-3">Sample brief</div>
        <ul className="space-y-2">
          {SAMPLE.map((line, i) => (
            <li key={i} className="text-sm text-foreground/85 leading-relaxed">
              {line}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 text-sm text-muted">
        In the meantime,{" "}
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
