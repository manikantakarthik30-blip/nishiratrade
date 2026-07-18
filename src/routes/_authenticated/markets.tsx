import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, TrendingUp, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STOCKS, livePrice, livePctChange, formatMoney, getStock } from "@/lib/stocks";
import { useTicker } from "@/hooks/useLivePrices";
import { Sparkline } from "@/components/Sparkline";
import { CandleChart } from "@/components/CandleChart";

export const Route = createFileRoute("/_authenticated/markets")({
  component: MarketsPage,
});

type Filter = "all" | "IN" | "US" | "gainers" | "losers";

const INITIAL_LIMIT = 10;

function MarketsPage() {
  useTicker();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [limit, setLimit] = useState(INITIAL_LIMIT);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    // brief skeleton so the UI paints instantly
    const t = setTimeout(() => setBooted(true), 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setLimit(INITIAL_LIMIT);
  }, [filter, q]);

  const filtered = STOCKS.filter((s) => {
    if (q && !s.ticker.toLowerCase().includes(q.toLowerCase()) && !s.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === "IN" || filter === "US") return s.market === filter;
    return true;
  }).map((s) => ({ ...s, price: livePrice(s.ticker), pct: livePctChange(s.ticker) }));

  let display = filtered;
  if (filter === "gainers") display = [...filtered].sort((a, b) => b.pct - a.pct).slice(0, 10);
  if (filter === "losers") display = [...filtered].sort((a, b) => a.pct - b.pct).slice(0, 10);

  const visible = display.slice(0, limit);
  const canLoadMore = display.length > visible.length;

  return (
    <div className="mx-auto max-w-7xl space-y-4 md:space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold md:text-3xl">Markets</h1>
        <p className="mt-1 text-xs text-muted-foreground md:text-sm">Real data, fake money. Prices update every 3 seconds.</p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)} className="-mx-3 overflow-x-auto px-3 md:mx-0 md:overflow-visible md:px-0">
          <TabsList className="w-max">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="IN">🇮🇳 Indian</TabsTrigger>
            <TabsTrigger value="US">🇺🇸 US</TabsTrigger>
            <TabsTrigger value="gainers">📈 Gainers</TabsTrigger>
            <TabsTrigger value="losers">📉 Losers</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative md:max-w-xs md:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search RELIANCE, AAPL..." className="pl-9" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {!booted &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-[#1a1a2e] p-4">
              <div className="mb-2 h-4 w-1/2 rounded bg-[#2a2a4e]" />
              <div className="mb-2 h-6 w-1/3 rounded bg-[#2a2a4e]" />
              <div className="h-3 w-1/4 rounded bg-[#2a2a4e]" />
            </div>
          ))}
        {booted &&
          visible.map((s) => (
            <motion.div
              key={s.ticker}
              layout
              whileHover={{ y: -4 }}
              className="glass rounded-xl p-4 transition-shadow hover:shadow-[var(--shadow-glow)]"
            >
              <div onClick={() => setSelected(s.ticker)} className="cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="truncate font-bold">{s.name}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{s.ticker}</div>
                  </div>
                  <span className="shrink-0 rounded-full border border-border/50 px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                    {s.market}
                  </span>
                </div>
                <div className="mt-3 flex items-end justify-between gap-2">
                  <div>
                    <div className="font-display text-xl font-bold tabular-nums">{formatMoney(s.price, s.currency)}</div>
                    <div className={`mt-0.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold ${s.pct >= 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                      {s.pct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {s.pct.toFixed(2)}%
                    </div>
                  </div>
                  <Sparkline ticker={s.ticker} />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button asChild size="sm" className="flex-1">
                  <Link to="/trade/$ticker" params={{ ticker: s.ticker }}>Trade</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="flex-1">
                  <Link to="/chart" search={{ symbol: s.ticker }}>Chart</Link>
                </Button>
              </div>
            </motion.div>
          ))}
      </div>

      {booted && canLoadMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setLimit((l) => l + 10)}>
            Load more ({display.length - visible.length})
          </Button>
        </div>
      )}

      <AnimatePresence>
        {selected && <StockPanel ticker={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}

function StockPanel({ ticker, onClose }: { ticker: string; onClose: () => void }) {
  const s = getStock(ticker)!;
  const price = livePrice(ticker);
  const pct = livePctChange(ticker);
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
      />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 24, stiffness: 220 }}
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-card p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="font-display text-2xl font-bold">{s.ticker}</div>
            <div className="text-sm text-muted-foreground">{s.name}</div>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="mt-4">
          <div className="font-display text-3xl font-bold glow-text">{formatMoney(price, s.currency)}</div>
          <div className={`text-sm ${pct >= 0 ? "text-success" : "text-destructive"}`}>
            {pct >= 0 ? "▲" : "▼"} {pct.toFixed(2)}%
          </div>
        </div>
        <Card className="glass mt-6 p-2">
          <CandleChart ticker={s.ticker} height={260} />
        </Card>
        <div className="mt-6 flex gap-2">
          <Button asChild size="lg" className="flex-1 animate-pulse-glow">
            <Link to="/trade/$ticker" params={{ ticker: s.ticker }}>Trade {s.ticker}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/chart" search={{ symbol: s.ticker }}>Full Chart</Link>
          </Button>
        </div>
      </motion.aside>
    </>
  );
}
