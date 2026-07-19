import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getStock, formatMoney } from "@/lib/stocks";
import { useLivePrice } from "@/hooks/useLivePrices";
import { supabase } from "@/integrations/supabase/client";
import { placeOrder } from "@/lib/trade.functions";

function validateOrder(
  quantity: number,
  price: number,
  balance: number,
  action: "BUY" | "SELL",
  holdings: number,
): string | null {
  if (quantity <= 0 || !Number.isInteger(quantity))
    return "Quantity must be a positive whole number";
  if (quantity > 10000) return "Maximum order size is 10,000 units";
  if (price <= 0) return "Invalid price";
  if (action === "BUY" && price * quantity > balance)
    return "Insufficient balance for this order";
  if (action === "SELL" && quantity > holdings)
    return "You don't have enough shares to sell";
  return null;
}

type Props = {
  ticker: string | null;
  defaultSide?: "BUY" | "SELL";
  onClose: () => void;
};

export function QuickTradePanel({ ticker, defaultSide = "BUY", onClose }: Props) {
  return (
    <AnimatePresence>
      {ticker && (
        <PanelInner ticker={ticker} defaultSide={defaultSide} onClose={onClose} />
      )}
    </AnimatePresence>
  );
}

function PanelInner({
  ticker,
  defaultSide,
  onClose,
}: {
  ticker: string;
  defaultSide: "BUY" | "SELL";
  onClose: () => void;
}) {
  const stock = getStock(ticker.toUpperCase());
  const qc = useQueryClient();
  const doPlaceOrder = useServerFn(placeOrder);
  const live = useLivePrice(stock?.ticker ?? "");

  const [side, setSide] = useState<"BUY" | "SELL">(defaultSide);
  const [qty, setQty] = useState(1);
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [limitPrice, setLimitPrice] = useState<number>(live.price || 0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    setSide(defaultSide);
    setQty(1);
    setOrderType("MARKET");
    setSuccess(false);
  }, [ticker, defaultSide]);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await supabase.from("profiles").select("*").maybeSingle()).data,
  });
  const { data: holding } = useQuery({
    queryKey: ["holding", ticker],
    queryFn: async () =>
      (
        await supabase.from("holdings").select("*").eq("ticker", ticker.toUpperCase()).maybeSingle()
      ).data,
  });

  if (!stock) return null;

  const price = live.price;
  const pct = live.pct;
  const execPrice = orderType === "LIMIT" && limitPrice > 0 ? limitPrice : price;
  const cost = qty * execPrice;
  const brokerage = +(cost * 0.001).toFixed(2);
  const total = cost + brokerage;
  const balance = Number(
    stock.market === "IN" ? profile?.balance_inr ?? 0 : profile?.balance_usd ?? 0,
  );
  const heldQty = Number(holding?.qty ?? 0);
  const validationError = validateOrder(qty, execPrice, balance, side, heldQty);
  const canSubmit = !validationError && !submitting;

  const orderTimestamps = useRef<number[]>([]);
  const checkRateLimit = () => {
    const now = Date.now();
    const oneMinuteAgo = now - 60_000;
    orderTimestamps.current = orderTimestamps.current.filter((t) => t > oneMinuteAgo);
    if (orderTimestamps.current.length >= 10) {
      toast.error("Slow down!", {
        description: "Maximum 10 orders per minute. Please wait.",
      });
      return false;
    }
    orderTimestamps.current.push(now);
    return true;
  };

  const submit = async () => {
    if (validationError) {
      toast.error(validationError);
      return;
    }
    if (!checkRateLimit()) return;
    setSubmitting(true);
    try {
      await doPlaceOrder({
        data: { ticker: stock.ticker, market: stock.market, side, qty, price: execPrice },
      });
      setSuccess(true);
      toast.success("Order Placed!");
      qc.invalidateQueries();
      setTimeout(onClose, 900);
    } catch (e) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      const msg = e instanceof Error ? e.message : "Order failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: shake ? [0, -8, 8, -6, 6, 0] : 0 }}
        exit={{ x: "100%" }}
        transition={{ type: shake ? "tween" : "spring", damping: 26, stiffness: 260, duration: shake ? 0.4 : undefined }}
        className="fixed right-0 top-0 z-[60] flex h-full w-full flex-col border-l border-border bg-card p-5 shadow-2xl sm:w-[360px]"
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <div className="truncate text-xs uppercase tracking-wide text-muted-foreground">
              Quick Trade · {stock.market}
            </div>
            <div className="mt-0.5 font-display text-xl font-bold">{stock.ticker}</div>
            <div className="truncate text-xs text-muted-foreground">{stock.name}</div>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="mt-3">
          <div className="font-display text-2xl font-bold tabular-nums">
            {formatMoney(price, stock.currency)}
          </div>
          <div className={`text-xs ${pct >= 0 ? "text-success" : "text-destructive"}`}>
            {pct >= 0 ? "▲" : "▼"} {pct.toFixed(2)}%
          </div>
        </div>

        {/* Side tabs */}
        <div className="mt-4 grid grid-cols-2 rounded-lg border border-border/50 p-1">
          <button
            onClick={() => setSide("BUY")}
            className={`rounded-md py-1.5 text-sm font-semibold transition ${
              side === "BUY" ? "bg-success/20 text-success" : "text-muted-foreground"
            }`}
          >
            BUY
          </button>
          <button
            onClick={() => setSide("SELL")}
            className={`rounded-md py-1.5 text-sm font-semibold transition ${
              side === "SELL" ? "bg-destructive/20 text-destructive" : "text-muted-foreground"
            }`}
          >
            SELL
          </button>
        </div>

        {/* Quantity */}
        <div className="mt-4">
          <div className="mb-1 text-xs text-muted-foreground">Quantity</div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" onClick={() => setQty((q) => Math.max(1, q - 1))}>
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              value={qty}
              min={1}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              className="text-center"
            />
            <Button size="icon" variant="outline" onClick={() => setQty((q) => q + 1)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Order type */}
        <div className="mt-4">
          <div className="mb-1 text-xs text-muted-foreground">Order Type</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setOrderType("MARKET")}
              className={`rounded-md border py-1.5 text-xs ${
                orderType === "MARKET"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground"
              }`}
            >
              Market
            </button>
            <button
              onClick={() => setOrderType("LIMIT")}
              className={`rounded-md border py-1.5 text-xs ${
                orderType === "LIMIT"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground"
              }`}
            >
              Limit
            </button>
          </div>
          {orderType === "LIMIT" && (
            <Input
              type="number"
              className="mt-2"
              value={limitPrice || ""}
              onChange={(e) => setLimitPrice(Number(e.target.value) || 0)}
              placeholder={`Limit price (${stock.currency})`}
            />
          )}
        </div>

        {/* Summary */}
        <div className="mt-5 space-y-1.5 rounded-lg border border-border/40 bg-white/[0.03] p-3 text-xs">
          <Row label="Est. cost" value={formatMoney(cost, stock.currency)} />
          <Row label="Brokerage (0.1%)" value={formatMoney(brokerage, stock.currency)} />
          <div className="my-1 h-px bg-border/40" />
          <Row label="Total" value={formatMoney(total, stock.currency)} bold />
          <Row
            label="Available balance"
            value={formatMoney(balance, stock.currency)}
            muted
          />
          {side === "SELL" && (
            <Row label="You hold" value={`${heldQty} shares`} muted />
          )}
        </div>

        <div className="mt-auto pt-4">
          <Button
            onClick={submit}
            disabled={!canSubmit}
            className={`w-full ${
              side === "BUY"
                ? "bg-success text-black hover:bg-success/90"
                : "bg-destructive text-white hover:bg-destructive/90"
            }`}
            size="lg"
          >
            {success ? (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" /> Order Placed
              </span>
            ) : submitting ? (
              "Placing…"
            ) : (
              `Place ${side} Order`
            )}
          </Button>
          {validationError && !submitting && !success && (
            <p className="mt-2 text-center text-[11px] text-destructive">
              {validationError}
            </p>
          )}
        </div>
      </motion.aside>
    </>
  );
}

function Row({
  label, value, bold, muted,
}: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-muted-foreground" : ""}>{label}</span>
      <span className={`tabular-nums ${bold ? "font-semibold" : ""}`}>{value}</span>
    </div>
  );
}
