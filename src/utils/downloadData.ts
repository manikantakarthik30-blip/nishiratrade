import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";
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

/* ---------------- Full stock history (deterministic OHLCV) ---------------- */

export type OHLCRow = {
  Date: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
  "Change %": number;
};

/** Build a deterministic day-by-day OHLC history from `startDate` to `endDate` ending at `endPrice`. */
export function buildFullOHLC(
  ticker: string,
  endPrice: number,
  startDate: Date,
  endDate: Date,
): OHLCRow[] {
  let seed = 0;
  for (let i = 0; i < ticker.length; i++) seed = (seed * 31 + ticker.charCodeAt(i)) >>> 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  const dayMs = 86400_000;
  const start = new Date(startDate); start.setHours(0, 0, 0, 0);
  const end = new Date(endDate); end.setHours(0, 0, 0, 0);
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / dayMs) + 1);

  // walk forward from a deterministic starting price to endPrice
  const startFactor = 0.35 + rand() * 0.35; // 0.35..0.70 of endPrice
  let close = endPrice * startFactor;
  const rows: OHLCRow[] = [];
  let prevClose = close;
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start.getTime() + i * dayMs);
    const day = d.getDay();
    if (day === 0 || day === 6) continue; // skip weekends
    const drift = (rand() - 0.48) * 0.035;
    const open = close;
    close = Math.max(0.1, open * (1 + drift));
    const hi = Math.max(open, close) * (1 + rand() * 0.015);
    const lo = Math.min(open, close) * (1 - rand() * 0.015);
    const vol = Math.floor(300_000 + rand() * 3_000_000);
    const chgPct = prevClose > 0 ? ((close - prevClose) / prevClose) * 100 : 0;
    rows.push({
      Date: d.toISOString().split("T")[0],
      Open: +open.toFixed(2),
      High: +hi.toFixed(2),
      Low: +lo.toFixed(2),
      Close: +close.toFixed(2),
      Volume: vol,
      "Change %": +chgPct.toFixed(2),
    });
    prevClose = close;
  }
  // pin last row's close to the live end price so the download matches the ticker
  if (rows.length) {
    const last = rows[rows.length - 1];
    const scale = endPrice / last.Close;
    last.Open = +(last.Open * scale).toFixed(2);
    last.High = +(Math.max(last.Open, endPrice) * (1 + 0.002)).toFixed(2);
    last.Low = +(Math.min(last.Open, endPrice) * (1 - 0.002)).toFixed(2);
    last.Close = +endPrice.toFixed(2);
  }
  return rows;
}

export function downloadStockHistory(opts: {
  symbol: string;
  endPrice: number;
  from: Date;
  to: Date;
  format: "csv" | "xlsx";
}) {
  const { symbol, endPrice, from, to, format } = opts;
  const rows = buildFullOHLC(symbol, endPrice, from, to);
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 10 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `${symbol} History`);
  const label = `${from.toISOString().split("T")[0]}_to_${to.toISOString().split("T")[0]}`;
  const filename = `NISHIRA_${symbol}_${label}.${format}`;
  XLSX.writeFile(wb, filename, { bookType: format === "csv" ? "csv" : "xlsx" });
}

