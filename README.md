# finance-app

A local-first personal finance dashboard. Dark monochrome UI, dashboard with
sidebar, two features at the moment:

1. **Subscription tracker** — connects to European banks via GoCardless (PSD2)
   and uses an LLM to surface every recurring charge. *(Bank connect ships in
   the next milestone — UI placeholder is in place.)*
2. **AI Chat** — talk to your finance data through any OpenRouter model.
   *(Transaction context will be wired alongside step 1.)*

This is the umbrella product the masterplan calls "the Mac app." It's
intentionally **not** native macOS — it's a Next.js web app you run locally
and open in your browser. Same code will eventually run as a self-hosted
instance for users who want full data ownership and as a managed hosted
product for everyone else.

## No sign-in (yet)

In local-first mode there's no authentication. You own the machine, you own
the data, you open the app and you're in. When the hosted version launches,
sign-in (Google OAuth via Neon Auth) will come back behind an `AUTH_MODE`
flag — that scaffold lived in an earlier commit and can be resurrected.

## Stack

- **Next.js 15** (App Router) + React 19 + TypeScript
- **Tailwind 4** for styling, strict black-and-white theme
- **Neon Postgres** + **Drizzle ORM** (will swap to SQLite for true local-first
  packaging once the Docker / Tauri distribution lands)
- **OpenRouter** for LLM inference

## Local dev

```bash
cd ~/projects/personal-finance/finance-app
npm install
cp .env.example .env.local   # fill in DATABASE_URL + OPENROUTER_API_KEY
npm run db:push              # push Drizzle schema to Neon
npm run dev                  # http://localhost:3001
```

Runs on **port 3001** to avoid colliding with mysubs on 3000.

## Routes

- `/` → redirects to `/subscriptions`
- `/subscriptions` — subscription tracker
- `/chat` — AI chat (streams from OpenRouter)
- `/api/chat` — server-side OpenRouter proxy (key never reaches the browser)
