import { createFileRoute, Link } from "@tanstack/react-router";

const CANONICAL = "https://nishiratrade.lovable.app/blog/best-paper-trading-apps";
const TITLE = "Best Paper Trading Apps in India 2025 — Free Virtual Trading";
const DESCRIPTION =
  "Compare the best paper trading apps in India for 2025. Real TradingView charts, ₹10L virtual balance, NSE/BSE data, and honest pros and cons for each platform.";

export const Route = createFileRoute("/blog/best-paper-trading-apps")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "keywords", content: "paper trading app, paper trading app india, virtual trading, best paper trading apps, stock market simulator india, NSE paper trading" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: CANONICAL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Best Paper Trading Apps in India 2025",
          description: DESCRIPTION,
          datePublished: "2026-01-01",
          dateModified: "2026-07-19",
          author: { "@type": "Organization", name: "NISHIRA.TRADE" },
          publisher: { "@type": "Organization", name: "NISHIRA.TRADE" },
          mainEntityOfPage: CANONICAL,
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "What is a paper trading app?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "A paper trading app lets you buy and sell stocks with virtual money using real market prices, so you can practice trading strategies without any financial risk.",
              },
            },
            {
              "@type": "Question",
              name: "Which is the best paper trading app in India for 2025?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "NISHIRA.TRADE is the top pick for Indian traders in 2025 — it ships with real TradingView Advanced charts, live NSE/BSE prices, a ₹10,00,000 virtual balance, an AI trading tutor, and a global US-market mode with a $10,000 virtual USD wallet.",
              },
            },
            {
              "@type": "Question",
              name: "Is paper trading free in India?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. NISHIRA.TRADE is 100% free to use — no broker account, no KYC, no credit card. Sign in with Google and start practicing in under 30 seconds.",
              },
            },
            {
              "@type": "Question",
              name: "Can I practice both NSE and US stocks?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. NISHIRA.TRADE gives you two separate virtual wallets — ₹10L for Indian stocks (NSE/BSE) and $10,000 for US stocks (NASDAQ/NYSE) — so you can practice both markets from one dashboard.",
              },
            },
          ],
        }),
      },
    ],
  }),
  component: BestPaperTradingApps,
});

type AppRow = {
  name: string;
  best: string;
  charts: string;
  balance: string;
  markets: string;
  price: string;
  highlight?: boolean;
};

const APPS: AppRow[] = [
  {
    name: "NISHIRA.TRADE",
    best: "All-round best — real charts + AI tutor",
    charts: "TradingView Advanced (real)",
    balance: "₹10,00,000 + $10,000",
    markets: "NSE, BSE, NYSE, NASDAQ",
    price: "Free",
    highlight: true,
  },
  {
    name: "TradingView Paper Trading",
    best: "Chartists who already use TradingView",
    charts: "TradingView (native)",
    balance: "$100,000 (USD only)",
    markets: "Global (limited India depth)",
    price: "Free tier + paid",
  },
  {
    name: "Moneybhai (Moneycontrol)",
    best: "Contest-style Indian traders",
    charts: "Basic",
    balance: "₹1 crore",
    markets: "NSE",
    price: "Free",
  },
  {
    name: "Sensibull Virtual Trade",
    best: "F&O and options learners",
    charts: "Basic option chain",
    balance: "Configurable",
    markets: "NSE F&O",
    price: "Free tier",
  },
  {
    name: "Neostox",
    best: "Intraday equity simulation",
    charts: "Basic candlestick",
    balance: "₹10,00,000",
    markets: "NSE",
    price: "Paid subscription",
  },
  {
    name: "Investopedia Simulator",
    best: "US-market beginners",
    charts: "Basic",
    balance: "$100,000",
    markets: "US only",
    price: "Free",
  },
];

