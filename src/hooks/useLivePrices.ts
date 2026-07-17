import { useEffect, useState } from "react";
import { livePrice, livePctChange } from "@/lib/stocks";

/** Re-render every 3s so livePrice() reflects the latest tick. */
export function useTicker(intervalMs = 3000) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}

export function useLivePrice(ticker: string) {
  useTicker();
  return { price: livePrice(ticker), pct: livePctChange(ticker) };
}
