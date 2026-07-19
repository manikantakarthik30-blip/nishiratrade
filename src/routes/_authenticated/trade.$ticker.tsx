import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getStock, formatMoney } from "@/lib/stocks";
import { useLivePrice } from "@/hooks/useLivePrices";
import { supabase } from "@/integrations/supabase/client";
import { placeOrder } from "@/lib/trade.functions";
import { TvWidget } from "@/components/TvWidget";
import { downloadStockCSV } from "@/utils/downloadData";

export const Route = createFileRoute("/_authenticated/trade/$ticker")({
  component: TradePage,
});

function TradePage() {
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
    staleTime: 0,
    refetchInterval: 5000,
  });
  const { data: holding } = useQuery({
    queryKey: ["holding", ticker],
    queryFn: async () =>
      (await supabase.from("holdings").select("*").eq("ticker", ticker.toUpperCase()).maybeSingle()).data,
    staleTime: 0,
  });

  const live = useLivePrice(stock?.ticker ?? "");

  if (!stock) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <h1 className="font-display text-2xl">Unknown ticker</h1>
        <Button asChild className="mt-4"><Link to="/markets">Back to markets</Link></Button>
      </div>
    );
  }

  const price = live.price;
  const pct = live.pct;
  const execPrice = orderType === "LIMIT" && limitPrice > 0 ? limitPrice : price;
  const cost = qty * execPrice;
  const brokerage = +(cost * 0.001).toFixed(2);
  const total = cost + brokerage;
  const balance = Number(
    stock.market === "IN" ? profile?.balance_inr ?? 0 : profile?.balance_usd ?? 0,
  );

  const canSubmit =
    qty > 0 &&
    (side === "BUY" ? total <= balance : Number(holding?.qty ?? 0) >= qty);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await doPlaceOrder({
        data: { ticker: stock.ticker, market: stock.market, side, qty, price: execPrice },
      });
      toast.success(`${side} ${qty} ${stock.ticker} @ ${formatMoney(execPrice, stock.currency)}`);
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
    <div
      className="flex flex-col md:flex-row md:h-[calc(100vh-60px)]"
      style={{ minHeight: "calc(100vh - 60px)" }}
    >
      {/* Left: chart 70% */}
      <div className="flex flex-col md:w-[70%]">
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-border/40 px-3 text-sm">
          <div className="flex min-w-0 items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="h-7 px-2">
              <Link to="/markets"><ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back</Link>
            </Button>
            <span className="truncate font-semibold">{stock.name}</span>
            <span className="text-xs text-muted-foreground">({stock.ticker})</span>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-right">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-success" />
            <span className="font-bold tabular-nums">{formatMoney(price, stock.currency)}</span>
            <span className={pct >= 0 ? "text-success" : "text-destructive"}>
              {pct >= 0 ? "▲" : "▼"} {pct.toFixed(2)}%
            </span>
            <button
              onClick={() => downloadStockCSV(stock.ticker, buildPriceHistory(stock.ticker, price))}
              className="ml-2 flex items-center gap-1 rounded border border-border/60 px-2 py-1 text-[11px] text-muted-foreground transition hover:text-foreground"
              title="Download price history CSV"
            >
              <Download className="h-3 w-3" /> Download Data
            </button>
          </div>
        </div>
        <div className="h-[300px] w-full md:h-auto md:flex-1">
          <TvWidget symbol={stock.ticker} height="100%" />
        </div>
      </div>

      {/* Right: order panel 30% */}
      <div
        className="flex flex-col border-t md:w-[30%] md:border-l md:border-t-0"
        style={{ background: "#0d0d1a", borderColor: "#1a1a2e" }}
      >
        <div className="flex-1 space-y-4 overflow-y-auto p-5 pb-4">
          <div className="grid grid-cols-2 rounded-lg border border-border/50 p-1">
            <button
              onClick={() => setSide("BUY")}
              className={`rounded-md py-2 text-sm font-semibold transition ${side === "BUY" ? "bg-success text-success-foreground shadow-[0_0_20px_rgba(34,197,94,0.4)]" : "text-muted-foreground"}`}
            >BUY</button>
            <button
              onClick={() => setSide("SELL")}
              className={`rounded-md py-2 text-sm font-semibold transition ${side === "SELL" ? "bg-destructive text-destructive-foreground shadow-[0_0_20px_rgba(239,68,68,0.4)]" : "text-muted-foreground"}`}
            >SELL</button>
          </div>

          <div>
            <Label className="text-xs uppercase text-muted-foreground">Order Type</Label>
            <div className="mt-1 grid grid-cols-2 rounded-lg border border-border/50 p-1">
              {(["MARKET", "LIMIT"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setOrderType(t)}
                  className={`rounded-md py-1.5 text-xs font-semibold transition ${orderType === t ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}
                >{t}</button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="qty" className="text-xs uppercase text-muted-foreground">Quantity</Label>
            <div className="mt-1 flex items-center gap-2">
              <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                <Minus className="h-4 w-4" />
              </Button>
              <Input id="qty" type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} className="text-center" />
              <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => setQty((q) => q + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {orderType === "LIMIT" && (
            <div>
              <Label htmlFor="lim" className="text-xs uppercase text-muted-foreground">Limit Price</Label>
              <Input id="lim" type="number" min={0} step="0.01" value={limitPrice || ""} placeholder={String(price)} onChange={(e) => setLimitPrice(Number(e.target.value))} />
            </div>
          )}

          <div className="rounded-lg border border-border/40 bg-muted/30 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Est. Cost</span>
              <span className="font-semibold tabular-nums">{formatMoney(cost, stock.currency)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-muted-foreground">Brokerage (0.1%)</span>
              <span className="tabular-nums">{formatMoney(brokerage, stock.currency)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-border/40 pt-2">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold tabular-nums">{formatMoney(total, stock.currency)}</span>
            </div>
            <div className="mt-2 flex justify-between text-xs">
              <span className="text-muted-foreground">Available</span>
              <span className="tabular-nums">{formatMoney(balance, stock.currency)}</span>
            </div>
            <div className="mt-1 flex justify-between text-xs">
              <span className="text-muted-foreground">Holdings</span>
              <span className="tabular-nums">{Number(holding?.qty ?? 0)}</span>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-border/40 bg-[#0d0d1a] p-4">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            size="lg"
            className={`w-full font-semibold ${
              side === "BUY"
                ? "bg-success text-success-foreground shadow-[0_0_24px_rgba(34,197,94,0.45)] hover:bg-success/90"
                : "bg-destructive text-destructive-foreground shadow-[0_0_24px_rgba(239,68,68,0.45)] hover:bg-destructive/90"
            }`}
          >
            {submitting ? "Placing..." : `Place ${side} Order`}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Deterministic 90-day daily price history ending at the current live price.
function buildPriceHistory(ticker: string, endPrice: number) {
  let seed = 0;
  for (let i = 0; i < ticker.length; i++) seed = (seed * 31 + ticker.charCodeAt(i)) >>> 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  const out: { time: string; price: number }[] = [];
  let p = endPrice * (0.85 + rand() * 0.15);
  const now = Date.now();
  for (let i = 89; i >= 0; i--) {
    p = p * (1 + (rand() - 0.5) * 0.03);
    const d = new Date(now - i * 86400_000);
    out.push({ time: d.toISOString().split("T")[0], price: +p.toFixed(2) });
  }
  // pin the last point to the live price
  out[out.length - 1].price = +endPrice.toFixed(2);
  return out;
}
