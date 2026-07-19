import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Star, StarOff, Wallet, IndianRupee, DollarSign, Zap, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useTicker } from "@/hooks/useLivePrices";
import { STOCKS, getStock, livePrice, livePctChange, formatMoney } from "@/lib/stocks";
import { PortfolioAreaChart } from "@/components/PortfolioAreaChart";
import { QuickTradePanel } from "@/components/QuickTradePanel";
import { downloadPortfolioExcel } from "@/utils/downloadData";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — NISHIRA.TRADE" },
      { name: "description", content: "Your paper trading dashboard: balances, portfolio value and quick trade access." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const qc = useQueryClient();
  const [quickTicker, setQuickTicker] = useState<string | null>(null);
  const [quickSide, setQuickSide] = useState<"BUY" | "SELL">("BUY");
  useTicker();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      return data;
    },
  });

  const { data: holdings = [] } = useQuery({
    queryKey: ["holdings"],
    queryFn: async () => {
      const { data } = await supabase.from("holdings").select("*");
      return data ?? [];
    },
  });

  const { data: watchlist = [] } = useQuery({
    queryKey: ["watchlist"],
    queryFn: async () => {
      const { data } = await supabase.from("watchlist").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: trades = [] } = useQuery({
    queryKey: ["trades"],
    queryFn: async () => {
      const { data } = await supabase.from("trades").select("*").order("created_at", { ascending: false }).limit(10);
      return data ?? [];
    },
  });

  const invInr = holdings.filter((h) => h.market === "IN").reduce((s, h) => s + Number(h.qty) * livePrice(h.ticker), 0);
  const invUsd = holdings.filter((h) => h.market === "US").reduce((s, h) => s + Number(h.qty) * livePrice(h.ticker), 0);
  const costInr = holdings.filter((h) => h.market === "IN").reduce((s, h) => s + Number(h.qty) * Number(h.avg_price), 0);
  const costUsd = holdings.filter((h) => h.market === "US").reduce((s, h) => s + Number(h.qty) * Number(h.avg_price), 0);
  const plInr = invInr - costInr;
  const plUsd = invUsd - costUsd;

  const toggleWatch = async (ticker: string, market: "IN" | "US") => {
    const existing = watchlist.find((w) => w.ticker === ticker);
    if (existing) {
      await supabase.from("watchlist").delete().eq("id", existing.id);
      toast.success(`${ticker} removed from watchlist`);
    } else {
      const { error } = await supabase.from("watchlist").insert({ ticker, market, user_id: (await supabase.auth.getUser()).data.user!.id });
      if (error) toast.error(error.message);
      else toast.success(`${ticker} added to watchlist`);
    }
    qc.invalidateQueries({ queryKey: ["watchlist"] });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 md:space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold md:text-3xl">
            Welcome, <span className="text-primary">{profile?.username ?? "trader"}</span>
          </h1>
          <p className="mt-1 text-xs text-muted-foreground md:text-sm">Welcome to NISHIRA.TRADE — your portfolio at a glance.</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => downloadPortfolioExcel(holdings)}
          disabled={holdings.length === 0}
          className="border-success/40 text-success hover:bg-success/10"
        >
          <Download className="mr-1.5 h-3.5 w-3.5" /> Export
        </Button>
      </motion.div>

      {/* Balance cards — 2x2 on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <BalanceCard
          icon={<IndianRupee className="h-4 w-4" />}
          label="INR Balance"
          value={formatMoney(Number(profile?.balance_inr ?? 0), "INR")}
        />
        <BalanceCard
          icon={<DollarSign className="h-4 w-4" />}
          label="USD Balance"
          value={formatMoney(Number(profile?.balance_usd ?? 0), "USD")}
        />
        <BalanceCard
          icon={<Wallet className="h-4 w-4" />}
          label="Portfolio (INR)"
          value={formatMoney(invInr, "INR")}
          sub={`${plInr >= 0 ? "+" : ""}${formatMoney(plInr, "INR")} P&L`}
          positive={plInr >= 0}
        />
        <BalanceCard
          icon={<Wallet className="h-4 w-4" />}
          label="Portfolio (USD)"
          value={formatMoney(invUsd, "USD")}
          sub={`${plUsd >= 0 ? "+" : ""}${formatMoney(plUsd, "USD")} P&L`}
          positive={plUsd >= 0}
        />
      </div>

      {/* Portfolio performance chart */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass p-6">
          <h2 className="mb-4 font-display text-xl font-semibold">Portfolio Value (INR · 30d)</h2>
          <PortfolioAreaChart currentValue={invInr} currency="INR" seed="dash-inr" />
        </Card>
        <Card className="glass p-6">
          <h2 className="mb-4 font-display text-xl font-semibold">Portfolio Value (USD · 30d)</h2>
          <PortfolioAreaChart currentValue={invUsd} currency="USD" seed="dash-usd" />
        </Card>
      </div>

      {/* Watchlist */}
      <Card className="glass p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Watchlist</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/markets">Browse markets →</Link>
          </Button>
        </div>
        {watchlist.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No stocks on your watchlist yet. Add some from the <Link to="/markets" className="text-primary underline">Markets</Link> page.
          </p>
        ) : (
          <div className="divide-y divide-border/40">
            {watchlist.map((w) => {
              const s = getStock(w.ticker);
              if (!s) return null;
              const price = livePrice(w.ticker);
              const pct = livePctChange(w.ticker);
              return (
                <div key={w.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-semibold">{s.ticker}</div>
                    <div className="text-xs text-muted-foreground">{s.name}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium">{formatMoney(price, s.currency)}</div>
                      <div className={`text-xs ${pct >= 0 ? "text-success" : "text-destructive"}`}>
                        {pct >= 0 ? "▲" : "▼"} {pct.toFixed(2)}%
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => { setQuickSide("BUY"); setQuickTicker(s.ticker); }}>
                      <Zap className="mr-1 h-3.5 w-3.5" /> Quick
                    </Button>
                    <Button asChild size="sm">
                      <Link to="/trade/$ticker" params={{ ticker: s.ticker }}>Trade</Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => toggleWatch(s.ticker, s.market)}>
                      <StarOff className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Recent trades */}
      <Card className="glass p-6">
        <h2 className="mb-4 font-display text-xl font-semibold">Recent Trades</h2>
        {trades.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No trades yet. Place your first order.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2">Stock</th>
                  <th>Side</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Current</th>
                  <th className="text-right">P&L</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => {
                  const s = getStock(t.ticker);
                  const cur = livePrice(t.ticker);
                  const pl = (cur - Number(t.price)) * Number(t.qty) * (t.side === "BUY" ? 1 : -1);
                  return (
                    <tr key={t.id} className="border-t border-border/30">
                      <td className="py-2 font-medium">{t.ticker}</td>
                      <td>
                        <span className={t.side === "BUY" ? "text-success" : "text-destructive"}>{t.side}</span>
                      </td>
                      <td>{Number(t.qty)}</td>
                      <td>{s ? formatMoney(Number(t.price), s.currency) : t.price}</td>
                      <td>{s ? formatMoney(cur, s.currency) : "-"}</td>
                      <td className={`text-right ${pl >= 0 ? "text-success" : "text-destructive"}`}>
                        {s ? formatMoney(pl, s.currency) : pl.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Quick pick */}
      <Card className="glass p-6">
        <h2 className="mb-4 font-display text-xl font-semibold">Quick Trade</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {STOCKS.slice(0, 8).map((s) => {
            const price = livePrice(s.ticker);
            const pct = livePctChange(s.ticker);
            const onWatch = watchlist.some((w) => w.ticker === s.ticker);
            return (
              <div key={s.ticker} className="rounded-lg border border-border/40 p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{s.ticker}</div>
                    <div className="text-xs text-muted-foreground">{s.market}</div>
                  </div>
                  <button onClick={() => toggleWatch(s.ticker, s.market)}>
                    {onWatch ? <Star className="h-4 w-4 fill-primary text-primary" /> : <Star className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </div>
                <div className="mt-2 text-lg font-bold">{formatMoney(price, s.currency)}</div>
                <div className={`text-xs ${pct >= 0 ? "text-success" : "text-destructive"}`}>
                  {pct >= 0 ? <TrendingUp className="inline h-3 w-3" /> : <TrendingDown className="inline h-3 w-3" />} {pct.toFixed(2)}%
                </div>
                <Button asChild size="sm" className="mt-3 w-full">
                  <Link to="/trade/$ticker" params={{ ticker: s.ticker }}>Buy / Sell</Link>
                </Button>
              </div>
            );
          })}
        </div>
      </Card>

      <QuickTradePanel ticker={quickTicker} defaultSide={quickSide} onClose={() => setQuickTicker(null)} />
    </div>
  );
}

function BalanceCard({
  icon,
  label,
  value,
  sub,
  positive,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
}) {
  return (
    <Card className="glass p-3 md:p-5">
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground md:text-xs">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1 font-display text-base font-bold md:mt-2 md:text-2xl">{value}</div>
      {sub && <div className={`mt-1 truncate text-[10px] md:text-xs ${positive ? "text-success" : "text-destructive"}`}>{sub}</div>}
    </Card>
  );
}
