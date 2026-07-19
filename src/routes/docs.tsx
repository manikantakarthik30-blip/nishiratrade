import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Rocket, Wallet, ShoppingCart, LineChart, PenTool, Activity,
  CandlestickChart, HelpCircle, Crosshair, Minus, TrendingUp,
  Square, Type, Ruler, ZoomIn, GitBranch, Sparkles, Brain,
  Download, Star, ShieldCheck, Trophy, Search, Menu, X,
} from "lucide-react";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Documentation — NISHIRA.TRADE" },
      { name: "description", content: "Master NISHIRA.TRADE: virtual balance, TradingView charts, NISHIRA.AI, Stock Analysis Lab, downloads, watchlist, 2FA and more." },
      { property: "og:title", content: "Documentation — NISHIRA.TRADE" },
      { property: "og:description", content: "The complete guide to paper trading with real market data." },
    ],
  }),
  component: DocsPage,
});

type Section = { id: string; title: string; icon: React.ComponentType<{ className?: string }>; group: string };

const sections: Section[] = [
  { id: "getting-started", title: "Getting Started", icon: Rocket, group: "Basics" },
  { id: "virtual-balance", title: "Virtual Balance", icon: Wallet, group: "Basics" },
  { id: "how-to-trade", title: "How to Trade", icon: ShoppingCart, group: "Basics" },

  { id: "tradingview", title: "TradingView Charts", icon: LineChart, group: "Charts" },
  { id: "chart-tools", title: "Chart Tools Reference", icon: PenTool, group: "Charts" },
  { id: "indicators", title: "Indicators", icon: Activity, group: "Charts" },
  { id: "candlesticks", title: "Reading Candlesticks", icon: CandlestickChart, group: "Charts" },

  { id: "nishira-ai", title: "NISHIRA.AI Assistant", icon: Sparkles, group: "AI & Data" },
  { id: "analysis-lab", title: "Stock Analysis Lab", icon: Brain, group: "AI & Data" },
  { id: "downloads", title: "Data & Report Downloads", icon: Download, group: "AI & Data" },
  { id: "watchlist", title: "Watchlist", icon: Star, group: "AI & Data" },

  { id: "leaderboard", title: "Leaderboard", icon: Trophy, group: "Account" },
  { id: "security", title: "Security & 2FA", icon: ShieldCheck, group: "Account" },

  { id: "faqs", title: "FAQs", icon: HelpCircle, group: "Help" },
];

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4 text-sm backdrop-blur-sm">
      <div className="mb-1 flex items-center gap-1.5 font-semibold text-emerald-300">
        <Sparkles className="h-3.5 w-3.5" /> Tip
      </div>
      <div className="text-foreground/90">{children}</div>
    </div>
  );
}
function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-4 text-sm backdrop-blur-sm">
      <div className="mb-1 font-semibold text-amber-300">Note</div>
      <div className="text-foreground/90">{children}</div>
    </div>
  );
}
function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[0.8em] text-primary ring-1 ring-primary/20">
      {children}
    </code>
  );
}
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-md border border-border/60 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.7rem] text-foreground/80 shadow-sm">
      {children}
    </kbd>
  );
}

