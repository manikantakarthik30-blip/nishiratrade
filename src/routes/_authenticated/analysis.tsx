import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Download, Loader2, Search, Sparkles, TrendingUp, X } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STOCKS_BY_TICKER, livePrice, livePctChange } from "@/lib/stocks";
import { useTicker } from "@/hooks/useLivePrices";
import { generateStockAnalysis, type AnalysisReport } from "@/lib/analysis.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/analysis")({
  component: AnalysisPage,
});

// Master search list (per spec)
type MasterEntry = { ticker: string; name: string; market: "IN" | "US" };
const IN_LIST: [string, string][] = [
  ["RELIANCE", "Reliance Industries"], ["TCS", "Tata Consultancy Services"],
  ["INFY", "Infosys"], ["HDFCBANK", "HDFC Bank"], ["WIPRO", "Wipro"],
  ["ICICIBANK", "ICICI Bank"], ["SBIN", "State Bank of India"],
  ["AXISBANK", "Axis Bank"], ["BAJAJ-AUTO", "Bajaj Auto"],
  ["LT", "Larsen & Toubro"], ["TITAN", "Titan Company"],
  ["NESTLEIND", "Nestle India"], ["MARUTI", "Maruti Suzuki"],
  ["SUNPHARMA", "Sun Pharma"], ["TECHM", "Tech Mahindra"],
  ["NTPC", "NTPC Ltd"], ["POWERGRID", "Power Grid Corp"],
  ["ONGC", "Oil & Natural Gas Corp"], ["COALINDIA", "Coal India"],
  ["ADANIENT", "Adani Enterprises"], ["NIFTY", "Nifty 50 Index"],
  ["BANKNIFTY", "Bank Nifty Index"], ["SENSEX", "BSE Sensex"],
];
const US_LIST: [string, string][] = [
  ["AAPL", "Apple Inc."], ["TSLA", "Tesla"], ["NVDA", "NVIDIA"],
  ["GOOGL", "Alphabet"], ["MSFT", "Microsoft"], ["AMZN", "Amazon"],
  ["META", "Meta Platforms"], ["NFLX", "Netflix"], ["AMD", "Advanced Micro Devices"],
  ["UBER", "Uber Technologies"], ["INTC", "Intel"], ["BABA", "Alibaba"],
  ["JPM", "JPMorgan Chase"], ["V", "Visa"], ["MA", "Mastercard"],
  ["DIS", "Walt Disney"], ["PLTR", "Palantir"], ["SOFI", "SoFi Technologies"],
  ["RIVN", "Rivian"], ["COIN", "Coinbase"],
];
const MASTER: MasterEntry[] = [
  ...IN_LIST.map(([t, n]): MasterEntry => ({ ticker: t, name: n, market: "IN" })),
  ...US_LIST.map(([t, n]): MasterEntry => ({ ticker: t, name: n, market: "US" })),
];

const MASTER_BY_TICKER = Object.fromEntries(MASTER.map((m) => [m.ticker, m]));

type QueueItem = {
  ticker: string;
  name: string;
  market: "IN" | "US";
  currency: "INR" | "USD";
  basePrice: number; // fallback if not in STOCKS
};

function priceFor(ticker: string, fallback: number) {
  const p = livePrice(ticker);
  return p && p > 0 ? p : fallback;
}
function pctFor(ticker: string) {
  return livePctChange(ticker) || 0;
}

function fmtMoney(n: number, currency: "INR" | "USD") {
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}

