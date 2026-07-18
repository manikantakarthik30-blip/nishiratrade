import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Rocket, Wallet, ShoppingCart, LineChart, PenTool, Activity,
  CandlestickChart, HelpCircle, Crosshair, Minus, TrendingUp,
  Square, Type, Ruler, ZoomIn, GitBranch,
} from "lucide-react";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Documentation — NISHIRA.TRADE" },
      { name: "description", content: "Learn how to use NISHIRA.TRADE: virtual balance, trading, TradingView charts, indicators, and FAQs." },
      { property: "og:title", content: "Documentation — NISHIRA.TRADE" },
      { property: "og:description", content: "Complete guide to paper trading with real market data." },
    ],
  }),
  component: DocsPage,
});

const sections = [
  { id: "getting-started", title: "Getting Started", icon: Rocket },
  { id: "virtual-balance", title: "Virtual Balance", icon: Wallet },
  { id: "how-to-trade", title: "How to Trade", icon: ShoppingCart },
  { id: "tradingview", title: "TradingView Charts Guide", icon: LineChart },
  { id: "chart-tools", title: "Chart Tools Reference", icon: PenTool },
  { id: "indicators", title: "Indicators Guide", icon: Activity },
  { id: "candlesticks", title: "Reading Candlesticks", icon: CandlestickChart },
  { id: "faqs", title: "FAQs", icon: HelpCircle },
];

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 rounded-lg border border-success/30 bg-success/5 p-4 text-sm">
      <div className="mb-1 font-semibold text-success">Tip</div>
      <div className="text-foreground/90">{children}</div>
    </div>
  );
}
function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm">
      <div className="mb-1 font-semibold text-yellow-400">Note</div>
      <div className="text-foreground/90">{children}</div>
    </div>
  );
}
function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-black/60 px-1.5 py-0.5 font-mono text-xs text-primary">{children}</code>
  );
}

