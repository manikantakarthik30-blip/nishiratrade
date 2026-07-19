import * as XLSX from "xlsx";
import { getStock, livePrice } from "@/lib/stocks";

const today = () => new Date().toISOString().split("T")[0];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Holding = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Trade = any;

export function downloadPortfolioExcel(holdings: Holding[]) {
  const data = holdings.map((h) => {
    const s = getStock(h.ticker);
    const cur = livePrice(h.ticker);
    const qty = Number(h.qty);
    const avg = Number(h.avg_price);
    const invested = avg * qty;
    const current = cur * qty;
    const pl = current - invested;
    const plPct = invested > 0 ? (pl / invested) * 100 : 0;
    return {
      Symbol: h.ticker,
      Company: s?.name ?? h.ticker,
      Quantity: qty,
      "Avg Buy Price": +avg.toFixed(2),
      "Current Price": +cur.toFixed(2),
      "Total Invested": +invested.toFixed(2),
      "Current Value": +current.toFixed(2),
      "P&L": +pl.toFixed(2),
      "P&L %": plPct.toFixed(2) + "%",
      Currency: s?.currency ?? "",
      Market: h.market,
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 10 }, { wch: 28 }, { wch: 10 }, { wch: 15 }, { wch: 15 },
    { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 8 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Portfolio");
  XLSX.writeFile(wb, `NISHIRA_Portfolio_${today()}.xlsx`);
}

export function downloadTradeHistory(trades: Trade[]) {
  const data = trades.map((t) => {
    const s = getStock(t.ticker);
    const qty = Number(t.qty);
    const price = Number(t.price);
    const total = qty * price;
    const d = new Date(t.created_at);
    return {
      Date: d.toLocaleDateString("en-IN"),
      Time: d.toLocaleTimeString("en-IN"),
      Action: t.side,
      Symbol: t.ticker,
      Company: s?.name ?? t.ticker,
      Quantity: qty,
      Price: +price.toFixed(2),
      Total: +total.toFixed(2),
      Brokerage: +(total * 0.001).toFixed(2),
      Currency: s?.currency ?? "",
      Market: t.market,
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 28 },
    { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 8 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Trade History");
  XLSX.writeFile(wb, `NISHIRA_Trades_${today()}.xlsx`);
}

export function downloadStockCSV(
  symbol: string,
  priceHistory: { time: string | number | Date; price: number }[],
) {
  const data = priceHistory.map((p) => ({
    "Date/Time": typeof p.time === "string" ? p.time : new Date(p.time).toISOString(),
    Price: p.price,
    Symbol: symbol,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, symbol);
  XLSX.writeFile(wb, `NISHIRA_${symbol}_${today()}.csv`, { bookType: "csv" });
}
