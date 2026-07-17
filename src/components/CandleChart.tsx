import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { chartTheme, simulatedOHLCV, type Candle } from "@/lib/chart-theme";
import { getStock } from "@/lib/stocks";
import { getFinnhubKey, getOHLCV } from "@/lib/market-data.functions";

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

  const fetchKey = useServerFn(getFinnhubKey);
  const fetchOHLCV = useServerFn(getOHLCV);

  const { data: finnhubKey } = useQuery({
    queryKey: ["finnhubKey"],
    queryFn: () => fetchKey(),
    staleTime: Infinity,
  });
  const { data: ohlcvRows } = useQuery({
    queryKey: ["ohlcv", ticker],
    queryFn: () => fetchOHLCV({ data: { ticker, market: getStock(ticker)?.market ?? "IN" } }),
    staleTime: 5 * 60 * 1000,
  });

  // Create chart once
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

    // Initial simulated data so the chart is never blank
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

    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volRef.current = null;
      lastRef.current = null;
    };
  }, [ticker, height]);

  // Upgrade to real OHLCV data when it arrives
  useEffect(() => {
    if (!candleRef.current || !volRef.current || !ohlcvRows?.length) return;
    candleRef.current.setData(ohlcvRows);
    volRef.current.setData(
      ohlcvRows.map((c) => ({
        time: c.time,
        value: c.volume,
        color: c.close >= c.open ? "#22c55e66" : "#ef444466",
      })),
    );
    lastRef.current = ohlcvRows[ohlcvRows.length - 1];
    chartRef.current?.timeScale().fitContent();
  }, [ohlcvRows]);

  // Real-time tick updates
  useEffect(() => {
    const stock = getStock(ticker);
    if (!stock || stock.market !== "US" || !finnhubKey || finnhubKey === "your_finnhub_api_key_here") {
      return;
    }
    if (!candleRef.current || !volRef.current) return;

    let ws: WebSocket | null = null;
    let cancelled = false;
    let simTimer: ReturnType<typeof setInterval> | null = null;

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
        if (!simTimer) simTimer = setInterval(simTick, 2000);
      };
    } catch {
      simTimer = setInterval(simTick, 2000);
    }

    function simTick() {
      const last = lastRef.current;
      if (!last) return;
      const pct = (Math.random() * 2 - 1) / 100;
      applyTick(Math.max(0.01, last.close * (1 + pct)));
    }

    return () => {
      cancelled = true;
      if (simTimer) clearInterval(simTimer);
      if (ws) {
        try {
          ws.send(JSON.stringify({ type: "unsubscribe", symbol: ticker }));
        } catch {
          /* ignore */
        }
        ws.close();
      }
    };
  }, [ticker, finnhubKey]);

  return <div ref={containerRef} style={{ width: "100%", height }} />;
}

export type { UTCTimestamp };