function AnalysisPage() {
  useEffect(() => {
    document.title = "Stock Analysis Lab — NISHIRA.TRADE";
  }, []);

  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [reports, setReports] = useState<Record<string, AnalysisReport>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const searchRef = useRef<HTMLDivElement>(null);
  const runAnalysis = useServerFn(generateStockAnalysis);
  useTicker(3000);

  const results = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return [];
    return MASTER.filter(
      (m) => m.ticker.includes(q) || m.name.toUpperCase().includes(q),
    ).slice(0, 8);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const addToQueue = (m: MasterEntry) => {
    if (queue.length >= 5) {
      toast.error("Maximum 5 stocks in queue. Remove one to add more.");
      return;
    }
    if (queue.some((q) => q.ticker === m.ticker)) {
      toast.info(`${m.ticker} already in queue`);
      return;
    }
    const existing = STOCKS_BY_TICKER[m.ticker];
    setQueue((prev) => [
      ...prev,
      {
        ticker: m.ticker,
        name: m.name,
        market: m.market,
        currency: existing?.currency ?? (m.market === "IN" ? "INR" : "USD"),
        basePrice: existing?.basePrice ?? (m.market === "IN" ? 1000 : 100),
      },
    ]);
    setQuery("");
    setShowDropdown(false);
  };

  const handleAnalyseClick = () => {
    if (results[0]) addToQueue(results[0]);
    else if (query.trim()) {
      const q = query.trim().toUpperCase();
      const found = MASTER_BY_TICKER[q];
      if (found) addToQueue(found);
      else toast.error(`"${query}" not found in master list`);
    }
  };

  const removeFromQueue = (ticker: string) => {
    setQueue((prev) => prev.filter((s) => s.ticker !== ticker));
    setReports((prev) => {
      const next = { ...prev };
      delete next[ticker];
      return next;
    });
  };

  const generate = async (item: QueueItem) => {
    setLoading((l) => ({ ...l, [item.ticker]: true }));
    try {
      const price = priceFor(item.ticker, item.basePrice);
      const pct = pctFor(item.ticker);
      const report = await runAnalysis({
        data: {
          symbol: item.ticker,
          companyName: item.name,
          market: item.market,
          currentPrice: Number(price.toFixed(2)),
          changePercent: Number(pct.toFixed(2)),
        },
      });
      setReports((prev) => ({ ...prev, [item.ticker]: report }));
      toast.success(`Report generated for ${item.ticker}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to generate report";
      toast.error(msg);
    } finally {
      setLoading((l) => ({ ...l, [item.ticker]: false }));
    }
  };

  const downloadReport = (item: QueueItem, report: AnalysisReport) => {
    const wb = XLSX.utils.book_new();
    const summaryData = [
      ["NISHIRA.TRADE — Professional Stock Analysis Report"],
      ["Generated:", new Date().toLocaleString("en-IN")],
      ["Stock:", `${item.name} (${item.ticker})`],
      ["Market:", item.market === "IN" ? "NSE India" : "NASDAQ/NYSE USA"],
      ["Current Price:", priceFor(item.ticker, item.basePrice)],
      [""],
      ["EXECUTIVE SUMMARY"],
      [report.summary],
      [""],
      ["TREND ANALYSIS"],
      ["Current Trend", report.priceAnalysis.currentTrend],
      ["Strength", report.priceAnalysis.trendStrength],
      ["Observation", report.priceAnalysis.keyObservation],
      [""],
      ["TECHNICAL LEVELS"],
      ["Strong Resistance", report.technicalLevels.strongResistance],
      ["Weak Resistance", report.technicalLevels.weakResistance],
      ["Pivot", report.technicalLevels.pivot],
      ["Weak Support", report.technicalLevels.weakSupport],
      ["Strong Support", report.technicalLevels.strongSupport],
      [""],
      ["INDICATORS"],
      ["RSI", report.indicators.rsi.value, report.indicators.rsi.signal, report.indicators.rsi.interpretation],
      ["MACD", "", report.indicators.macd.signal, report.indicators.macd.interpretation],
      ["Moving Averages", "", report.indicators.movingAverages.signal, report.indicators.movingAverages.interpretation],
      ["Volume", "", report.indicators.volume.status, report.indicators.volume.interpretation],
      [""],
      ["VOLATILITY & RISK"],
      ["Level", report.volatility.level],
      ["Beta Estimate", report.volatility.betaEstimate],
      ["Risk Level", report.volatility.riskLevel],
      ["Observation", report.volatility.observation],
      [""],
      ["PATTERNS"],
      ...report.patterns.map((p) => [p]),
      [""],
      ["KEY RISKS"],
      ...report.keyRisks.map((r) => [r]),
      [""],
      ["OPPORTUNITIES"],
      ...report.opportunities.map((o) => [o]),
      [""],
      ["DISCLAIMER"],
      [report.disclaimer],
    ];
    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    ws["!cols"] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, ws, "Analysis Report");
    XLSX.writeFile(
      wb,
      `NISHIRA_Analysis_${item.ticker}_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* TOP BAR */}
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold md:text-3xl">
          <Brain className="h-7 w-7 text-primary" /> Stock Analysis Lab
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI-powered professional reports for traders
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row" ref={searchRef}>
        <div className="relative flex-1 sm:max-w-[500px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAnalyseClick();
            }}
            placeholder="Search any stock (RELIANCE, AAPL, TCS...)"
            className="pl-9"
          />
          <AnimatePresence>
            {showDropdown && results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-lg border border-border bg-card shadow-xl"
              >
                {results.map((r) => (
                  <button
                    key={r.ticker}
                    onClick={() => addToQueue(r)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-primary/10"
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-semibold">{r.ticker}</span>
                      <span className="text-xs text-muted-foreground">{r.name}</span>
                    </span>
                    <span className="text-xs">{r.market === "IN" ? "🇮🇳" : "🇺🇸"}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Button
          onClick={handleAnalyseClick}
          className="shadow-[0_0_20px_rgba(0,212,255,0.4)]"
          style={{ background: "linear-gradient(135deg, #7c3aed, #00d4ff)" }}
        >
          <Sparkles className="mr-2 h-4 w-4" /> Analyse
        </Button>
      </div>

      {/* MIDDLE — QUEUE */}
      <div className="rounded-xl border border-border bg-card/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Analysis Queue ({queue.length}/5)
          </h2>
          {queue.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setQueue([]);
                setReports({});
              }}
            >
              Clear All
            </Button>
          )}
        </div>

        {queue.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Search and add stocks above to generate analysis reports
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {queue.map((item) => {
              const p = priceFor(item.ticker, item.basePrice);
              const pct = pctFor(item.ticker);
              const isLoading = loading[item.ticker];
              const hasReport = !!reports[item.ticker];
              return (
                <div
                  key={item.ticker}
                  className="relative rounded-lg border border-border/60 bg-background/40 p-3"
                >
                  <button
                    onClick={() => removeFromQueue(item.ticker)}
                    className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    aria-label="Remove"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="pr-6">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold">{item.ticker}</span>
                      <span className="text-xs">{item.market === "IN" ? "🇮🇳" : "🇺🇸"}</span>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{item.name}</div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-display text-lg tabular-nums">
                        {fmtMoney(p, item.currency)}
                      </span>
                      <span className={`text-xs ${pct >= 0 ? "text-success" : "text-destructive"}`}>
                        {pct >= 0 ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => generate(item)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> …</>
                      ) : hasReport ? (
                        <><TrendingUp className="mr-1 h-3 w-3" /> Regenerate</>
                      ) : (
                        <><Brain className="mr-1 h-3 w-3" /> Generate Report</>
                      )}
                    </Button>
                    {hasReport && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadReport(item, reports[item.ticker])}
                        aria-label="Download"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BOTTOM — REPORTS */}
      <div className="space-y-6">
        {queue.map((item) => {
          const isLoading = loading[item.ticker];
          const report = reports[item.ticker];
          if (!isLoading && !report) return null;
          return (
            <div key={item.ticker}>
              {isLoading && <ReportSkeleton ticker={item.ticker} />}
              {report && !isLoading && (
                <ReportCard item={item} report={report} onDownload={() => downloadReport(item, report)} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReportSkeleton({ ticker }: { ticker: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        🤖 NISHIRA.AI is analysing <span className="font-semibold text-primary">{ticker}</span>…
      </div>
      <div className="mt-4 space-y-3">
        <div className="h-20 animate-pulse rounded-lg bg-white/[0.04]" />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="h-24 animate-pulse rounded-lg bg-white/[0.04]" />
          <div className="h-24 animate-pulse rounded-lg bg-white/[0.04]" />
          <div className="h-24 animate-pulse rounded-lg bg-white/[0.04]" />
        </div>
        <div className="h-40 animate-pulse rounded-lg bg-white/[0.04]" />
      </div>
    </div>
  );
}

function trendColor(t: string) {
  const s = t.toLowerCase();
  if (s.includes("bull")) return "bg-success/20 text-success border-success/40";
  if (s.includes("bear")) return "bg-destructive/20 text-destructive border-destructive/40";
  return "bg-amber-500/20 text-amber-400 border-amber-500/40";
}

function signalColor(s: string) {
  const l = s.toLowerCase();
  if (l.includes("bull") || l.includes("above") || l.includes("oversold") || l.includes("high"))
    return "bg-success/20 text-success";
  if (l.includes("bear") || l.includes("below") || l.includes("overbought") || l.includes("low"))
    return "bg-destructive/20 text-destructive";
  return "bg-amber-500/20 text-amber-400";
}

function riskMeter(level: string) {
  const l = level.toLowerCase();
  const pct = l.includes("high") ? 90 : l.includes("medium") ? 55 : 20;
  const color = pct > 70 ? "#ef4444" : pct > 40 ? "#f59e0b" : "#22c55e";
  return { pct, color };
}

function ReportCard({
  item,
  report,
  onDownload,
}: {
  item: QueueItem;
  report: AnalysisReport;
  onDownload: () => void;
}) {
  const p = priceFor(item.ticker, item.basePrice);
  const meter = riskMeter(report.volatility.riskLevel);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-xl border border-border bg-card"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-xl font-bold">{item.ticker}</span>
            <span className="text-lg">{item.market === "IN" ? "🇮🇳" : "🇺🇸"}</span>
            <span className="text-sm text-muted-foreground">{item.name}</span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              <Sparkles className="mr-1 inline h-3 w-3" /> Generated by NISHIRA.AI
            </span>
            <span>{new Date().toLocaleString("en-IN")}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-border/60 bg-background/40 px-3 py-1.5 font-display text-lg tabular-nums">
            {fmtMoney(p, item.currency)}
          </div>
          <Button size="sm" variant="outline" onClick={onDownload}>
            <Download className="mr-1 h-3.5 w-3.5" /> Download Excel
          </Button>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {/* Section 1: Summary */}
        <div className="rounded-lg border-l-4 border-primary bg-primary/5 p-4 italic text-foreground">
          "{report.summary}"
        </div>

        {/* Section 2: Price Analysis */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Price Analysis</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatBox label="Current Trend">
              <span className={`inline-block rounded-md border px-2 py-1 text-xs font-semibold ${trendColor(report.priceAnalysis.currentTrend)}`}>
                {report.priceAnalysis.currentTrend}
              </span>
            </StatBox>
            <StatBox label="Trend Strength">
              <span className="inline-block rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                {report.priceAnalysis.trendStrength}
              </span>
            </StatBox>
            <StatBox label="Key Observation">
              <p className="text-xs leading-snug text-foreground">{report.priceAnalysis.keyObservation}</p>
            </StatBox>
          </div>
        </div>

        {/* Section 3: Technical Levels */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Technical Levels</h3>
          <div className="overflow-hidden rounded-lg border border-border/60">
            <table className="w-full text-sm">
              <tbody>
                {[
                  ["🔴 Strong Resistance", report.technicalLevels.strongResistance],
                  ["🟡 Weak Resistance", report.technicalLevels.weakResistance],
                  ["🔵 Pivot Point", report.technicalLevels.pivot],
                  ["🟡 Weak Support", report.technicalLevels.weakSupport],
                  ["🟢 Strong Support", report.technicalLevels.strongSupport],
                ].map(([label, value]) => (
                  <tr key={label} className="border-b border-border/40 last:border-0">
                    <td className="px-3 py-2 text-muted-foreground">{label}</td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Indicators */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Indicators</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <IndicatorCard
              name="RSI"
              signal={`${report.indicators.rsi.value} · ${report.indicators.rsi.signal}`}
              signalClass={signalColor(report.indicators.rsi.signal)}
              text={report.indicators.rsi.interpretation}
            />
            <IndicatorCard
              name="MACD"
              signal={report.indicators.macd.signal}
              signalClass={signalColor(report.indicators.macd.signal)}
              text={report.indicators.macd.interpretation}
            />
            <IndicatorCard
              name="Moving Averages"
              signal={report.indicators.movingAverages.signal}
              signalClass={signalColor(report.indicators.movingAverages.signal)}
              text={report.indicators.movingAverages.interpretation}
            />
            <IndicatorCard
              name="Volume"
              signal={report.indicators.volume.status}
              signalClass={signalColor(report.indicators.volume.status)}
              text={report.indicators.volume.interpretation}
            />
          </div>
        </div>

        {/* Section 5: Volatility & Risk */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Volatility & Risk</h3>
          <div className="rounded-lg border border-border/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Beta Estimate</div>
                <div className="font-display text-lg tabular-nums">{report.volatility.betaEstimate}</div>
              </div>
              <span
                className="rounded-md px-2 py-1 text-xs font-semibold"
                style={{ background: `${meter.color}22`, color: meter.color }}
              >
                {report.volatility.riskLevel}
              </span>
            </div>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
                <span>Low</span><span>Medium</span><span>High</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${meter.pct}%`, background: meter.color }}
                />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{report.volatility.observation}</p>
          </div>
        </div>

        {/* Section 6: Patterns */}
        {report.patterns?.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Patterns Observed</h3>
            <div className="flex flex-wrap gap-2">
              {report.patterns.map((p, i) => (
                <span
                  key={i}
                  className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Section 7: Risks & Opportunities */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <h4 className="mb-2 text-sm font-semibold text-destructive">Key Risks</h4>
            <ul className="space-y-1 text-xs text-foreground">
              {report.keyRisks.map((r, i) => (
                <li key={i} className="flex gap-2"><span className="text-destructive">•</span>{r}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-success/30 bg-success/5 p-4">
            <h4 className="mb-2 text-sm font-semibold text-success">Opportunities</h4>
            <ul className="space-y-1 text-xs text-foreground">
              {report.opportunities.map((o, i) => (
                <li key={i} className="flex gap-2"><span className="text-success">•</span>{o}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer: Disclaimer */}
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
          ⚠️ {report.disclaimer}
        </div>
      </div>
    </motion.div>
  );
}

function StatBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-3">
      <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function IndicatorCard({
  name, signal, signalClass, text,
}: { name: string; signal: string; signalClass: string; text: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{name}</span>
        <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${signalClass}`}>{signal}</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{text}</p>
    </div>
  );
}
