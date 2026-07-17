import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import {
  MousePointer2,
  TrendingUp,
  Minus,
  Waves,
  Square,
  Type,
  Brush,
  Ruler,
  ZoomIn,
  Search,
  Bell,
  GitCompare,
  LineChart,
  Save,
  Camera,
  Plus,
  LayoutGrid,
} from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/chart")({
  validateSearch: z.object({ symbol: z.string().optional() }),
  component: ChartPage,
});

// ---------- Data ----------
type Sym = {
  symbol: string;
  name: string;
  exchange: string;
  type: "Index" | "Stock";
  base: number;
  vol: number; // daily volatility
  unit?: string;
  color: string;
};

const SYMBOLS: Sym[] = [
  { symbol: "NIFTY", name: "Nifty 50 Index", exchange: "NSE", type: "Index", base: 24000, vol: 0.008, unit: "POINT", color: "#f59e0b" },
  { symbol: "BANKNIFTY", name: "Bank Nifty Index", exchange: "NSE", type: "Index", base: 58000, vol: 0.012, unit: "POINT", color: "#8b5cf6" },
  { symbol: "SENSEX", name: "BSE Sensex", exchange: "BSE", type: "Index", base: 78000, vol: 0.008, unit: "POINT", color: "#ef4444" },
  { symbol: "CNXIT", name: "Nifty IT Index", exchange: "NSE", type: "Index", base: 29000, vol: 0.011, unit: "POINT", color: "#06b6d4" },
  { symbol: "SPX", name: "S&P 500", exchange: "SP", type: "Index", base: 5537, vol: 0.007, unit: "POINT", color: "#3b82f6" },
  { symbol: "RELIANCE", name: "Reliance Industries", exchange: "NSE", type: "Stock", base: 1300, vol: 0.015, color: "#0ea5e9" },
  { symbol: "AXISBANK", name: "Axis Bank", exchange: "NSE", type: "Stock", base: 1320, vol: 0.014, color: "#a855f7" },
  { symbol: "HDFCBANK", name: "HDFC Bank", exchange: "NSE", type: "Stock", base: 1800, vol: 0.010, color: "#22c55e" },
];

const INDICES = ["NIFTY", "BANKNIFTY", "SENSEX", "CNXIT", "SPX"];
const STOCKS = ["RELIANCE", "AXISBANK", "HDFCBANK"];

const TIMEFRAMES = [
  { key: "1D", label: "1D", count: 390, stepSec: 60 },
  { key: "5D", label: "5D", count: 5 * 7, stepSec: 3600 },
  { key: "1M", label: "1M", count: 30, stepSec: 86400 },
  { key: "3M", label: "3M", count: 90, stepSec: 86400 },
  { key: "6M", label: "6M", count: 180, stepSec: 86400 },
  { key: "YTD", label: "YTD", count: 200, stepSec: 86400 },
  { key: "1Y", label: "1Y", count: 252, stepSec: 86400 },
  { key: "5Y", label: "5Y", count: 260, stepSec: 604800 },
  { key: "All", label: "All", count: 520, stepSec: 604800 },
] as const;
type TF = typeof TIMEFRAMES[number]["key"];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Candle = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

function genHistory(sym: Sym, tf: (typeof TIMEFRAMES)[number]): Candle[] {
  const rng = mulberry32(hash(sym.symbol) + hash(tf.key));
  const out: Candle[] = [];
  const now = Math.floor(Date.now() / 1000);
  const alignedEnd = Math.floor(now / tf.stepSec) * tf.stepSec;
  let close = sym.base * (0.92 + rng() * 0.05);
  const drift = (rng() - 0.4) * 0.0006;
  for (let i = tf.count - 1; i >= 0; i--) {
    const t = (alignedEnd - i * tf.stepSec) as UTCTimestamp;
    const shock = (rng() - 0.5) * 2 * sym.vol;
    const open = close * (1 + (rng() - 0.5) * sym.vol * 0.2);
    close = Math.max(0.01, open * (1 + drift + shock));
    const hi = Math.max(open, close) * (1 + rng() * sym.vol * 0.6);
    const lo = Math.min(open, close) * (1 - rng() * sym.vol * 0.6);
    const volume = Math.floor(1_000_000 + rng() * 8_000_000);
    out.push({
      time: t,
      open: +open.toFixed(2),
      high: +hi.toFixed(2),
      low: +lo.toFixed(2),
      close: +close.toFixed(2),
      volume,
    });
  }
  return out;
}

function fmt(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}
function fmtVol(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return String(n);
}

