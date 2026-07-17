import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getStock, livePrice, livePctChange } from "@/lib/stocks";
import { getFinnhubKey } from "@/lib/market-data.functions";

/** Re-render every 3s so livePrice() reflects the latest tick. */
export function useTicker(intervalMs = 3000) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}

/**
 * Live price hook. For US tickers, tries Finnhub WebSocket when the key is set.
 * Otherwise falls back to the deterministic simulation used across the app.
 */
export function useLivePrice(ticker: string) {
  useTicker();
  const stock = getStock(ticker);
  const initial = livePrice(ticker);
  const [wsPrice, setWsPrice] = useState<number | null>(null);
  const openPriceRef = useRef<number>(initial || 1);

  const fetchKey = useServerFn(getFinnhubKey);
  const { data: finnhubKey } = useQuery({
    queryKey: ["finnhubKey"],
    queryFn: () => fetchKey(),
    staleTime: Infinity,
  });

  useEffect(() => {
    const key = finnhubKey;
    if (!key || !stock || stock.market !== "US" || typeof window === "undefined") return;

    let ws: WebSocket | null = null;
    let cancelled = false;
    try {
      ws = new WebSocket(`wss://ws.finnhub.io?token=${key}`);
      ws.onopen = () => {
        if (cancelled) return;
        ws?.send(JSON.stringify({ type: "subscribe", symbol: ticker }));
      };
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === "trade" && Array.isArray(msg.data) && msg.data.length) {
            const last = msg.data[msg.data.length - 1];
            if (typeof last.p === "number") setWsPrice(last.p);
          }
        } catch {
          /* ignore malformed frames */
        }
      };
      ws.onerror = () => {
        /* silently fall back to simulation */
      };
    } catch {
      /* WS unsupported — fall back */
    }

    return () => {
      cancelled = true;
      try {
        ws?.send(JSON.stringify({ type: "unsubscribe", symbol: ticker }));
      } catch {
        /* ignore */
      }
      ws?.close();
    };
  }, [ticker, stock, finnhubKey]);

  const price = wsPrice ?? initial;
  const pct = wsPrice
    ? ((wsPrice - openPriceRef.current) / openPriceRef.current) * 100
    : livePctChange(ticker);

  return { price, pct, isLive: wsPrice !== null };
}
