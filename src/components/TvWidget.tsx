import { useEffect, useRef } from "react";
import { toTvSymbol } from "@/lib/tv-symbols";

interface Props {
  symbol: string;
  height?: number | string;
  interval?: string;
}

/**
 * TradingView Advanced Chart embed. Reloads whenever the symbol changes.
 */
export function TvWidget({ symbol, height = 350, interval = "D" }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const tv = toTvSymbol(symbol);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    el.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "tradingview-widget-container";
    wrapper.style.height = "100%";
    wrapper.style.width = "100%";

    const inner = document.createElement("div");
    const id = `tv_${Math.random().toString(36).slice(2)}`;
    inner.id = id;
    inner.style.height = "calc(100% - 32px)";
    inner.style.width = "100%";
    wrapper.appendChild(inner);

    const copyright = document.createElement("div");
    copyright.className = "tradingview-widget-copyright";
    copyright.innerHTML =
      '<a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span class="blue-text">Track all markets on TradingView</span></a>';
    wrapper.appendChild(copyright);

    el.appendChild(wrapper);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tv,
      interval,
      timezone: "Asia/Kolkata",
      theme: "dark",
      style: "1",
      locale: "in",
      enable_publishing: false,
      withdateranges: true,
      hide_side_toolbar: true,
      allow_symbol_change: false,
      details: false,
      calendar: false,
      container_id: id,
    });
    inner.appendChild(script);

    return () => {
      el.innerHTML = "";
    };
  }, [tv, interval]);

  return <div ref={host} style={{ width: "100%", height }} />;
}
