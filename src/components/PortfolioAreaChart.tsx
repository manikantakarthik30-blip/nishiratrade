import { useEffect, useRef } from "react";
import {
  createChart,
  AreaSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { chartTheme } from "@/lib/chart-theme";

interface Props {
  /** Anchor "current" value; the chart walks 30 days backward from here. */
  currentValue: number;
  currency: "INR" | "USD";
  height?: number;
  /** Deterministic seed so INR and USD charts differ. */
  seed?: string;
}

export function PortfolioAreaChart({ currentValue, currency, height = 260, seed = "portfolio" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      ...chartTheme,
      width: ref.current.clientWidth,
      height,
      localization: {
        priceFormatter: (v: number) =>
          new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
            style: "currency",
            currency,
            maximumFractionDigits: 0,
          }).format(v),
      },
    });
    const area = chart.addSeries(AreaSeries, {
      lineColor: "#00d4ff",
      topColor: "#00d4ff33",
      bottomColor: "#7c3aed11",
      lineWidth: 2,
    });

    // Build 30-day history walking backward from currentValue
    const dayMs = 86400;
    const todayUtc = Math.floor(Date.now() / 1000 / dayMs) * dayMs;
    const anchor = currentValue > 0 ? currentValue : 100_000;
    let v = anchor;
    const points: { time: UTCTimestamp; value: number }[] = [];
    const h = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0);
    for (let i = 0; i < 30; i++) {
      const t = (todayUtc - i * dayMs) as UTCTimestamp;
      points.push({ time: t, value: +v.toFixed(2) });
      const drift = (Math.sin((h + i) * 0.9) + (Math.random() - 0.5)) * 0.015;
      v = Math.max(0.01, v / (1 + drift));
    }
    points.reverse();
    if (currentValue > 0) points[points.length - 1].value = +currentValue.toFixed(2);
    area.setData(points);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = area;

    const ro = new ResizeObserver(() => {
      if (ref.current && chartRef.current) {
        chartRef.current.applyOptions({ width: ref.current.clientWidth });
      }
    });
    ro.observe(ref.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [currentValue, currency, height, seed]);

  return <div ref={ref} style={{ width: "100%", height }} />;
}
