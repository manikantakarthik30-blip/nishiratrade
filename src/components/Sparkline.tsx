import { useEffect, useRef } from "react";
import {
  createChart,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { getStock, livePrice } from "@/lib/stocks";

interface Props {
  ticker: string;
  width?: number;
  height?: number;
}

export function Sparkline({ ticker, width = 80, height = 40 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const stock = getStock(ticker);
    if (!stock) return;

    // Build initial 30-point history
    const now = Math.floor(Date.now() / 1000);
    let price = stock.basePrice;
    const points: { time: UTCTimestamp; value: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const drift = (Math.sin(i * 0.7 + ticker.length) + (Math.random() - 0.5)) * 0.01;
      price = Math.max(0.01, price * (1 + drift));
      points.push({ time: (now - i * 300) as UTCTimestamp, value: +price.toFixed(2) });
    }
    const last = livePrice(ticker);
    points[points.length - 1].value = last;
    const first = points[0].value;
    const up = last >= first;
    const color = up ? "#22c55e" : "#ef4444";

    const chart: IChartApi = createChart(ref.current, {
      width,
      height,
      layout: { background: { color: "transparent" }, textColor: "#a0a0b0" },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      rightPriceScale: { visible: false },
      leftPriceScale: { visible: false },
      timeScale: { visible: false },
      crosshair: { horzLine: { visible: false }, vertLine: { visible: false } },
      handleScale: false,
      handleScroll: false,
    });
    const line: ISeriesApi<"Line"> = chart.addSeries(LineSeries, {
      color,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    line.setData(points);
    chart.timeScale().fitContent();

    const timer = setInterval(() => {
      const p = points[points.length - 1].value;
      const pct = (Math.random() * 2 - 1) / 100;
      const next = Math.max(0.01, p * (1 + pct));
      const t = (Math.floor(Date.now() / 1000)) as UTCTimestamp;
      const point = { time: t, value: +next.toFixed(2) };
      points.push(point);
      if (points.length > 60) points.shift();
      line.update(point);
    }, 5000);

    return () => {
      clearInterval(timer);
      chart.remove();
    };
  }, [ticker, width, height]);

  return <div ref={ref} style={{ width, height }} />;
}
