# NISHIRA .TRADE

Build a full-stack paper trading web app called "CosmicTrade" with the following pages and features:

🎨 DESIGN THEME:
- Clean and minimal UI with a deep space theme
- Dark background (#0a0a1a) with animated floating stars and subtle nebula gradients
- Accent colors: electric blue (#00d4ff) and soft purple (#7c3aed)
- Smooth animations on all interactions (hover, click, page transitions)
- Professional font: Inter or Space Grotesk from Google Fonts

📄 PAGE 1 — HOMEPAGE (Landing Page) at route "/":
- Full-screen hero section with animated starfield background (CSS/JS animated stars)
- App name "CosmicTrade" with a glowing tagline: "Practice the stock market with real data, fake money."
- Three feature cards: Real-Time Data, Zero Risk, Portfolio Tracker
- A glowing "Start Trading" CTA button that navigates to /signup
- Simple navbar with logo, Login, and Sign Up buttons

📄 PAGE 2 — DASHBOARD at route "/dashboard" (protected, after login):
- Welcome message with user's name and virtual balance (starting ₹1,00,000 and $10,000)
- Portfolio summary card: total value, profit/loss, percentage change
- Watchlist panel: list of saved stocks with simulated live price updates every 3 seconds
- Recent trades table: stock name, buy price, current price, P&L
- Quick Buy/Sell action buttons on each stock row
- Sidebar navigation with: Dashboard, Markets, Portfolio, Leaderboard icons and labels

📄 PAGE 3 — MARKETS PAGE at route "/markets":
- Search bar to find any Indian (NSE/BSE) or US (NASDAQ/NYSE) stock
- Stock cards showing: name, ticker, current price, % change (green/red color coded)
- Filter tabs: All | Indian Stocks | US Stocks | Top Gainers | Top Losers
- Use a list of at least 20 popular mock stocks (10 Indian: RELIANCE, TCS, INFY, HDFC, WIPRO, BAJAJ, TITAN, LT, ICICI, SBIN and 10 US: AAPL, GOOGL, MSFT, AMZN, TSLA, META, NVDA, NFLX, AMD, UBER)
- Clicking a stock opens a detail side panel with a simulated price line chart

📄 PAGE 4 — TRADE EXECUTION PAGE at route "/trade/:ticker":
- Stock name and simulated live price at the top
- Line chart showing simulated last 7 days price history
- Buy/Sell toggle button
- Input fields: Quantity, Order Type (Market/Limit)
- Estimated cost calculator that auto-updates as quantity changes
- "Place Order" glowing button
- Available balance shown clearly
- After placing order: show success toast and update portfolio

📄 PAGE 5 — PORTFOLIO PAGE at route "/portfolio":
- All current holdings in a clean table with columns: Stock, Qty, Avg Buy Price, Current Price, P&L, P&L%
- Pie chart showing portfolio allocation by stock using recharts
- Total invested vs current value comparison bar
- Realized and unrealized P&L breakdown section

📄 PAGE 6 — LEADERBOARD at route "/leaderboard":
- Table showing mock users ranked by portfolio performance
- Columns: Rank, Username, Portfolio Value, Return %
- Current user highlighted in the list

🔐 AUTH (Supabase):
- Sign Up page at /signup with email + password
- Login page at /login with email + password
- Space-themed background with animated stars on auth pages
- After login redirect to /dashboard
- Protected routes: /dashboard, /markets, /trade, /portfolio, /leaderboard

💡 TECHNICAL REQUIREMENTS:
- Use Supabase for authentication and database
- Store trades and portfolio in Supabase database
- Simulate real-time price updates using setInterval every 3 seconds with small random fluctuations (+/- 0.5% to 2%)
- Mobile responsive design with hamburger menu on mobile
- Smooth page transitions using framer-motion or CSS transitions
- Toast notifications (using shadcn/ui toast) for: order placed successfully, order failed, watchlist updated, insufficient balance
- Use recharts for all charts (line chart, pie chart)
- All Indian stock prices in ₹ (INR), US stocks in $ (USD)
- Store user's virtual balance in Supabase (₹1,00,000 for Indian, $10,000 for US)
- .env.example file with all required environment variables clearly labeled

⚠️ NOTE: Leave all API keys as placeholder values in .env.example. The user will add real keys later. Use Supabase for auth and data persistence.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://nishiratrade.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/85bd0b89-616e-4192-a545-3074c825e387).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
