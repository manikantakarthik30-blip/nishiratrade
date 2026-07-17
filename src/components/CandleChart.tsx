import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { chartTheme, fetchOHLCV, simulatedOHLCV, type Candle } from "@/lib/chart-theme";
import { getStock } from "@/lib/stocks";

interface Props {
  ticker: string;
  height?: number;
}

export function CandleChart({ ticker, height = 400 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const lastRef = useRef<Candle | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const stock = getStock(ticker);
    if (!stock) return;

    const chart = createChart(containerRef.current, {
      ...chartTheme,
      width: containerRef.current.clientWidth,
      height,
    });
    const candle = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
      priceFormat: {
        type: "price",
        precision: 2,
        minMove: 0.01,
      },
    });
    const vol = chart.addSeries(HistogramSeries, {
      color: "#7c3aed66",
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    vol.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleRef.current = candle;
    volRef.current = vol;

    let cancelled = false;
    let ws: WebSocket | null = null;
    let simTimer: ReturnType<typeof setInterval> | null = null;

    (async () => {
      // Immediate simulated data so the chart is never blank
      const initial = simulatedOHLCV(ticker, 60);
      candle.setData(initial);
      vol.setData(
        initial.map((c) => ({
          time: c.time,
          value: c.volume,
          color: c.close >= c.open ? "#22c55e66" : "#ef444466",
        })),
      );
      lastRef.current = initial[initial.length - 1];
      chart.timeScale().fitContent();

      // Try to upgrade to real data
      const rows = await fetchOHLCV(ticker, stock.market);
      if (cancelled || !rows.length) return;
      candle.setData(rows);
      vol.setData(
        rows.map((c) => ({
          time: c.time,
          value: c.volume,
          color: c.close >= c.open ? "#22c55e66" : "#ef444466",
        })),
      );
      lastRef.current = rows[rows.length - 1];
      chart.timeScale().fitContent();
    })();

    // Real-time updates
    const finnhubKey = import.meta.env.VITE_FINNHUB_API_KEY;
    const useWs =
      stock.market === "US" && finnhubKey && finnhubKey !== "your_finnhub_api_key_here";

    const applyTick = (price: number) => {
      const last = lastRef.current;
      if (!last || !candleRef.current || !volRef.current) return;
      const updated: Candle = {
        ...last,
        high: Math.max(last.high, price),
        low: Math.min(last.low, price),
        close: +price.toFixed(2),
      };
      lastRef.current = updated;
      candleRef.current.update({
        time: updated.time,
        open: updated.open,
        high: updated.high,
        low: updated.low,
        close: updated.close,
      });
      volRef.current.update({
        time: updated.time,
        value: updated.volume,
        color: updated.close >= updated.open ? "#22c55e66" : "#ef444466",
      });
    };

    if (useWs) {
      try {
        ws = new WebSocket(`wss://ws.finnhub.io?token=${finnhubKey}`);
        ws.onopen = () => ws?.send(JSON.stringify({ type: "subscribe", symbol: ticker }));
        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data);
            if (msg.type === "trade" && Array.isArray(msg.data) && msg.data[0]?.p) {
              applyTick(msg.data[0].p);
            }
          } catch {
            /* ignore */
          }
        };
        ws.onerror = () => {
          // fall back to simulation if socket dies
          if (!simTimer) simTimer = setInterval(simTick, 2000);
        };
      } catch {
        simTimer = setInterval(simTick, 2000);
      }
    } else {
      simTimer = setInterval(simTick, 2000);
    }

    function simTick() {
      const last = lastRef.current;
      if (!last) return;
      const pct = (Math.random() * 2 - 1) / 100;
      applyTick(Math.max(0.01, last.close * (1 + pct)));
    }

    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      cancelled = true;
      ro.disconnect();
      if (simTimer) clearInterval(simTimer);
      if (ws) {
        try {
          ws.send(JSON.stringify({ type: "unsubscribe", symbol: ticker }));
        } catch {
          /* ignore */
        }
        ws.close();
      }
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volRef.current = null;
    };
  }, [ticker, height]);

  return <div ref={containerRef} style={{ width: "100%", height }} />;
}

export type { UTCTimestamp };
