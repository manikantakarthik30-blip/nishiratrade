export type Market = "IN" | "US";

export interface Stock {
  ticker: string;
  name: string;
  market: Market;
  basePrice: number;
  currency: "INR" | "USD";
}

export const STOCKS: Stock[] = [
  // Indian (NSE)
  { ticker: "RELIANCE", name: "Reliance Industries", market: "IN", basePrice: 2870, currency: "INR" },
  { ticker: "TCS", name: "Tata Consultancy Services", market: "IN", basePrice: 3985, currency: "INR" },
  { ticker: "INFY", name: "Infosys", market: "IN", basePrice: 1720, currency: "INR" },
  { ticker: "HDFC", name: "HDFC Bank", market: "IN", basePrice: 1680, currency: "INR" },
  { ticker: "WIPRO", name: "Wipro", market: "IN", basePrice: 545, currency: "INR" },
  { ticker: "BAJAJ", name: "Bajaj Finance", market: "IN", basePrice: 7120, currency: "INR" },
  { ticker: "TITAN", name: "Titan Company", market: "IN", basePrice: 3450, currency: "INR" },
  { ticker: "LT", name: "Larsen & Toubro", market: "IN", basePrice: 3630, currency: "INR" },
  { ticker: "ICICI", name: "ICICI Bank", market: "IN", basePrice: 1245, currency: "INR" },
  { ticker: "SBIN", name: "State Bank of India", market: "IN", basePrice: 820, currency: "INR" },
  // US
  { ticker: "AAPL", name: "Apple Inc.", market: "US", basePrice: 232, currency: "USD" },
  { ticker: "GOOGL", name: "Alphabet Inc.", market: "US", basePrice: 175, currency: "USD" },
  { ticker: "MSFT", name: "Microsoft", market: "US", basePrice: 428, currency: "USD" },
  { ticker: "AMZN", name: "Amazon", market: "US", basePrice: 198, currency: "USD" },
  { ticker: "TSLA", name: "Tesla", market: "US", basePrice: 248, currency: "USD" },
  { ticker: "META", name: "Meta Platforms", market: "US", basePrice: 570, currency: "USD" },
  { ticker: "NVDA", name: "NVIDIA", market: "US", basePrice: 138, currency: "USD" },
  { ticker: "NFLX", name: "Netflix", market: "US", basePrice: 715, currency: "USD" },
  { ticker: "AMD", name: "Advanced Micro Devices", market: "US", basePrice: 158, currency: "USD" },
  { ticker: "UBER", name: "Uber Technologies", market: "US", basePrice: 76, currency: "USD" },
];

export const STOCKS_BY_TICKER: Record<string, Stock> = Object.fromEntries(
  STOCKS.map((s) => [s.ticker, s]),
);

export function getStock(ticker: string): Stock | undefined {
  return STOCKS_BY_TICKER[ticker.toUpperCase()];
}

/**
 * Deterministic pseudo-random seeded by ticker + tick to keep prices in sync
 * across mounts within the same 3s window.
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Get a live-simulated price. Same for all viewers in the same 3-second window.
 */
export function livePrice(ticker: string): number {
  const stock = STOCKS_BY_TICKER[ticker];
  if (!stock) return 0;
  const bucket = Math.floor(Date.now() / 3000);
  const h = hashStr(ticker);
  // Slow trend + noise
  const trend = Math.sin(bucket / 40 + h) * 0.02;
  const noise = (seededRandom(h + bucket) - 0.5) * 0.015;
  return +(stock.basePrice * (1 + trend + noise)).toFixed(2);
}

/** Percent change vs base price. */
export function livePctChange(ticker: string): number {
  const stock = STOCKS_BY_TICKER[ticker];
  if (!stock) return 0;
  return ((livePrice(ticker) - stock.basePrice) / stock.basePrice) * 100;
}

/** Generate simulated N-day OHLC-style close history. */
export function priceHistory(ticker: string, days = 7, pointsPerDay = 8) {
  const stock = STOCKS_BY_TICKER[ticker];
  if (!stock) return [];
  const total = days * pointsPerDay;
  const h = hashStr(ticker);
  const arr: { time: string; price: number }[] = [];
  let price = stock.basePrice * 0.98;
  for (let i = 0; i < total; i++) {
    const drift = (seededRandom(h + i) - 0.48) * 0.015;
    price = Math.max(0.1, price * (1 + drift));
    const ago = total - i;
    const d = new Date(Date.now() - ago * ((days * 24 * 60) / total) * 60_000);
    arr.push({
      time: d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
      }),
      price: +price.toFixed(2),
    });
  }
  // Snap the final point to current live price
  arr[arr.length - 1].price = livePrice(ticker);
  return arr;
}

export function formatMoney(amount: number, currency: "INR" | "USD"): string {
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}