function BestPaperTradingApps() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <article className="mx-auto max-w-3xl px-4 py-16">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <span>Blog</span>
          <span className="mx-2">/</span>
          <span className="text-foreground">Best Paper Trading Apps in India</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm uppercase tracking-wider text-primary">Guide · Updated July 2026</p>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Best Paper Trading Apps in India 2025
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            A no-fluff comparison of the top paper trading apps for Indian investors — real charts,
            real prices, virtual money. Practice NSE, BSE and US stocks without risking a single rupee.
          </p>
        </header>

        <section className="prose prose-invert max-w-none">
          <h2 className="text-2xl font-semibold">What is paper trading?</h2>
          <p className="text-muted-foreground">
            Paper trading (also called virtual trading or stock market simulation) lets you buy and
            sell shares with fake money at real market prices. It's the safest way to learn how the
            market moves, test a strategy, or get comfortable with candlestick charts before you
            deposit real capital into a broker.
          </p>

          <h2 className="mt-10 text-2xl font-semibold">How we picked the best paper trading apps</h2>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li>✅ <strong>Real market data</strong> — not lagging or fabricated prices.</li>
            <li>✅ <strong>Indian market coverage</strong> — NSE and BSE, not just US stocks.</li>
            <li>✅ <strong>Serious charting</strong> — TradingView-grade candlesticks and indicators.</li>
            <li>✅ <strong>Reasonable virtual balance</strong> — enough to practice position sizing.</li>
            <li>✅ <strong>Free to start</strong> — no card, no KYC to try it out.</li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Comparison table</h2>
          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="p-3">App</th>
                  <th className="p-3">Best for</th>
                  <th className="p-3">Charts</th>
                  <th className="p-3">Virtual balance</th>
                  <th className="p-3">Markets</th>
                  <th className="p-3">Price</th>
                </tr>
              </thead>
              <tbody>
                {APPS.map((app) => (
                  <tr
                    key={app.name}
                    className={`border-t border-border ${app.highlight ? "bg-primary/5" : ""}`}
                  >
                    <td className="p-3 font-semibold">
                      {app.name}
                      {app.highlight && (
                        <span className="ml-2 rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                          Editor's pick
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">{app.best}</td>
                    <td className="p-3 text-muted-foreground">{app.charts}</td>
                    <td className="p-3 text-muted-foreground">{app.balance}</td>
                    <td className="p-3 text-muted-foreground">{app.markets}</td>
                    <td className="p-3 text-muted-foreground">{app.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">1. NISHIRA.TRADE — best paper trading app in India</h2>
          <p className="mt-3 text-muted-foreground">
            NISHIRA.TRADE was built specifically for Indian traders who want a professional feel
            without the paid TradingView subscription. It embeds the real TradingView Advanced Chart
            widget, streams live NSE/BSE prices, and hands you a <strong>₹10,00,000 virtual wallet</strong>
            {" "}the moment you sign in with Google — plus a separate <strong>$10,000 USD wallet</strong>
            {" "}for practicing US stocks.
          </p>
          <ul className="mt-4 space-y-2 text-muted-foreground">
            <li>• Real TradingView charts with 100+ indicators and drawing tools</li>
            <li>• Dual wallets — INR for NSE/BSE, USD for NYSE/NASDAQ</li>
            <li>• NISHIRA.AI — a Gemini-powered tutor that explains trades and patterns</li>
            <li>• Analysis Lab — auto-generated technical reports, export to Excel/PDF/Word</li>
            <li>• Live leaderboard, watchlists, portfolio analytics, CSV/XLSX exports</li>
            <li>• Free forever — no KYC, no card, no broker account required</li>
          </ul>
          <div className="mt-6 flex gap-3">
            <Link
              to="/auth"
              className="rounded-md bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:opacity-90"
            >
              Start paper trading free →
            </Link>
            <Link
              to="/docs"
              className="rounded-md border border-border px-5 py-2.5 font-semibold hover:bg-muted"
            >
              Read the docs
            </Link>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">2. TradingView Paper Trading</h2>
          <p className="mt-3 text-muted-foreground">
            The gold standard for charts, but its paper trading module is oriented at US and crypto
            markets — Indian equity depth is limited. A great companion if you already pay for
            TradingView, but overkill if you just want to practice NSE trades.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">3. Moneybhai by Moneycontrol</h2>
          <p className="mt-3 text-muted-foreground">
            One of the oldest Indian virtual trading platforms. Contest format is fun, but the
            charts and UX feel dated and there's no US-market option.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">4. Sensibull Virtual Trade</h2>
          <p className="mt-3 text-muted-foreground">
            Excellent if your focus is options and F&O strategy building. Not designed as a general
            equity simulator.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">5. Neostox</h2>
          <p className="mt-3 text-muted-foreground">
            Solid intraday simulator with tick-by-tick replay, but the useful features sit behind a
            paid plan.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">6. Investopedia Stock Simulator</h2>
          <p className="mt-3 text-muted-foreground">
            Great classroom-style tool for learning US markets, but no Indian stocks and prices are
            delayed.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">FAQ</h2>

          <div className="mt-6 space-y-6">
            <div>
              <h3 className="font-semibold">What is a paper trading app?</h3>
              <p className="mt-1 text-muted-foreground">
                A paper trading app lets you buy and sell stocks with virtual money at real market
                prices, so you can practice strategies without financial risk.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Which is the best paper trading app in India for 2025?</h3>
              <p className="mt-1 text-muted-foreground">
                NISHIRA.TRADE is our top pick — real TradingView charts, live NSE/BSE data, a ₹10L
                virtual wallet, an AI trading tutor, and a separate $10,000 USD wallet for US stocks.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Is paper trading free in India?</h3>
              <p className="mt-1 text-muted-foreground">
                Yes. NISHIRA.TRADE is 100% free — no broker account, no KYC, no credit card. Sign in
                with Google and start practicing in under 30 seconds.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Can I practice both NSE and US stocks?</h3>
              <p className="mt-1 text-muted-foreground">
                Yes. NISHIRA.TRADE gives you two separate virtual wallets — ₹10L for Indian stocks
                and $10,000 for US stocks — so you can practice both markets from one dashboard.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-14 rounded-xl border border-border bg-muted/30 p-8 text-center">
          <h2 className="text-2xl font-bold">Ready to start paper trading?</h2>
          <p className="mt-2 text-muted-foreground">
            Get ₹10,00,000 + $10,000 virtual balance. Real charts. Zero risk.
          </p>
          <Link
            to="/auth"
            className="mt-5 inline-block rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90"
          >
            Create your free account →
          </Link>
        </section>
      </article>
    </div>
  );
}
