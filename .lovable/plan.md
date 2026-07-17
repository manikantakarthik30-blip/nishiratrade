
# CosmicTrade — Build Plan

A full-stack paper trading app with a deep-space aesthetic, Supabase auth + database, and simulated live stock prices.

## Design system (src/styles.css)
- Background `#0a0a1a`, foreground near-white
- Accents: electric blue `#00d4ff`, soft purple `#7c3aed`
- Nebula gradient + glow shadow tokens (`--gradient-nebula`, `--shadow-glow`)
- Space Grotesk (headings) + Inter (body) via `<link>` in `__root.tsx`
- Global animated starfield component (fixed, pointer-events-none) used on all pages
- Reusable Button variants: `glow` (electric-blue glow) and `outline-glow`

## Backend — Lovable Cloud (Supabase)
Enable Cloud, then one migration creating:
- `profiles` (id → auth.users, username, balance_inr numeric default 100000, balance_usd numeric default 10000, created_at). Trigger on `auth.users` insert to create profile.
- `holdings` (id, user_id, ticker, market ENUM('IN','US'), qty, avg_price)
- `trades` (id, user_id, ticker, market, side ENUM('BUY','SELL'), qty, price, created_at)
- `watchlist` (id, user_id, ticker, market, unique(user_id,ticker))
- RLS: user owns their rows (`auth.uid() = user_id`). Grants to `authenticated` + `service_role` per rules.
- Profiles readable by all authenticated (for leaderboard) + owner update.

## Routes (file-based)
- `src/routes/index.tsx` — Landing: hero, tagline, 3 feature cards, Start Trading CTA, navbar
- `src/routes/auth.tsx` — Combined login/signup tabs (space bg). Redirect authed → `/dashboard`
- `src/routes/_authenticated/route.tsx` — Managed gate (integration ships this on Cloud enable). Wraps a `<DashboardLayout>` with sidebar (Dashboard/Markets/Portfolio/Leaderboard) + mobile hamburger
- `src/routes/_authenticated/dashboard.tsx` — Welcome, balance, portfolio summary, watchlist w/ live ticks, recent trades table, quick buy/sell
- `src/routes/_authenticated/markets.tsx` — Search, filter tabs, 20 mock stocks grid, side panel with mini chart
- `src/routes/_authenticated/trade.$ticker.tsx` — Chart, buy/sell toggle, qty, order type, cost calc, place order → insert trade + update holding + adjust balance
- `src/routes/_authenticated/portfolio.tsx` — Holdings table, recharts Pie allocation, invested vs current bar, realized/unrealized P&L
- `src/routes/_authenticated/leaderboard.tsx` — Rank mock users + current user by portfolio value

Note: Since `/dashboard` becomes the signed-in home, keep `/` as public landing (no duplicate).

## Shared code
- `src/lib/stocks.ts` — Mock stock list (10 IN + 10 US), base prices, `simulatePrice()`, `generateHistory(days)`
- `src/hooks/useLivePrices.ts` — `setInterval(3000)` fluctuation ±0.5–2%
- `src/lib/trade.functions.ts` — `placeOrder` server fn using `requireSupabaseAuth`: validates balance, updates holding (upsert with new avg), inserts trade, updates profile balance
- `src/components/Starfield.tsx` — canvas/CSS animated stars
- `src/components/AppSidebar.tsx` — shadcn sidebar

## Tech details
- Charts: recharts (already or add via bun)
- Toasts: sonner
- Framer-motion for page/element transitions
- Prices: INR for IN stocks, USD for US stocks; balances tracked separately
- `.env.example` documenting `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` as placeholders (Cloud auto-provisions the real values)

## Order of operations
1. Enable Lovable Cloud
2. Migration (tables + RLS + grants + profile trigger)
3. Design system + Starfield + fonts
4. Landing + Auth pages
5. Sidebar layout + Dashboard
6. Markets + Trade + Portfolio + Leaderboard
7. Server fn for order placement + wire toasts
8. Sitemap/robots, `.env.example`, root head metadata
