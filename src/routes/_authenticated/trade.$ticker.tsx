import { createFileRoute, Link, useServerFn } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getStock, livePrice, livePctChange, formatMoney, priceHistory } from "@/lib/stocks";
import { useTicker } from "@/hooks/useLivePrices";
import { supabase } from "@/integrations/supabase/client";
import { placeOrder } from "@/lib/trade.functions";

export const Route = createFileRoute("/_authenticated/trade/$ticker")({
  component: TradePage,
});

function TradePage() {
  useTicker();
  const { ticker } = Route.useParams();
  const stock = getStock(ticker.toUpperCase());
  const qc = useQueryClient();
  const doPlaceOrder = useServerFn(placeOrder);

  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [qty, setQty] = useState<number>(1);
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [limitPrice, setLimitPrice] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await supabase.from("profiles").select("*").maybeSingle()).data,
  });
  const { data: holding } = useQuery({
    queryKey: ["holding", ticker],
    queryFn: async () =>
      (await supabase.from("holdings").select("*").eq("ticker", ticker.toUpperCase()).maybeSingle()).data,
  });

  const history = useMemo(() => priceHistory(ticker.toUpperCase(), 7), [ticker]);

  if (!stock) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-2xl">Unknown ticker</h1>
        <Button asChild className="mt-4"><Link to="/markets">Back to markets</Link></Button>
      </div>
    );
  }

  const price = livePrice(stock.ticker);
  const pct = livePctChange(stock.ticker);
  const execPrice = orderType === "LIMIT" && limitPrice > 0 ? limitPrice : price;
  const cost = qty * execPrice;
  const balance = Number(
    stock.market === "IN" ? profile?.balance_inr ?? 0 : profile?.balance_usd ?? 0,
  );

  const canSubmit =
    qty > 0 &&
    (side === "BUY" ? cost <= balance : Number(holding?.qty ?? 0) >= qty);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await doPlaceOrder({
        data: {
          ticker: stock.ticker,
          market: stock.market,
          side,
          qty,
          price: execPrice,
        },
      });
      toast.success(`${side} order for ${qty} ${stock.ticker} placed at ${formatMoney(execPrice, stock.currency)}`);
      qc.invalidateQueries();
      setQty(1);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Order failed";
      if (msg.includes("Insufficient")) toast.error("Insufficient balance to place this order");
      else if (msg.includes("Not enough")) toast.error("You don't own enough shares to sell");
      else toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/markets"><ArrowLeft className="mr-1 h-4 w-4" /> Back to markets</Link>
      </Button>

      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs uppercase text-muted-foreground">{stock.market} • {stock.currency}</div>
          <h1 className="font-display text-4xl font-bold">{stock.ticker}</h1>
          <p className="text-sm text-muted-foreground">{stock.name}</p>
        </div>
        <div className="text-right">
          <div className="font-display text-4xl font-bold glow-text">{formatMoney(price, stock.currency)}</div>
          <div className={`text-sm ${pct >= 0 ? "text-success" : "text-destructive"}`}>
            {pct >= 0 ? "▲" : "▼"} {pct.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart */}
        <Card className="glass col-span-2 p-4">
          <div className="mb-2 text-sm text-muted-foreground">7-day price history</div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 30% 20%)" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(0 0% 60%)" minTickGap={30} />
              <YAxis domain={["dataMin", "dataMax"]} tick={{ fontSize: 10 }} stroke="hsl(0 0% 60%)" />
              <Tooltip
                contentStyle={{ background: "hsl(240 30% 12%)", border: "1px solid hsl(240 30% 20%)", borderRadius: 8 }}
              />
              <Line type="monotone" dataKey="price" stroke="var(--color-primary)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Order form */}
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="glass p-6">
            <div className="mb-4 flex rounded-lg border border-border/50 p-1">
              <button
                onClick={() => setSide("BUY")}
                className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${side === "BUY" ? "bg-success text-success-foreground" : "text-muted-foreground"}`}
              >
                BUY
              </button>
              <button
                onClick={() => setSide("SELL")}
                className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${side === "SELL" ? "bg-destructive text-destructive-foreground" : "text-muted-foreground"}`}
              >
                SELL
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="qty">Quantity</Label>
                <Input id="qty" type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(0, Number(e.target.value)))} />
              </div>

              <div>
                <Label>Order Type</Label>
                <Select value={orderType} onValueChange={(v) => setOrderType(v as "MARKET" | "LIMIT")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MARKET">Market</SelectItem>
                    <SelectItem value="LIMIT">Limit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {orderType === "LIMIT" && (
                <div>
                  <Label htmlFor="lim">Limit price</Label>
                  <Input id="lim" type="number" min={0} step="0.01" value={limitPrice} onChange={(e) => setLimitPrice(Number(e.target.value))} />
                </div>
              )}

              <div className="rounded-lg border border-border/40 bg-muted/30 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated cost</span>
                  <span className="font-semibold">{formatMoney(cost, stock.currency)}</span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-muted-foreground">Available</span>
                  <span>{formatMoney(balance, stock.currency)}</span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-muted-foreground">Holdings</span>
                  <span>{Number(holding?.qty ?? 0)}</span>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                size="lg"
                className={`w-full ${canSubmit ? "animate-pulse-glow" : ""}`}
              >
                {submitting ? "Placing..." : `Place ${side} Order`}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
