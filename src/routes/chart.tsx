import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { ArrowLeft, Rocket, Menu, X, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getStock } from "@/lib/stocks";

const SYMBOL_MAP: Record<string, string> = {
  NIFTY: "NSE:NIFTY",
  BANKNIFTY: "NSE:BANKNIFTY",
  SENSEX: "BSE:SENSEX",
  RELIANCE: "NSE:RELIANCE",
  TCS: "NSE:TCS",
  INFY: "NSE:INFY",
  HDFCBANK: "NSE:HDFCBANK",
  HDFC: "NSE:HDFCBANK",
  WIPRO: "NSE:WIPRO",
  ICICIBANK: "NSE:ICICIBANK",
  ICICI: "NSE:ICICIBANK",
  SBIN: "NSE:SBIN",
  BAJAJ: "NSE:BAJFINANCE",
  TITAN: "NSE:TITAN",
  LT: "NSE:LT",
  AAPL: "NASDAQ:AAPL",
  TSLA: "NASDAQ:TSLA",
  NVDA: "NASDAQ:NVDA",
  GOOGL: "NASDAQ:GOOGL",
  MSFT: "NASDAQ:MSFT",
  AMZN: "NASDAQ:AMZN",
  META: "NASDAQ:META",
  NFLX: "NASDAQ:NFLX",
  AMD: "NASDAQ:AMD",
  UBER: "NYSE:UBER",
};

function normalizeSymbol(input: string): string {
  const s = input.trim().toUpperCase();
  if (!s) return "NSE:NIFTY";
  if (s.includes(":")) return s;
  return SYMBOL_MAP[s] ?? `NSE:${s}`;
}

function extractTicker(symbol: string): string {
  const idx = symbol.indexOf(":");
  return idx >= 0 ? symbol.slice(idx + 1) : symbol;
}

/** TradingView symbol names that differ from our tradable tickers */
const TRADE_ALIASES: Record<string, string> = {
  HDFCBANK: "HDFC",
  ICICIBANK: "ICICI",
  BAJFINANCE: "BAJAJ",
  LTIM: "LT",
};

/** Returns a tradable ticker for a TradingView symbol, or null (e.g. indices) */
function toTradableTicker(symbol: string): string | null {
  const raw = extractTicker(symbol).toUpperCase();
  const mapped = TRADE_ALIASES[raw] ?? raw;
  return getStock(mapped) ? mapped : null;
}

const PANEL = {
  Indices: [
    { label: "NIFTY 50", symbol: "NSE:NIFTY" },
    { label: "BANK NIFTY", symbol: "NSE:BANKNIFTY" },
    { label: "SENSEX", symbol: "BSE:SENSEX" },
  ],
  "Indian Stocks": [
    { label: "RELIANCE", symbol: "NSE:RELIANCE" },
    { label: "TCS", symbol: "NSE:TCS" },
    { label: "INFY", symbol: "NSE:INFY" },
    { label: "HDFCBANK", symbol: "NSE:HDFCBANK" },
    { label: "WIPRO", symbol: "NSE:WIPRO" },
    { label: "ICICIBANK", symbol: "NSE:ICICIBANK" },
    { label: "SBIN", symbol: "NSE:SBIN" },
  ],
  "US Stocks": [
    { label: "AAPL", symbol: "NASDAQ:AAPL" },
    { label: "TSLA", symbol: "NASDAQ:TSLA" },
    { label: "NVDA", symbol: "NASDAQ:NVDA" },
    { label: "GOOGL", symbol: "NASDAQ:GOOGL" },
    { label: "MSFT", symbol: "NASDAQ:MSFT" },
  ],
} as const;

const searchSchema = z.object({
  symbol: fallback(z.string(), "NSE:NIFTY").default("NSE:NIFTY"),
});

export const Route = createFileRoute("/chart")({
  ssr: false,
  validateSearch: zodValidator(searchSchema),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { mode: "login" } });
  },
  head: () => ({
    meta: [
      { title: "Live Chart — NISHIRA.TRADE" },
      { name: "description", content: "Full-screen TradingView chart for NSE, BSE, NYSE and NASDAQ stocks and indices." },
      { property: "og:title", content: "Live Chart — NISHIRA.TRADE" },
      { property: "og:description", content: "Real-time TradingView charts inside NISHIRA.TRADE." },
      { property: "og:url", content: "https://nishiratrade.lovable.app/chart" },
    ],
    links: [{ rel: "canonical", href: "https://nishiratrade.lovable.app/chart" }],
  }),
  component: ChartPage,
});