function DocsPage() {
  const [active, setActive] = useState(sections[0].id);
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

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
    setMobileOpen(false);
  };

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? sections.filter((s) => s.title.toLowerCase().includes(q)) : sections;
    return list.reduce<Record<string, Section[]>>((acc, s) => {
      (acc[s.group] ||= []).push(s);
      return acc;
    }, {});
  }, [query]);

  return (
    <div
      className="docs-container relative min-h-screen overflow-x-hidden"
      style={{
        background:
          "radial-gradient(1200px 600px at 10% -10%, rgba(124,58,237,0.18), transparent 60%), radial-gradient(900px 500px at 100% 10%, rgba(0,212,255,0.15), transparent 60%), #05041a",
      }}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#05041a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <Rocket className="h-5 w-5 shrink-0 text-primary" />
            <span className="truncate font-display text-sm font-bold md:text-base">
              NISHIRA<span className="text-primary">.TRADE</span>
              <span className="ml-2 text-xs font-normal text-muted-foreground">/ docs</span>
            </span>
          </Link>
          <nav className="flex shrink-0 items-center gap-3 text-sm">
            <button
              className="rounded-md p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle contents"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/" className="hidden text-muted-foreground hover:text-foreground sm:inline">Home</Link>
            <Link to="/dashboard" className="rounded-md bg-primary/15 px-3 py-1.5 text-primary ring-1 ring-primary/30 hover:bg-primary/25">
              Open App →
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row md:gap-10 md:px-6 md:py-10">
        {/* Sidebar TOC */}
        <aside
          className={`${
            mobileOpen ? "block" : "hidden"
          } md:sticky md:top-20 md:block md:h-[calc(100vh-6rem)] md:w-[260px] md:shrink-0 md:overflow-y-auto`}
        >
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search docs…"
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <nav className="flex flex-col gap-5">
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <div className="mb-2 px-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                  {group}
                </div>
                <div className="flex flex-col gap-0.5">
                  {items.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => scrollTo(s.id)}
                      className={`group relative flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                        active === s.id
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                      }`}
                    >
                      {active === s.id && (
                        <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary" />
                      )}
                      <s.icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{s.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {Object.keys(grouped).length === 0 && (
              <div className="px-3 text-sm text-muted-foreground">No sections match "{query}".</div>
            )}
          </nav>
        </aside>

        {/* Content */}
        <main className="docs-content min-w-0 max-w-full flex-1 space-y-14 break-words text-sm text-foreground/90 md:space-y-20 md:text-base">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-10">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl" />
            <div className="relative">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" /> v2 · Updated Jul 2026
              </div>
              <h1 className="font-display text-3xl font-bold leading-tight md:text-5xl">
                Documentation
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                Everything you need to master paper trading on NISHIRA.TRADE — from your first
                order to AI-powered stock analysis, exports, and account security.
              </p>
            </div>
          </div>

          {/* BASICS */}
          <section id="getting-started" className="scroll-mt-24">
            <h2 className="font-display text-2xl font-bold md:text-3xl">1. Getting Started</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-sm">
              <li>Sign up with <b>Google</b>, <b>email + password</b>, or <b>mobile + password</b>.</li>
              <li>You instantly receive <Code>₹10,00,000</Code> and <Code>$10,000</Code> in virtual balance.</li>
              <li>Practice with real market prices — <b>zero real money at risk</b>.</li>
            </ul>
            <Tip>Google sign-in is the fastest way to get started — one click and you're in.</Tip>
          </section>

          <section id="virtual-balance" className="scroll-mt-24">
            <h2 className="font-display text-2xl font-bold md:text-3xl">2. Virtual Balance</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-sm">
              <li><b>INR balance</b> — used for Indian stocks (NSE / BSE).</li>
              <li><b>USD balance</b> — used for US stocks (NASDAQ / NYSE).</li>
              <li>P&amp;L is tracked in real time on the Dashboard and Portfolio pages.</li>
              <li>Balance is always visible in the header — dual pill on desktop, compact "₹10.0L" on mobile.</li>
            </ul>
            <Note>Balance resets aren't allowed by design — keeping the number honest is the point.</Note>
          </section>

          <section id="how-to-trade" className="scroll-mt-24">
            <h2 className="font-display text-2xl font-bold md:text-3xl">3. How to Trade</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-6 text-sm">
              <li>Open <b>Markets</b> → search or browse stocks.</li>
              <li>Click any stock → opens the <b>Trade</b> page (chart + order panel).</li>
              <li>Or hit the floating <b>Quick Trade</b> drawer from anywhere.</li>
              <li>Choose <b>BUY</b> / <b>SELL</b>, then <b>Market</b> or <b>Limit</b>.</li>
              <li>Enter <b>quantity</b>, review total + brokerage, tap <b>Place Order</b>.</li>
              <li>Check <b>Portfolio</b> for holdings and live P&amp;L.</li>
            </ol>
            <Tip>Start small — 1 share of your favorite stock and watch the P&amp;L tick in real time.</Tip>
          </section>

          {/* CHARTS */}
          <section id="tradingview" className="scroll-mt-24">
            <h2 className="font-display text-2xl font-bold md:text-3xl">4. TradingView Charts</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Every Trade page embeds the official TradingView Advanced Chart with real NSE / BSE / NYSE data.
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <div><b>Timeframes</b> — <Code>1m</Code>, <Code>5m</Code>, <Code>30m</Code>, <Code>1h</Code>, <Code>D</Code>, <Code>W</Code>, <Code>M</Code>.</div>
              <div><b>Chart types</b> — Candlestick (default), Line, Bar, Area.</div>
              <div><b>Zoom</b> — mouse wheel on desktop, pinch on mobile. <b>Pan</b> — click-drag horizontally.</div>
              <div><b>Crosshair</b> — hover to reveal exact <b>OHLCV</b> at any candle.</div>
            </div>
          </section>

          <section id="chart-tools" className="scroll-mt-24">
            <h2 className="font-display text-2xl font-bold md:text-3xl">5. Chart Tools Reference</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { icon: Crosshair, name: "Crosshair", desc: "Precise price / time cursor for reading any candle." },
                { icon: TrendingUp, name: "Trend Line", desc: "Click two points to draw support / resistance." },
                { icon: Minus, name: "Horizontal Line", desc: "Mark key price levels on the chart." },
                { icon: GitBranch, name: "Fibonacci Retracement", desc: "Drag swing high → low for retracement levels." },
                { icon: Square, name: "Rectangle", desc: "Highlight consolidation zones and ranges." },
                { icon: Type, name: "Text", desc: "Attach a note directly on the chart." },
                { icon: Ruler, name: "Measure", desc: "Measure price movement % and bars traversed." },
                { icon: ZoomIn, name: "Zoom", desc: "Zoom into a specific time range for detail." },
              ].map((t) => (
                <div key={t.name} className="group rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white/[0.05]">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-primary/10 p-1.5 text-primary ring-1 ring-primary/20">
                      <t.icon className="h-4 w-4" />
                    </div>
                    <div className="text-sm font-semibold">{t.name}</div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{t.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="indicators" className="scroll-mt-24">
            <h2 className="font-display text-2xl font-bold md:text-3xl">6. Indicators</h2>
            <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-white/[0.04] text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5">Indicator</th>
                    <th className="px-4 py-2.5">What it shows</th>
                    <th className="px-4 py-2.5">How to add</th>
                    <th className="px-4 py-2.5">Settings tip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    ["RSI", "Momentum: overbought >70, oversold <30", "fx → Search 'RSI'", "Default 14 works well"],
                    ["MACD", "Momentum + crossovers signal buy / sell", "fx → Search 'MACD'", "12 / 26 / 9 is standard"],
                    ["SMA / EMA", "Trend direction — 20 / 50 / 200 day", "fx → 'Moving Average'", "200-EMA for long-term trend"],
                    ["Bollinger Bands", "Volatility bands around price", "fx → 'Bollinger Bands'", "20-period, 2 SD default"],
                    ["Volume", "Confirms strength of price moves", "Enabled by default", "Look for volume spikes"],
                    ["Supertrend", "Trend-following with buy / sell arrows", "fx → 'Supertrend'", "10 period, 3 multiplier"],
                  ].map((row) => (
                    <tr key={row[0]} className="hover:bg-white/[0.03]">
                      <td className="px-4 py-2.5 font-semibold text-primary">{row[0]}</td>
                      <td className="px-4 py-2.5">{row[1]}</td>
                      <td className="px-4 py-2.5"><Code>{row[2]}</Code></td>
                      <td className="px-4 py-2.5 text-muted-foreground">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="candlesticks" className="scroll-mt-24">
            <h2 className="font-display text-2xl font-bold md:text-3xl">7. Reading Candlesticks</h2>
            <p className="mt-3 text-sm">
              Each candle shows four prices: <b>Open</b>, <b>High</b>, <b>Low</b>, <b>Close</b>.
              A <span className="font-semibold text-emerald-400">green</span> candle closed higher than it opened;
              a <span className="font-semibold text-red-400">red</span> candle closed lower. Wicks show intraday extremes.
            </p>
            <Tip>
              For the deep-dive on patterns (hammer, engulfing, doji, morning star), check the video course inside{" "}
              <Link to="/learn" className="text-primary underline">Learn</Link>.
            </Tip>
          </section>

          {/* AI & DATA — NEW */}
          <section id="nishira-ai" className="scroll-mt-24">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wider text-primary">
              New
            </div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">8. NISHIRA.AI Assistant</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              A Gemini-powered trading tutor floating on every page as a 🚀 button.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-sm">
              <li><b>Drag it anywhere</b> — snaps to the nearest corner and saves position across sessions.</li>
              <li>Ask about candlestick patterns, indicators, strategies, position sizing, or specific concepts.</li>
              <li>Education-only guardrails — it will <b>never</b> tell you what to buy or predict prices.</li>
              <li>Markdown-rich answers with suggestion chips to keep the conversation moving.</li>
            </ul>
            <Note>If Google's free tier is rate-limited, the assistant transparently falls back to a backup model — you rarely see errors.</Note>
          </section>

          <section id="analysis-lab" className="scroll-mt-24">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wider text-primary">
              New
            </div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">9. Stock Analysis Lab</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Open the <b>Analysis</b> tab (brain icon) in the header to generate structured technical reports.
            </p>
            <ol className="mt-4 list-decimal space-y-2 pl-6 text-sm">
              <li>Search a ticker and add it to the <b>Stock Queue</b>.</li>
              <li>Click <b>Generate Report</b> — the AI returns a 7-section breakdown.</li>
              <li>Review: Overview · Trend · Momentum · Support / Resistance · Volume · Risks · Educational Insight.</li>
              <li>Export as <b>Excel</b>, <b>PDF</b>, or <b>Word</b> from the download menu.</li>
            </ol>
            <Tip>Reports are cached for 5 minutes per ticker — regenerating instantly returns the last result with no API cost.</Tip>
          </section>

          <section id="downloads" className="scroll-mt-24">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wider text-primary">
              New
            </div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">10. Data &amp; Report Downloads</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-1 flex items-center gap-2 font-semibold"><Download className="h-4 w-4 text-primary" /> Portfolio &amp; Trades</div>
                <p className="text-xs text-muted-foreground">Export holdings and full trade history as CSV or XLSX from the Portfolio and Dashboard pages.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-1 flex items-center gap-2 font-semibold"><Download className="h-4 w-4 text-primary" /> Stock OHLC History</div>
                <p className="text-xs text-muted-foreground">On any Trade page, hit <b>Download Data</b>, pick a date range + format (CSV / XLSX).</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-1 flex items-center gap-2 font-semibold"><Download className="h-4 w-4 text-primary" /> Analysis Reports</div>
                <p className="text-xs text-muted-foreground">Analysis Lab reports export to <b>Excel</b>, <b>PDF</b>, or <b>Word</b> — ready to share or archive.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-1 flex items-center gap-2 font-semibold"><Download className="h-4 w-4 text-primary" /> Everything is offline-ready</div>
                <p className="text-xs text-muted-foreground">Files are generated client-side — no server round-trips, private by default.</p>
              </div>
            </div>
          </section>

          <section id="watchlist" className="scroll-mt-24">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wider text-primary">
              New
            </div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">11. Watchlist</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-sm">
              <li>On the <b>Markets</b> page, tap the <Star className="mb-0.5 inline h-4 w-4 text-yellow-400" /> in the top-right of any stock card to add / remove.</li>
              <li>Your watchlist lives on the Dashboard with live prices and quick trade access.</li>
              <li>Stored securely per user — visible only to you.</li>
            </ul>
          </section>

          {/* ACCOUNT */}
          <section id="leaderboard" className="scroll-mt-24">
            <h2 className="font-display text-2xl font-bold md:text-3xl">12. Leaderboard</h2>
            <p className="mt-3 text-sm">
              Ranked by <b>portfolio value</b>. Toggle between <b>🌐 Global</b>, <b>🇮🇳 India</b>, and <b>🇺🇸 USA</b>
              to see market-specific traders and returns in the right currency.
            </p>
          </section>

          <section id="security" className="scroll-mt-24">
            <h2 className="font-display text-2xl font-bold md:text-3xl">13. Security &amp; 2FA</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-sm">
              <li>Open <b>Security</b> from your profile menu to enable <b>TOTP 2FA</b> (Google Authenticator / Authy).</li>
              <li>Change password, review <b>login activity</b>, or <b>delete your account</b> permanently.</li>
              <li>Forgot your password? Use the <Link to="/forgot-password" className="text-primary underline">/forgot-password</Link> flow.</li>
              <li>Sessions auto-warn after <b>30 minutes</b> of inactivity for safety.</li>
            </ul>
          </section>

          {/* FAQ */}
          <section id="faqs" className="scroll-mt-24 pb-24">
            <h2 className="font-display text-2xl font-bold md:text-3xl">14. FAQs</h2>
            <div className="mt-4 space-y-3 text-sm">
              {[
                { q: "Is this real money?", a: "No — 100% virtual. Nothing on NISHIRA.TRADE touches real cash." },
                { q: "Are the prices real?", a: "US stocks stream live via Finnhub. Indian stocks use live data from a broker feed with a realistic simulation fallback." },
                { q: "Can I lose real money?", a: "Absolutely not. No funding, no withdrawals, no real brokerage." },
                { q: "How is brokerage calculated?", a: "A flat 0.1% of order value is simulated on every trade to mirror real-world costs." },
                { q: "Can I reset my balance?", a: "Not currently — keeping the number honest is part of the practice." },
                { q: "How is my data protected?", a: "Row-level security on the database, TOTP 2FA, and encrypted sessions. Only you can see your holdings." },
                { q: "Does NISHIRA.AI give buy / sell tips?", a: "Never. It's an educational tutor — it explains concepts, patterns, and strategy, not predictions." },
                { q: "Which browsers are supported?", a: "Latest Chrome, Edge, Safari, Firefox. Mobile web works fully; use Add to Home Screen for an app-like feel." },
              ].map((f) => (
                <details key={f.q} className="group rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-primary/30">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                    <span>Q: {f.q}</span>
                    <span className="text-muted-foreground transition group-open:rotate-45"><Kbd>+</Kbd></span>
                  </summary>
                  <div className="mt-2 text-muted-foreground">A: {f.a}</div>
                </details>
              ))}
            </div>

            {/* Footer CTA */}
            <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent p-6 md:flex-row md:items-center">
              <div>
                <div className="font-display text-lg font-bold">Ready to place your first order?</div>
                <div className="text-sm text-muted-foreground">Jump into the app — your ₹10L + $10k virtual balance is waiting.</div>
              </div>
              <Link to="/dashboard" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                Open Dashboard →
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