// ---------- Watchlist row (live prices) ----------
function useLive(base: number, vol: number, seed: number) {
  const [price, setPrice] = useState(base);
  const [prev] = useState(base);
  useEffect(() => {
    const rng = mulberry32(seed);
    const id = setInterval(() => {
      setPrice((p) => {
        const change = (rng() - 0.5) * 2 * vol * 0.3 * base;
        return Math.max(0.01, p + change);
      });
    }, 3000);
    return () => clearInterval(id);
  }, [base, vol, seed]);
  return { price, chg: price - prev, pct: ((price - prev) / prev) * 100 };
}

function WatchlistRow({
  sym,
  active,
  onClick,
}: {
  sym: Sym;
  active: boolean;
  onClick: () => void;
}) {
  // seed initial price bias per symbol to match spec-ish values
  const seed = useMemo(() => hash(sym.symbol), [sym.symbol]);
  const initial = useMemo(() => {
    const rng = mulberry32(seed);
    return sym.base * (1 + (rng() - 0.3) * 0.05);
  }, [sym.base, seed]);
  const [price, setPrice] = useState(initial);
  const startRef = useRef(initial * (1 - (sym.vol * (Math.random() - 0.5))));
  useEffect(() => {
    const rng = mulberry32(seed + 1);
    const id = setInterval(() => {
      setPrice((p) => Math.max(0.01, p * (1 + (rng() - 0.5) * sym.vol * 0.4)));
    }, 3000);
    return () => clearInterval(id);
  }, [seed, sym.vol]);
  const chg = price - startRef.current;
  const pct = (chg / startRef.current) * 100;
  const up = chg >= 0;
  return (
    <button
      onClick={onClick}
      className={`grid w-full grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-[#2a2a2a] px-3 py-2 text-left text-xs transition-colors hover:bg-[#232323] ${active ? "bg-[#1c2a44]" : ""}`}
    >
      <div className="min-w-0">
        <div className="truncate font-semibold text-[#d1d4dc]">{sym.symbol}</div>
      </div>
      <div className="text-right font-mono text-[#d1d4dc]">{fmt(price)}</div>
      <div className={`min-w-[54px] text-right font-mono ${up ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
        {up ? "+" : ""}
        {pct.toFixed(2)}%
      </div>
    </button>
  );
}

// ---------- Left toolbar ----------
const TOOLS = [
  { icon: MousePointer2, name: "Cursor" },
  { icon: TrendingUp, name: "Trend Line" },
  { icon: Minus, name: "Horizontal Line" },
  { icon: Waves, name: "Fib Retracement" },
  { icon: Square, name: "Rectangle" },
  { icon: Type, name: "Text" },
  { icon: Brush, name: "Brush" },
  { icon: Ruler, name: "Measure" },
  { icon: ZoomIn, name: "Zoom" },
];

// ---------- Page ----------
function ChartPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const initialSym = SYMBOLS.find((s) => s.symbol === (search.symbol ?? "").toUpperCase()) ?? SYMBOLS[0];
  const [symbol, setSymbol] = useState<string>(initialSym.symbol);
  const [tfKey, setTfKey] = useState<TF>("1M");
  const sym = SYMBOLS.find((s) => s.symbol === symbol) ?? SYMBOLS[0];
  const tf = TIMEFRAMES.find((t) => t.key === tfKey)!;
  const [activeTool, setActiveTool] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const lastRef = useRef<Candle | null>(null);
  const [hover, setHover] = useState<Candle | null>(null);
  const [livePrice, setLivePrice] = useState<number>(sym.base);

  // Init chart
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const chart = createChart(el, {
      layout: { background: { color: "#0f0f0f" }, textColor: "#d1d4dc" },
      grid: { vertLines: { color: "#1e1e1e" }, horzLines: { color: "#1e1e1e" } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "#2a2a2a" },
      timeScale: { borderColor: "#2a2a2a", timeVisible: true, secondsVisible: false },
      width: el.clientWidth,
      height: el.clientHeight,
    });
    const candle = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });
    const vol = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    chartRef.current = chart;
    candleRef.current = candle;
    volRef.current = vol;

    const ro = new ResizeObserver(() => {
      if (!containerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    });
    ro.observe(el);

    chart.subscribeCrosshairMove((p) => {
      if (!p.time || !candleRef.current) {
        setHover(null);
        return;
      }
      const cd = p.seriesData.get(candleRef.current) as
        | { open: number; high: number; low: number; close: number }
        | undefined;
      const vd = volRef.current ? (p.seriesData.get(volRef.current) as { value: number } | undefined) : undefined;
      if (cd) {
        setHover({
          time: p.time as UTCTimestamp,
          open: cd.open,
          high: cd.high,
          low: cd.low,
          close: cd.close,
          volume: vd?.value ?? 0,
        });
      }
    });

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volRef.current = null;
    };
  }, []);

  // Load data on symbol/timeframe change
  useEffect(() => {
    if (!candleRef.current || !volRef.current || !chartRef.current) return;
    const rows = genHistory(sym, tf);
    candleRef.current.setData(rows);
    volRef.current.setData(
      rows.map((c) => ({
        time: c.time,
        value: c.volume,
        color: c.close >= c.open ? "#26a69a80" : "#ef535080",
      })),
    );
    lastRef.current = rows[rows.length - 1];
    setLivePrice(rows[rows.length - 1].close);
    chartRef.current.timeScale().fitContent();
  }, [sym, tf]);

  // Live tick
  useEffect(() => {
    const id = setInterval(() => {
      const last = lastRef.current;
      if (!last || !candleRef.current || !volRef.current) return;
      const pct = (Math.random() - 0.5) * sym.vol * 0.4;
      const price = Math.max(0.01, last.close * (1 + pct));
      const updated: Candle = {
        ...last,
        high: Math.max(last.high, price),
        low: Math.min(last.low, price),
        close: +price.toFixed(2),
        volume: last.volume + Math.floor(Math.random() * 50000),
      };
      lastRef.current = updated;
      candleRef.current.update({
        time: updated.time,
        open: updated.open,
        high: updated.high,
        low: updated.low,
        close: updated.close,
      });
      volRef.current.update({
        time: updated.time,
        value: updated.volume,
        color: updated.close >= updated.open ? "#26a69a80" : "#ef535080",
      });
      setLivePrice(updated.close);
    }, 2000);
    return () => clearInterval(id);
  }, [sym]);

  const shown = hover ?? lastRef.current;
  const chg = shown ? shown.close - shown.open : 0;
  const pct = shown ? (chg / shown.open) * 100 : 0;
  const up = chg >= 0;

  const spread = livePrice * 0.0005;
  const bid = livePrice - spread / 2;
  const ask = livePrice + spread / 2;

  const pickSymbol = (s: string) => {
    setSymbol(s);
    navigate({ search: { symbol: s }, replace: true });
  };

  return (
    <div className="-m-4 flex h-[calc(100vh-3.5rem)] flex-col bg-[#0f0f0f] text-[#d1d4dc] md:-m-8">
      {/* Top toolbar */}
      <div className="flex h-10 items-center gap-2 border-b border-[#2a2a2a] bg-[#1e1e1e] px-3 text-xs">
        <div className="flex items-center gap-2 rounded border border-[#2a2a2a] bg-[#0f0f0f] px-2 py-1">
          <Search className="h-3.5 w-3.5 text-[#787b86]" />
          <span className="font-semibold tracking-wide">{sym.symbol}</span>
          <span className="text-[#787b86]">{sym.exchange}</span>
        </div>
        <div className="mx-2 h-5 w-px bg-[#2a2a2a]" />
        <div className="flex items-center gap-0.5">
          {TIMEFRAMES.map((t) => (
            <button
              key={t.key}
              onClick={() => setTfKey(t.key)}
              className={`rounded px-2 py-1 font-medium transition-colors ${tfKey === t.key ? "bg-[#2a2e39] text-white" : "text-[#787b86] hover:bg-[#2a2a2a] hover:text-[#d1d4dc]"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="mx-2 h-5 w-px bg-[#2a2a2a]" />
        <ToolbarBtn icon={LineChart} label="Indicators" />
        <ToolbarBtn icon={GitCompare} label="Compare" />
        <ToolbarBtn icon={Bell} label="Alert" />

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded bg-[#0f0f0f] px-2 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#26a69a] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#26a69a]" />
            </span>
            <span className="text-[10px] font-bold text-[#26a69a]">LIVE</span>
          </div>
          <ToolbarBtn icon={Save} label="Save" />
          <ToolbarBtn icon={Camera} label="Snapshot" />
          <button className="rounded bg-[#2962ff] px-3 py-1 text-xs font-semibold text-white hover:bg-[#1e50e0]">
            Trade
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left toolbar */}
        <div className="flex w-[36px] shrink-0 flex-col items-center gap-1 border-r border-[#2a2a2a] bg-[#1a1a1a] py-2">
          {TOOLS.map((t, i) => (
            <button
              key={t.name}
              title={t.name}
              onClick={() => setActiveTool(i)}
              className={`group relative flex h-8 w-8 items-center justify-center rounded transition-colors ${activeTool === i ? "bg-[#2962ff]/20 text-[#2962ff]" : "text-[#787b86] hover:bg-[#2a2a2a] hover:text-[#d1d4dc]"}`}
            >
              <t.icon className="h-4 w-4" />
              <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded bg-[#2a2a2a] px-2 py-1 text-[10px] opacity-0 shadow-lg group-hover:opacity-100">
                {t.name}
              </span>
            </button>
          ))}
        </div>

        {/* Chart area */}
        <div className="relative flex-1 overflow-hidden">
          {/* OHLC info bar */}
          <div className="pointer-events-none absolute left-3 top-2 z-10 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
            <span className="font-semibold text-[#d1d4dc]">
              {sym.symbol} <span className="text-[#787b86]">·</span> {tf.label} <span className="text-[#787b86]">·</span> {sym.exchange}
            </span>
            {shown && (
              <>
                <span className="text-[#787b86]">
                  O <span className={up ? "text-[#26a69a]" : "text-[#ef5350]"}>{fmt(shown.open)}</span>
                </span>
                <span className="text-[#787b86]">
                  H <span className={up ? "text-[#26a69a]" : "text-[#ef5350]"}>{fmt(shown.high)}</span>
                </span>
                <span className="text-[#787b86]">
                  L <span className={up ? "text-[#26a69a]" : "text-[#ef5350]"}>{fmt(shown.low)}</span>
                </span>
                <span className="text-[#787b86]">
                  C <span className={up ? "text-[#26a69a]" : "text-[#ef5350]"}>{fmt(shown.close)}</span>
                </span>
                <span className={up ? "text-[#26a69a]" : "text-[#ef5350]"}>
                  {up ? "+" : ""}
                  {chg.toFixed(2)} ({up ? "+" : ""}
                  {pct.toFixed(2)}%)
                </span>
                <span className="text-[#787b86]">
                  Vol <span className="text-[#d1d4dc]">{fmtVol(shown.volume)}</span>
                </span>
              </>
            )}
          </div>

          {/* Bid/Ask pills */}
          <div className="pointer-events-none absolute right-16 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1">
            <div className="rounded bg-[#ef5350] px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">
              SELL {fmt(bid)}
            </div>
            <div className="rounded bg-[#26a69a] px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">
              BUY {fmt(ask)}
            </div>
          </div>

          <div ref={containerRef} className="h-full w-full" />
        </div>

        {/* Right panel */}
        <div className="flex w-[280px] shrink-0 flex-col border-l border-[#2a2a2a] bg-[#1a1a1a]">
          {/* Watchlist */}
          <div className="flex items-center justify-between border-b border-[#2a2a2a] px-3 py-2">
            <div className="text-xs font-semibold">Watchlist ▾</div>
            <div className="flex items-center gap-1">
              <button className="rounded p-1 text-[#787b86] hover:bg-[#2a2a2a] hover:text-[#d1d4dc]">
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button className="rounded p-1 text-[#787b86] hover:bg-[#2a2a2a] hover:text-[#d1d4dc]">
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#787b86]">
              Indices
            </div>
            {INDICES.map((s) => {
              const sy = SYMBOLS.find((x) => x.symbol === s)!;
              return <WatchlistRow key={s} sym={sy} active={sy.symbol === symbol} onClick={() => pickSymbol(sy.symbol)} />;
            })}
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#787b86]">
              Stocks
            </div>
            {STOCKS.map((s) => {
              const sy = SYMBOLS.find((x) => x.symbol === s)!;
              return <WatchlistRow key={s} sym={sy} active={sy.symbol === symbol} onClick={() => pickSymbol(sy.symbol)} />;
            })}
          </div>

          {/* Detail card */}
          <div className="border-t border-[#2a2a2a] p-3">
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: sym.color }}
              >
                {sym.symbol.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold">{sym.name} ↗</div>
                <div className="flex items-center gap-1 text-[10px] text-[#787b86]">
                  <span>{sym.exchange}</span>
                  <span className="rounded bg-[#2a2a2a] px-1 py-0.5 text-[9px]">{sym.type}</span>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold">{fmt(livePrice)}</span>
                {sym.unit && <span className="text-[10px] text-[#787b86]">{sym.unit}</span>}
              </div>
              <div className={`text-xs ${up ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
                {up ? "+" : ""}
                {chg.toFixed(2)} {up ? "+" : ""}
                {pct.toFixed(2)}%
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[#787b86]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#787b86]" />
              Market closed · {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
            <button className="mt-3 w-full rounded bg-[#7c3aed] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#6d28d9]">
              Sign in to read exclusive news ›
            </button>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
              {[
                { k: "1W", v: 0.87 },
                { k: "1M", v: 1.21 },
                { k: "3M", v: 0.7 },
              ].map((p) => (
                <div key={p.k} className="rounded bg-[#0f0f0f] p-1.5">
                  <div className="text-[#787b86]">{p.k}</div>
                  <div className="text-[#26a69a]">{p.v.toFixed(2)}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolbarBtn({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <button className="flex items-center gap-1 rounded px-2 py-1 text-[#d1d4dc] hover:bg-[#2a2a2a]">
      <Icon className="h-3.5 w-3.5" />
      <span className="text-xs">{label}</span>
    </button>
  );
}
