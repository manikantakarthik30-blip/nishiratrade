import type { DeepPartial, ChartOptions, UTCTimestamp } from "lightweight-charts";
import { getStock } from "@/lib/stocks";

export const chartTheme: DeepPartial<ChartOptions> = {
  layout: {
    background: { color: "#0a0a1a" },
    textColor: "#a0a0b0",
  },
  grid: {
    vertLines: { color: "#1a1a2e" },
    horzLines: { color: "#1a1a2e" },
  },
  crosshair: { mode: 1 },
  rightPriceScale: { borderColor: "#2a2a4a" },
  timeScale: {
    borderColor: "#2a2a4a",
    timeVisible: true,
    secondsVisible: false,
  },
};

export type Candle = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function seed(n: number) {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

/** Simulated N-day daily OHLCV history ending today. */
export function simulatedOHLCV(ticker: string, days = 60): Candle[] {
  const stock = getStock(ticker);
  const base = stock?.basePrice ?? 100;
  const h = hashStr(ticker);
  const out: Candle[] = [];
  let close = base * 0.95;
  const dayMs = 86400;
  const todayUtc = Math.floor(Date.now() / 1000 / dayMs) * dayMs;
  for (let i = days - 1; i >= 0; i--) {
    const t = (todayUtc - i * dayMs) as UTCTimestamp;
    const drift = (seed(h + i * 13) - 0.48) * 0.02;
    const open = close;
    close = Math.max(0.1, open * (1 + drift));
    const hi = Math.max(open, close) * (1 + seed(h + i * 17) * 0.01);
    const lo = Math.min(open, close) * (1 - seed(h + i * 19) * 0.01);
    const volume = Math.floor(500_000 + seed(h + i * 23) * 2_000_000);
    out.push({ time: t, open: +open.toFixed(2), high: +hi.toFixed(2), low: +lo.toFixed(2), close: +close.toFixed(2), volume });
  }
  return out;
}

/** Try Alpha Vantage for US stocks, else simulated. */
export async function fetchOHLCV(ticker: string, market: "IN" | "US"): Promise<Candle[]> {
  if (market === "US") {
    const key = import.meta.env.VITE_ALPHA_VANTAGE_KEY;
    if (key && key !== "your_alpha_vantage_key_here") {
      try {
        const r = await fetch(
          `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&apikey=${key}&outputsize=compact`,
        );
        const j = await r.json();
        const series = j["Time Series (Daily)"];
        if (series) {
          const rows: Candle[] = Object.entries(series)
            .slice(0, 60)
            .map(([date, v]) => {
              const o = v as Record<string, string>;
              return {
                time: (Date.parse(date) / 1000) as UTCTimestamp,
                open: parseFloat(o["1. open"]),
                high: parseFloat(o["2. high"]),
                low: parseFloat(o["3. low"]),
                close: parseFloat(o["4. close"]),
                volume: parseInt(o["5. volume"], 10),
              };
            })
            .sort((a, b) => (a.time as number) - (b.time as number));
          if (rows.length) return rows;
        }
      } catch {
        // fall through to simulated
      }
    }
  }
  return simulatedOHLCV(ticker, 60);
}