/* ---------------- Analysis report — PDF + Word ---------------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnalysisReport = any;
type AnalysisMeta = {
  ticker: string;
  name: string;
  market: "IN" | "US";
  currency: "INR" | "USD";
  currentPrice: number;
};

function fmtPrice(n: number, currency: "INR" | "USD") {
  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return String(n);
  }
}

export function downloadAnalysisPDF(meta: AnalysisMeta, r: AnalysisReport) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  const ensure = (h: number) => {
    if (y + h > pageH - margin) { doc.addPage(); y = margin; }
  };
  const heading = (text: string, size = 14) => {
    ensure(size + 12);
    doc.setFont("helvetica", "bold"); doc.setFontSize(size);
    doc.setTextColor(20, 40, 90);
    doc.text(text, margin, y); y += size + 6;
    doc.setTextColor(30);
  };
  const body = (text: string, opts: { bold?: boolean; size?: number } = {}) => {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size ?? 10);
    const lines = doc.splitTextToSize(text, pageW - margin * 2);
    for (const line of lines) {
      ensure(14);
      doc.text(line, margin, y); y += 13;
    }
  };
  const kv = (k: string, v: string) => {
    ensure(14);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text(k, margin, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(v, pageW - margin * 2 - 130);
    doc.text(lines, margin + 130, y);
    y += Math.max(14, lines.length * 13);
  };

  // Title
  doc.setFont("helvetica", "bold"); doc.setFontSize(20);
  doc.setTextColor(0, 100, 180);
  doc.text("NISHIRA.TRADE", margin, y); y += 22;
  doc.setFontSize(12); doc.setTextColor(90);
  doc.text("Professional Stock Analysis Report", margin, y); y += 20;

  doc.setDrawColor(0, 100, 180); doc.setLineWidth(1);
  doc.line(margin, y, pageW - margin, y); y += 14;

  kv("Stock:", `${meta.name} (${meta.ticker})`);
  kv("Market:", meta.market === "IN" ? "NSE / BSE India" : "NASDAQ / NYSE USA");
  kv("Current Price:", fmtPrice(meta.currentPrice, meta.currency));
  kv("Generated:", new Date().toLocaleString("en-IN"));
  y += 6;

  heading("Executive Summary");
  body(r.summary ?? "-");

  heading("Price Analysis");
  kv("Current Trend:", r.priceAnalysis?.currentTrend ?? "-");
  kv("Trend Strength:", r.priceAnalysis?.trendStrength ?? "-");
  kv("Key Observation:", r.priceAnalysis?.keyObservation ?? "-");

  heading("Technical Levels");
  kv("Strong Resistance:", String(r.technicalLevels?.strongResistance ?? "-"));
  kv("Weak Resistance:", String(r.technicalLevels?.weakResistance ?? "-"));
  kv("Pivot:", String(r.technicalLevels?.pivot ?? "-"));
  kv("Weak Support:", String(r.technicalLevels?.weakSupport ?? "-"));
  kv("Strong Support:", String(r.technicalLevels?.strongSupport ?? "-"));

  heading("Indicators");
  if (r.indicators?.rsi) {
    kv("RSI:", `${r.indicators.rsi.value} — ${r.indicators.rsi.signal}. ${r.indicators.rsi.interpretation}`);
  }
  if (r.indicators?.macd) {
    kv("MACD:", `${r.indicators.macd.signal}. ${r.indicators.macd.interpretation}`);
  }
  if (r.indicators?.movingAverages) {
    kv("Moving Averages:", `${r.indicators.movingAverages.signal}. ${r.indicators.movingAverages.interpretation}`);
  }
  if (r.indicators?.volume) {
    kv("Volume:", `${r.indicators.volume.status}. ${r.indicators.volume.interpretation}`);
  }

  heading("Volatility & Risk");
  kv("Level:", r.volatility?.level ?? "-");
  kv("Beta Estimate:", String(r.volatility?.betaEstimate ?? "-"));
  kv("Risk Level:", r.volatility?.riskLevel ?? "-");
  kv("Observation:", r.volatility?.observation ?? "-");

  if (Array.isArray(r.patterns) && r.patterns.length) {
    heading("Patterns Observed");
    for (const p of r.patterns) body(`• ${p}`);
  }
  if (Array.isArray(r.keyRisks) && r.keyRisks.length) {
    heading("Key Risks");
    for (const p of r.keyRisks) body(`• ${p}`);
  }
  if (Array.isArray(r.opportunities) && r.opportunities.length) {
    heading("Opportunities");
    for (const p of r.opportunities) body(`• ${p}`);
  }

  heading("Disclaimer", 12);
  doc.setTextColor(140, 90, 0);
  body(r.disclaimer ?? "For educational purposes only. Not financial advice.");
  doc.setTextColor(30);

  doc.save(`NISHIRA_Analysis_${meta.ticker}_${today()}.pdf`);
}

export async function downloadAnalysisDocx(meta: AnalysisMeta, r: AnalysisReport) {
  const P = (text: string, opts: { bold?: boolean; size?: number; color?: string } = {}) =>
    new Paragraph({
      children: [new TextRun({ text, bold: opts.bold, size: opts.size ?? 22, color: opts.color })],
    });
  const H = (text: string, level: 1 | 2 = 2) =>
    new Paragraph({
      heading: level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
      children: [new TextRun({ text, bold: true, color: "1F4E79" })],
      spacing: { before: 200, after: 100 },
    });
  const KV = (k: string, v: string) =>
    new Paragraph({
      children: [
        new TextRun({ text: `${k} `, bold: true }),
        new TextRun({ text: v }),
      ],
    });
  const Bullet = (text: string) =>
    new Paragraph({ text, bullet: { level: 0 } });

  const border = { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" };
  const cellBorders = { top: border, bottom: border, left: border, right: border };
  const tCell = (text: string, bold = false, shade?: string) =>
    new TableCell({
      borders: cellBorders,
      shading: shade ? { fill: shade, type: ShadingType.CLEAR, color: "auto" } : undefined,
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text, bold })] })],
    });

  const levelsRows = [
    ["Strong Resistance", String(r.technicalLevels?.strongResistance ?? "-")],
    ["Weak Resistance", String(r.technicalLevels?.weakResistance ?? "-")],
    ["Pivot", String(r.technicalLevels?.pivot ?? "-")],
    ["Weak Support", String(r.technicalLevels?.weakSupport ?? "-")],
    ["Strong Support", String(r.technicalLevels?.strongSupport ?? "-")],
  ].map(
    ([k, v]) =>
      new TableRow({ children: [tCell(k), tCell(v, true)] }),
  );
  const levelsTable = new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [4500, 4500],
    rows: [
      new TableRow({
        children: [tCell("Level", true, "1F4E79"), tCell("Value", true, "1F4E79")],
      }),
      ...levelsRows,
    ],
  });

  const children: Paragraph[] | (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "NISHIRA.TRADE", bold: true, size: 40, color: "0064B4" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Professional Stock Analysis Report", size: 24, color: "666666" })],
      spacing: { after: 200 },
    }),
    KV("Stock:", `${meta.name} (${meta.ticker})`),
    KV("Market:", meta.market === "IN" ? "NSE / BSE India" : "NASDAQ / NYSE USA"),
    KV("Current Price:", fmtPrice(meta.currentPrice, meta.currency)),
    KV("Generated:", new Date().toLocaleString("en-IN")),

    H("Executive Summary"),
    P(r.summary ?? "-"),

    H("Price Analysis"),
    KV("Current Trend:", r.priceAnalysis?.currentTrend ?? "-"),
    KV("Trend Strength:", r.priceAnalysis?.trendStrength ?? "-"),
    KV("Key Observation:", r.priceAnalysis?.keyObservation ?? "-"),

    H("Technical Levels"),
    levelsTable,

    H("Indicators"),
    ...(r.indicators?.rsi
      ? [KV("RSI:", `${r.indicators.rsi.value} — ${r.indicators.rsi.signal}. ${r.indicators.rsi.interpretation}`)]
      : []),
    ...(r.indicators?.macd
      ? [KV("MACD:", `${r.indicators.macd.signal}. ${r.indicators.macd.interpretation}`)]
      : []),
    ...(r.indicators?.movingAverages
      ? [KV("Moving Averages:", `${r.indicators.movingAverages.signal}. ${r.indicators.movingAverages.interpretation}`)]
      : []),
    ...(r.indicators?.volume
      ? [KV("Volume:", `${r.indicators.volume.status}. ${r.indicators.volume.interpretation}`)]
      : []),

    H("Volatility & Risk"),
    KV("Level:", r.volatility?.level ?? "-"),
    KV("Beta Estimate:", String(r.volatility?.betaEstimate ?? "-")),
    KV("Risk Level:", r.volatility?.riskLevel ?? "-"),
    KV("Observation:", r.volatility?.observation ?? "-"),

    ...(Array.isArray(r.patterns) && r.patterns.length
      ? [H("Patterns Observed"), ...r.patterns.map((p: string) => Bullet(p))]
      : []),
    ...(Array.isArray(r.keyRisks) && r.keyRisks.length
      ? [H("Key Risks"), ...r.keyRisks.map((p: string) => Bullet(p))]
      : []),
    ...(Array.isArray(r.opportunities) && r.opportunities.length
      ? [H("Opportunities"), ...r.opportunities.map((p: string) => Bullet(p))]
      : []),

    H("Disclaimer"),
    P(r.disclaimer ?? "For educational purposes only. Not financial advice.", { color: "8B5A00" }),
  ];

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Calibri", size: 22 } } },
    },
    sections: [
      {
        properties: { page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } } },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `NISHIRA_Analysis_${meta.ticker}_${today()}.docx`);
}