function DocsPage() {
  const [active, setActive] = useState(sections[0].id);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="docs-container min-h-screen overflow-x-hidden" style={{ background: "#050418" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <Rocket className="h-5 w-5 shrink-0 text-primary" />
            <span className="truncate font-display text-sm font-bold md:text-base">
              NISHIRA<span className="text-primary">.TRADE</span>
            </span>
          </Link>
          <nav className="flex shrink-0 items-center gap-4 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">Home</Link>
            <Link to="/dashboard" className="text-primary hover:underline">Open App →</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row md:gap-8 md:px-6 md:py-8">
        {/* Desktop TOC */}
        <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-[220px] shrink-0 md:block">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Contents
          </div>
          <nav className="flex flex-col gap-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition ${
                  active === s.id
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                }`}
              >
                <s.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{s.title}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile TOC dropdown */}
        <div className="w-full md:hidden">
          <select
            value={active}
            onChange={(e) => {
              setActive(e.target.value);
              scrollTo(e.target.value);
            }}
            className="w-full rounded-lg border border-border/50 bg-[#0d0d1a] p-3 text-sm text-foreground"
          >
            {sections.map((s, i) => (
              <option key={s.id} value={s.id}>{i + 1}. {s.title}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        <main className="docs-content min-w-0 max-w-full flex-1 space-y-12 break-words text-sm text-foreground/90 md:space-y-16 md:text-base">
          <div>
            <h1 className="font-display text-2xl font-bold md:text-4xl">Documentation</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Everything you need to master paper trading on NISHIRA.TRADE.</p>
          </div>

          <section id="getting-started" className="scroll-mt-24">
            <h2 className="font-display text-xl md:text-2xl font-bold">1. Getting Started</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-sm">
              <li>Sign up with <b>Google</b> or <b>email + password</b>.</li>
              <li>You instantly receive <Code>₹10,00,000</Code> and <Code>$10,000</Code> in virtual balance.</li>
              <li>Practice with real market prices — <b>zero real money at risk</b>.</li>
            </ul>
            <Tip>Use Google sign-in for the fastest onboarding — one click and you're in.</Tip>
          </section>

          <section id="virtual-balance" className="scroll-mt-24">
            <h2 className="font-display text-xl md:text-2xl font-bold">2. Virtual Balance</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-sm">
              <li><b>INR balance</b> — used for Indian stocks (NSE / BSE).</li>
              <li><b>USD balance</b> — used for US stocks (NASDAQ / NYSE).</li>
              <li>P&amp;L is tracked in real time on your Dashboard and Portfolio.</li>
              <li>Balance resets are <b>not allowed</b> — this keeps your journey realistic.</li>
            </ul>
            <Note>Treat your virtual capital like it's real. That mindset is the whole point.</Note>
          </section>

          <section id="how-to-trade" className="scroll-mt-24">
            <h2 className="font-display text-xl md:text-2xl font-bold">3. How to Trade</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-6 text-sm">
              <li>Go to <b>Markets</b> → search or browse stocks.</li>
              <li>Click any stock → opens the <b>Trade</b> page.</li>
              <li>Choose <b>BUY</b> or <b>SELL</b>.</li>
              <li>Select <b>Market</b> or <b>Limit</b> order.</li>
              <li>Enter <b>quantity</b>.</li>
              <li>Review <b>total cost + brokerage</b>.</li>
              <li>Click <b>Place Order</b>.</li>
              <li>Check your <b>Portfolio</b> for holdings and P&amp;L.</li>
            </ol>
            <Tip>Start small — buy 1 share of your favorite stock and watch the P&amp;L move in real time.</Tip>
          </section>

          <section id="tradingview" className="scroll-mt-24">
            <h2 className="font-display text-xl md:text-2xl font-bold">4. TradingView Charts Guide</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Every trade page embeds the official TradingView Advanced Chart. Here's how to work it.
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <div><b>Timeframes</b> — <Code>1m</Code>, <Code>5m</Code>, <Code>30m</Code>, <Code>1h</Code>, <Code>D</Code>, <Code>W</Code>, <Code>M</Code>. Shorter = intraday scalping; longer = swing / positional analysis.</div>
              <div><b>Chart types</b> — Candlestick (default), Line, Bar, Area. Switch from the top toolbar chart-type icon.</div>
              <div><b>Zoom</b> — scroll the mouse wheel on desktop, pinch on mobile.</div>
              <div><b>Pan</b> — click and drag the chart horizontally.</div>
              <div><b>Crosshair</b> — hover anywhere to reveal the exact <b>OHLCV</b> values at that candle.</div>
            </div>
          </section>

          <section id="chart-tools" className="scroll-mt-24">
            <h2 className="font-display text-xl md:text-2xl font-bold">5. Chart Tools Reference</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { icon: Crosshair, name: "Crosshair", desc: "Precise price/time cursor for reading any candle." },
                { icon: TrendingUp, name: "Trend Line", desc: "Click two points to draw support/resistance." },
                { icon: Minus, name: "Horizontal Line", desc: "Mark key price levels on the chart." },
                { icon: GitBranch, name: "Fibonacci Retracement", desc: "Drag swing high → low to plot retracement levels." },
                { icon: Square, name: "Rectangle", desc: "Highlight consolidation zones and ranges." },
                { icon: Type, name: "Text", desc: "Attach a note directly on the chart." },
                { icon: Ruler, name: "Measure", desc: "Measure price movement % and bars traversed." },
                { icon: ZoomIn, name: "Zoom", desc: "Zoom into a specific time range for detail." },
              ].map((t) => (
                <div key={t.name} className="rounded-lg border border-border/40 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2">
                    <t.icon className="h-4 w-4 text-primary" />
                    <div className="text-sm font-semibold">{t.name}</div>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{t.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="indicators" className="scroll-mt-24">
            <h2 className="font-display text-xl md:text-2xl font-bold">6. Indicators Guide</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr className="border-b border-border/40">
                    <th className="py-2 pr-4">Indicator</th>
                    <th className="py-2 pr-4">What it shows</th>
                    <th className="py-2 pr-4">How to add</th>
                    <th className="py-2">Settings tip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {[
                    ["RSI", "Momentum: overbought >70, oversold <30", "fx → Search 'RSI'", "Default 14 works well"],
                    ["MACD", "Momentum + crossovers signal buy/sell", "fx → Search 'MACD'", "12/26/9 is standard"],
                    ["SMA / EMA", "Trend direction, 20 / 50 / 200 day", "fx → 'Moving Average'", "200-EMA for long-term trend"],
                    ["Bollinger Bands", "Volatility bands around price", "fx → 'Bollinger Bands'", "20-period, 2 SD default"],
                    ["Volume", "Confirms strength of price moves", "Enabled by default", "Look for volume spikes"],
                    ["Supertrend", "Trend following with buy/sell arrows", "fx → 'Supertrend'", "10 period, 3 multiplier"],
                  ].map((row) => (
                    <tr key={row[0]}>
                      <td className="py-2 pr-4 font-semibold text-primary">{row[0]}</td>
                      <td className="py-2 pr-4">{row[1]}</td>
                      <td className="py-2 pr-4"><Code>{row[2]}</Code></td>
                      <td className="py-2 text-muted-foreground">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="candlesticks" className="scroll-mt-24">
            <h2 className="font-display text-xl md:text-2xl font-bold">7. Reading Candlesticks</h2>
            <p className="mt-3 text-sm">
              Each candle shows four prices: <b>Open</b>, <b>High</b>, <b>Low</b>, <b>Close</b>.
              A <span className="text-success font-semibold">green</span> candle closed higher than it opened;
              a <span className="text-destructive font-semibold">red</span> candle closed lower. Wicks show the intraday extremes.
            </p>
            <Tip>
              For the deep-dive on patterns (hammer, engulfing, doji, morning star), check the video course inside{" "}
              <Link to="/learn" className="text-primary underline">Learn</Link>.
            </Tip>
          </section>

          <section id="faqs" className="scroll-mt-24 pb-24">
            <h2 className="font-display text-xl md:text-2xl font-bold">8. FAQs</h2>
            <div className="mt-4 space-y-4 text-sm">
              {[
                { q: "Is this real money?", a: "No — 100% virtual. Nothing on NISHIRA.TRADE touches real cash." },
                { q: "Are the prices real?", a: "US stocks stream live from Finnhub. Indian stocks use a realistic live simulation based on last known market data." },
                { q: "Can I lose real money?", a: "Absolutely not. There is no funding, no withdrawals, no real brokerage." },
                { q: "How is brokerage calculated?", a: "A flat 0.1% of order value is simulated on every trade to mirror real-world costs." },
                { q: "Can I reset my balance?", a: "Not currently. Keeping the number honest is part of the practice." },
              ].map((f) => (
                <div key={f.q} className="rounded-lg border border-border/40 bg-white/[0.03] p-4">
                  <div className="font-semibold">Q: {f.q}</div>
                  <div className="mt-1 text-muted-foreground">A: {f.a}</div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
