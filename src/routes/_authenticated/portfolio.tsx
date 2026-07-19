import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getStock, livePrice, formatMoney } from "@/lib/stocks";
import { useTicker } from "@/hooks/useLivePrices";
import { PortfolioAreaChart } from "@/components/PortfolioAreaChart";
import { QuickTradePanel } from "@/components/QuickTradePanel";

export const Route = createFileRoute("/_authenticated/portfolio")({
  component: PortfolioPage,
});

const COLORS = ["#00d4ff", "#7c3aed", "#22d3ee", "#a855f7", "#38bdf8", "#c084fc", "#0ea5e9", "#8b5cf6", "#06b6d4", "#d946ef"];

function PortfolioPage() {
  useTicker();
  const [quick, setQuick] = useState<{ ticker: string; side: "BUY" | "SELL" } | null>(null);

  const { data: holdings = [] } = useQuery({
    queryKey: ["holdings"],
    queryFn: async () => (await supabase.from("holdings").select("*")).data ?? [],
  });
  const { data: trades = [] } = useQuery({
    queryKey: ["trades"],
    queryFn: async () => (await supabase.from("trades").select("*").order("created_at")).data ?? [],
  });

  const enriched = holdings.map((h) => {
    const s = getStock(h.ticker);
    const cur = livePrice(h.ticker);
    const value = Number(h.qty) * cur;
    const cost = Number(h.qty) * Number(h.avg_price);
    return { ...h, stock: s, cur, value, cost, pl: value - cost, plPct: cost > 0 ? ((value - cost) / cost) * 100 : 0 };
  });

  const totalValueInr = enriched.filter((e) => e.market === "IN").reduce((s, e) => s + e.value, 0);
  const totalValueUsd = enriched.filter((e) => e.market === "US").reduce((s, e) => s + e.value, 0);
  const totalCostInr = enriched.filter((e) => e.market === "IN").reduce((s, e) => s + e.cost, 0);
  const totalCostUsd = enriched.filter((e) => e.market === "US").reduce((s, e) => s + e.cost, 0);

  // Realized P&L: sum over SELL trades of (sellPrice - avgAtTime)... approximate as (price - matching earliest buy avg)
  // Simple: realized = for each SELL, price*qty - (matching buys average estimated as first buy price)
  const realized = { INR: 0, USD: 0 };
  const buysByTicker = new Map<string, { qty: number; cost: number }>();
  for (const t of trades) {
    const s = getStock(t.ticker);
    const cur = s?.currency ?? "USD";
    if (t.side === "BUY") {
      const b = buysByTicker.get(t.ticker) ?? { qty: 0, cost: 0 };
      b.qty += Number(t.qty);
      b.cost += Number(t.qty) * Number(t.price);
      buysByTicker.set(t.ticker, b);
    } else {
      const b = buysByTicker.get(t.ticker) ?? { qty: 0, cost: 0 };
      const avg = b.qty > 0 ? b.cost / b.qty : Number(t.price);
      const gain = (Number(t.price) - avg) * Number(t.qty);
      realized[cur] += gain;
      const sellQty = Math.min(Number(t.qty), b.qty);
      b.qty -= sellQty;
      b.cost -= sellQty * avg;
      buysByTicker.set(t.ticker, b);
    }
  }

  const pieDataInr = enriched.filter((e) => e.market === "IN").map((e) => ({ name: e.ticker, value: e.value }));
  const pieDataUsd = enriched.filter((e) => e.market === "US").map((e) => ({ name: e.ticker, value: e.value }));

  return (
    <div className="mx-auto max-w-7xl space-y-4 md:space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold md:text-3xl">Portfolio</h1>
        <p className="mt-1 text-xs text-muted-foreground md:text-sm">Your current holdings, allocation, and P&L.</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard title="Indian (INR)" invested={totalCostInr} current={totalValueInr} currency="INR" realized={realized.INR} />
        <SummaryCard title="US (USD)" invested={totalCostUsd} current={totalValueUsd} currency="USD" realized={realized.USD} />
      </div>

      {/* Holdings table */}
      <Card className="glass p-6">
        <h2 className="mb-4 font-display text-xl font-semibold">Holdings</h2>
        {enriched.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No holdings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2">Stock</th>
                  <th>Qty</th>
                  <th>Avg Buy</th>
                  <th>Current</th>
                  <th>P&L</th>
                  <th>P&L %</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enriched.map((e) => (
                  <tr key={e.id} className="border-t border-border/30">
                    <td className="py-2 font-medium">
                      {e.ticker} <span className="text-xs text-muted-foreground">{e.market}</span>
                    </td>
                    <td>{Number(e.qty)}</td>
                    <td>{formatMoney(Number(e.avg_price), e.stock?.currency ?? "USD")}</td>
                    <td>{formatMoney(e.cur, e.stock?.currency ?? "USD")}</td>
                    <td className={e.pl >= 0 ? "text-success" : "text-destructive"}>
                      {formatMoney(e.pl, e.stock?.currency ?? "USD")}
                    </td>
                    <td className={e.plPct >= 0 ? "text-success" : "text-destructive"}>
                      {e.plPct.toFixed(2)}%
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setQuick({ ticker: e.ticker, side: "BUY" })}>
                          Buy More
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setQuick({ ticker: e.ticker, side: "SELL" })}>
                          Sell
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </thead>
              <tbody>
                {enriched.map((e) => (
                  <tr key={e.id} className="border-t border-border/30">
                    <td className="py-2 font-medium">
                      {e.ticker} <span className="text-xs text-muted-foreground">{e.market}</span>
                    </td>
                    <td>{Number(e.qty)}</td>
                    <td>{formatMoney(Number(e.avg_price), e.stock?.currency ?? "USD")}</td>
                    <td>{formatMoney(e.cur, e.stock?.currency ?? "USD")}</td>
                    <td className={e.pl >= 0 ? "text-success" : "text-destructive"}>
                      {formatMoney(e.pl, e.stock?.currency ?? "USD")}
                    </td>
                    <td className={`text-right ${e.plPct >= 0 ? "text-success" : "text-destructive"}`}>
                      {e.plPct.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Value over time */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass p-6">
          <h3 className="mb-2 font-display text-lg font-semibold">Value Over Time (INR)</h3>
          <PortfolioAreaChart currentValue={totalValueInr} currency="INR" seed="pf-inr" />
        </Card>
        <Card className="glass p-6">
          <h3 className="mb-2 font-display text-lg font-semibold">Value Over Time (USD)</h3>
          <PortfolioAreaChart currentValue={totalValueUsd} currency="USD" seed="pf-usd" />
        </Card>
      </div>

      {/* Pie chart allocation */}
      <div className="grid gap-4 lg:grid-cols-2">
        <AllocationCard title="Indian Allocation" data={pieDataInr} />
        <AllocationCard title="US Allocation" data={pieDataUsd} />
      </div>
    </div>
  );
}

function SummaryCard({
  title, invested, current, currency, realized,
}: { title: string; invested: number; current: number; currency: "INR" | "USD"; realized: number }) {
  const unrealized = current - invested;
  const pct = invested > 0 ? (unrealized / invested) * 100 : 0;
  const barPct = invested === 0 && current === 0 ? 0 : Math.min(100, (current / Math.max(invested, current, 1)) * 100);
  const invBarPct = invested === 0 && current === 0 ? 0 : Math.min(100, (invested / Math.max(invested, current, 1)) * 100);
  return (
    <Card className="glass p-6">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <div className="mt-4 space-y-3">
        <div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Invested</span><span>{formatMoney(invested, currency)}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-secondary" style={{ width: `${invBarPct}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Current</span><span>{formatMoney(current, currency)}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${barPct}%` }} />
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-border/40 p-3">
          <div className="text-xs text-muted-foreground">Unrealized P&L</div>
          <div className={`font-semibold ${unrealized >= 0 ? "text-success" : "text-destructive"}`}>
            {formatMoney(unrealized, currency)} <span className="text-xs">({pct.toFixed(2)}%)</span>
          </div>
        </div>
        <div className="rounded-lg border border-border/40 p-3">
          <div className="text-xs text-muted-foreground">Realized P&L</div>
          <div className={`font-semibold ${realized >= 0 ? "text-success" : "text-destructive"}`}>
            {formatMoney(realized, currency)}
          </div>
        </div>
      </div>
    </Card>
  );
}

function AllocationCard({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  return (
    <Card className="glass p-6">
      <h3 className="mb-2 font-display text-lg font-semibold">{title}</h3>
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No holdings.</p>
      ) : (
        <div className="mx-auto max-w-[300px]">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(240 30% 12%)", border: "1px solid hsl(240 30% 20%)", borderRadius: 8 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
