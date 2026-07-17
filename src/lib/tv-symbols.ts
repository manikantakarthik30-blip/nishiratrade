const SYMBOL_MAP: Record<string, string> = {
  NIFTY: "NSE:NIFTY",
  BANKNIFTY: "NSE:BANKNIFTY",
  SENSEX: "BSE:SENSEX",
  RELIANCE: "NSE:RELIANCE",
  TCS: "NSE:TCS",
  INFY: "NSE:INFY",
  HDFC: "NSE:HDFCBANK",
  HDFCBANK: "NSE:HDFCBANK",
  WIPRO: "NSE:WIPRO",
  ICICI: "NSE:ICICIBANK",
  ICICIBANK: "NSE:ICICIBANK",
  SBIN: "NSE:SBIN",
  BAJAJ: "NSE:BAJFINANCE",
  TITAN: "NSE:TITAN",
  LT: "NSE:LT",
  AAPL: "NASDAQ:AAPL",
  TSLA: "NASDAQ:TSLA",
  NVDA: "NASDAQ:NVDA",
  GOOGL: "NASDAQ:GOOGL",
  MSFT: "NASDAQ:MSFT",
  AMZN: "NASDAQ:AMZN",
  META: "NASDAQ:META",
  NFLX: "NASDAQ:NFLX",
  AMD: "NASDAQ:AMD",
  UBER: "NYSE:UBER",
};

export function toTvSymbol(input: string): string {
  const s = input.trim().toUpperCase();
  if (!s) return "NSE:NIFTY";
  if (s.includes(":")) return s;
  return SYMBOL_MAP[s] ?? `NSE:${s}`;
}

export function toFinnhubSymbol(ticker: string): string {
  return ticker.trim().toUpperCase();
}
