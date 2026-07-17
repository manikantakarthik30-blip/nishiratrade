import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STOCKS, livePrice, livePctChange, formatMoney, priceHistory, getStock } from "@/lib/stocks";
import { useTicker } from "@/hooks/useLivePrices";

export const Route = createFileRoute("/_authenticated/markets")({
  component: MarketsPage,
});

type Filter = "all" | "IN" | "US" | "gainers" | "losers";

function MarketsPage() {
  useTicker();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = STOCKS.filter((s) => {
    if (q && !s.ticker.toLowerCase().includes(q.toLowerCase()) && !s.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === "IN" || filter === "US") return s.market === filter;
    return true;
  }).map((s) => ({ ...s, price: livePrice(s.ticker), pct: livePctChange(s.ticker) }));

  let display = filtered;
  if (filter === "gainers") display = [...filtered].sort((a, b) => b.pct - a.pct).slice(0, 10);
  if (filter === "losers") display = [...filtered].sort((a, b) => a.pct - b.pct).slice(0, 10);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Markets</h1>
        <p className="mt-1 text-sm text-muted-foreground">Real data, fake money. Prices update every 3 seconds.</p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search RELIANCE, AAPL, TSLA..." className="pl-9" />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="IN">Indian</TabsTrigger>
            <TabsTrigger value="US">US</TabsTrigger>
            <TabsTrigger value="gainers">Top Gainers</TabsTrigger>
            <TabsTrigger value="losers">Top Losers</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {display.map((s) => (
          <motion.div
            key={s.ticker}
            layout
            whileHover={{ y: -4 }}
            onClick={() => setSelected(s.ticker)}
            className="glass cursor-pointer rounded-xl p-4 transition-shadow hover:shadow-[var(--shadow-glow)]"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold">{s.ticker}</div>
                <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{s.name}</div>
              </div>
              <span className="rounded-full border border-border/50 px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                {s.market}
              </span>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div className="font-display text-xl font-bold">{formatMoney(s.price, s.currency)}</div>
              <div className={`flex items-center gap-1 text-sm font-medium ${s.pct >= 0 ? "text-success" : "text-destructive"}`}>
                {s.pct >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {s.pct.toFixed(2)}%
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail side panel */}
      <AnimatePresence>
        {selected && <StockPanel ticker={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}

function StockPanel({ ticker, onClose }: { ticker: string; onClose: () => void }) {
  const s = getStock(ticker)!;
  const data = priceHistory(ticker, 7);
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
        <Card className="glass mt-6 p-4">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data}>
              <XAxis dataKey="time" hide />
              <YAxis domain={["dataMin", "dataMax"]} hide />
              <Tooltip
                contentStyle={{ background: "hsl(240 30% 12%)", border: "1px solid hsl(240 30% 20%)", borderRadius: 8 }}
                labelStyle={{ color: "hsl(0 0% 80%)" }}
              />
              <Line type="monotone" dataKey="price" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Button asChild size="lg" className="mt-6 animate-pulse-glow">
          <Link to="/trade/$ticker" params={{ ticker: s.ticker }}>Trade {s.ticker}</Link>
        </Button>
      </motion.aside>
    </>
  );
}