function ChartPage() {
  const { symbol: rawSymbol } = Route.useSearch();
  const navigate = useNavigate();
  const symbol = normalizeSymbol(rawSymbol);
  const [query, setQuery] = useState(symbol);
  const [panelOpen, setPanelOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setQuery(symbol), [symbol]);

  // Inject TradingView widget on every symbol change.
  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;
    host.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "tradingview-widget-container";
    wrapper.style.height = "100%";
    wrapper.style.width = "100%";

    const inner = document.createElement("div");
    inner.id = "tradingview_chart";
    inner.style.height = "calc(100% - 32px)";
    inner.style.width = "100%";
    wrapper.appendChild(inner);

    const copyright = document.createElement("div");
    copyright.className = "tradingview-widget-copyright";
    copyright.innerHTML =
      '<a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span class="blue-text">Track all markets on TradingView</span></a>';
    wrapper.appendChild(copyright);

    host.appendChild(wrapper);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: "D",
      timezone: "Asia/Kolkata",
      theme: "dark",
      style: "1",
      locale: "in",
      enable_publishing: false,
      withdateranges: true,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      watchlist: [
        "NSE:NIFTY",
        "NSE:BANKNIFTY",
        "BSE:SENSEX",
        "NSE:RELIANCE",
        "NSE:TCS",
        "NSE:INFY",
        "NSE:HDFCBANK",
        "NASDAQ:AAPL",
        "NASDAQ:TSLA",
        "NASDAQ:NVDA",
        "NYSE:MSFT",
      ],
      details: true,
      hotlist: true,
      calendar: false,
      show_popup_button: false,
      popup_width: "1000",
      popup_height: "650",
      no_referral_id: true,
      container_id: "tradingview_chart",
    });
    inner.appendChild(script);

    return () => {
      host.innerHTML = "";
    };
  }, [symbol]);

  const setSymbol = (next: string) => {
    navigate({ to: "/chart", search: { symbol: normalizeSymbol(next) }, replace: true });
    setPanelOpen(false);
  };

  const onSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSymbol(query);
  };

  const tradeTicker = extractTicker(symbol);

  return (
    <div className="flex h-screen w-full flex-col bg-[#0f0f0f] text-[#d1d4dc]">
      <h1 className="sr-only">Real-time Stock Market Chart</h1>
      {/* Top bar */}
      <header className="flex h-10 shrink-0 items-center gap-2 border-b border-[#2a2a2a] bg-[#1a1a1a] px-2 sm:px-3">
        <Link
          to="/dashboard"
          className="inline-flex h-7 items-center gap-1 rounded px-2 text-xs text-[#d1d4dc] hover:bg-[#2a2a2a]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Back</span>
        </Link>
        <div className="hidden items-center gap-1.5 border-l border-[#2a2a2a] pl-3 sm:flex">
          <Rocket className="h-3.5 w-3.5 text-primary" />
          <span className="font-display text-xs font-bold tracking-tight">
            NISHIRA<span className="text-primary">.TRADE</span>
          </span>
        </div>

        <form onSubmit={onSubmitSearch} className="mx-auto flex w-full max-w-md items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Symbol e.g. NSE:RELIANCE or AAPL"
            className="h-7 w-full rounded-l bg-[#0f0f0f] px-3 text-xs text-[#d1d4dc] outline-none ring-1 ring-[#2a2a2a] focus:ring-[#2962ff]"
          />
          <button
            type="submit"
            className="h-7 rounded-r bg-[#2962ff] px-3 text-xs font-medium text-white hover:opacity-90"
          >
            Go
          </button>
        </form>

        <Link
          to="/trade/$ticker"
          params={{ ticker: tradeTicker }}
          className="hidden h-7 items-center gap-1 rounded bg-[#26a69a] px-3 text-xs font-medium text-white hover:opacity-90 sm:inline-flex"
        >
          Trade This Stock <span aria-hidden>→</span>
        </Link>
        <button
          onClick={() => setPanelOpen((v) => !v)}
          className="ml-1 inline-flex h-7 items-center gap-1 rounded border border-[#2a2a2a] px-2 text-xs md:hidden"
          aria-label="Toggle stocks panel"
        >
          {panelOpen ? <X className="h-3.5 w-3.5" /> : <Menu className="h-3.5 w-3.5" />}
          Stocks
        </button>
      </header>

      {/* Main split */}
      <div className="relative flex min-h-0 flex-1">
        <div ref={containerRef} className="min-w-0 flex-1 bg-[#0f0f0f]" />

        {/* Desktop right panel */}
        <aside className="hidden w-[280px] shrink-0 overflow-y-auto border-l border-[#2a2a2a] bg-[#131722] md:block">
          <StocksPanel activeSymbol={symbol} onPick={setSymbol} />
        </aside>

        {/* Mobile drawer */}
        {panelOpen && (
          <div
            className="absolute inset-x-0 bottom-0 top-0 z-30 flex flex-col bg-[#131722]/95 backdrop-blur-md md:hidden"
          >
            <div className="flex items-center justify-between border-b border-[#2a2a2a] px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#787b86]">Stocks</span>
              <button onClick={() => setPanelOpen(false)} aria-label="Close" className="p-1">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <StocksPanel activeSymbol={symbol} onPick={setSymbol} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StocksPanel({
  activeSymbol,
  onPick,
}: {
  activeSymbol: string;
  onPick: (symbol: string) => void;
}) {
  return (
    <div className="py-2">
      {(Object.keys(PANEL) as Array<keyof typeof PANEL>).map((section) => (
        <div key={section} className="mb-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#787b86]">
            <TrendingUp className="h-3 w-3" />
            {section}
          </div>
          <ul>
            {PANEL[section].map((item) => {
              const active = item.symbol === activeSymbol;
              return (
                <li key={item.symbol}>
                  <button
                    onClick={() => onPick(item.symbol)}
                    className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition ${
                      active
                        ? "bg-[#2962ff]/15 text-[#2962ff]"
                        : "text-[#d1d4dc] hover:bg-[#1e222d]"
                    }`}
                  >
                    <span className="font-medium">{item.label}</span>
                    <span className="text-[10px] text-[#787b86]">{item.symbol}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
