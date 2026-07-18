/**
 * AngelOne SmartAPI helpers — server-only (never imported from client bundles).
 * Handles login (with TOTP) and LTP quote fetching, with in-memory session cache.
 */

const BASE = "https://apiconnect.angelone.in";

// NSE trading-symbol + token for the Indian stocks used in the app.
// AngelOne LTP endpoint requires exchange tokens (numeric strings).
export const NSE_TOKENS: Record<string, { symbol: string; token: string }> = {
  RELIANCE: { symbol: "RELIANCE-EQ", token: "2885" },
  TCS: { symbol: "TCS-EQ", token: "11536" },
  INFY: { symbol: "INFY-EQ", token: "1594" },
  HDFC: { symbol: "HDFCBANK-EQ", token: "1333" },
  WIPRO: { symbol: "WIPRO-EQ", token: "3787" },
  BAJAJ: { symbol: "BAJFINANCE-EQ", token: "317" },
  TITAN: { symbol: "TITAN-EQ", token: "3506" },
  LT: { symbol: "LT-EQ", token: "11483" },
  ICICI: { symbol: "ICICIBANK-EQ", token: "4963" },
  SBIN: { symbol: "SBIN-EQ", token: "3045" },
};

const HEADERS_BASE = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-UserType": "USER",
  "X-SourceID": "WEB",
  "X-ClientLocalIP": "192.168.1.1",
  "X-ClientPublicIP": "106.193.147.98",
  "X-MACAddress": "00:00:00:00:00:00",
};

// ---- Base32 decode + TOTP (HMAC-SHA1) via Web Crypto ----
function base32Decode(input: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = input.replace(/=+$/, "").toUpperCase().replace(/\s+/g, "");
  const out: number[] = [];
  let bits = 0;
  let value = 0;
  for (const ch of clean) {
    const idx = alphabet.indexOf(ch);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((value >>> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
}

async function totp(secretBase32: string, step = 30, digits = 6): Promise<string> {
  const key = base32Decode(secretBase32);
  const counter = Math.floor(Date.now() / 1000 / step);
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(0, Math.floor(counter / 0x100000000));
  view.setUint32(4, counter >>> 0);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, buf));
  const offset = sig[sig.length - 1] & 0xf;
  const code =
    ((sig[offset] & 0x7f) << 24) |
    ((sig[offset + 1] & 0xff) << 16) |
    ((sig[offset + 2] & 0xff) << 8) |
    (sig[offset + 3] & 0xff);
  return (code % 10 ** digits).toString().padStart(digits, "0");
}

// ---- Session cache (module-scope for Worker instance) ----
type Session = { jwt: string; expiresAt: number };
let cached: Session | null = null;

async function login(): Promise<Session> {
  const apiKey = process.env.ANGELONE_API_KEY;
  const clientId = process.env.ANGELONE_CLIENT_ID;
  const pin = process.env.ANGELONE_PIN;
  const totpSecret = process.env.ANGELONE_TOTP_KEY;
  if (!apiKey || !clientId || !pin || !totpSecret) {
    throw new Error("AngelOne credentials not configured");
  }

  const otp = await totp(totpSecret);
  const res = await fetch(`${BASE}/rest/auth/angelbroking/user/v1/loginByPassword`, {
    method: "POST",
    headers: { ...HEADERS_BASE, "X-PrivateKey": apiKey },
    body: JSON.stringify({ clientcode: clientId, password: pin, totp: otp }),
  });
  const json = (await res.json()) as {
    status?: boolean;
    message?: string;
    data?: { jwtToken?: string };
  };
  if (!json.status || !json.data?.jwtToken) {
    throw new Error(`AngelOne login failed: ${json.message ?? "unknown"}`);
  }
  return {
    jwt: json.data.jwtToken,
    // JWT valid ~24h; refresh at 6h to be safe.
    expiresAt: Date.now() + 6 * 60 * 60 * 1000,
  };
}

async function getSession(): Promise<Session> {
  if (cached && cached.expiresAt > Date.now()) return cached;
  cached = await login();
  return cached;
}

/** Fetch LTP for the given app tickers. Returns { ticker: price }. */
export async function fetchLTPs(tickers: string[]): Promise<Record<string, number>> {
  const apiKey = process.env.ANGELONE_API_KEY!;
  const wanted = tickers.filter((t) => NSE_TOKENS[t]);
  if (wanted.length === 0) return {};

  const tokens = wanted.map((t) => NSE_TOKENS[t].token);
  const symbolToTicker = new Map(wanted.map((t) => [NSE_TOKENS[t].symbol, t]));
  const tokenToTicker = new Map(wanted.map((t) => [NSE_TOKENS[t].token, t]));

  const doFetch = async (jwt: string) => {
    const r = await fetch(`${BASE}/rest/secure/angelbroking/market/v1/quote/`, {
      method: "POST",
      headers: {
        ...HEADERS_BASE,
        "X-PrivateKey": apiKey,
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ mode: "LTP", exchangeTokens: { NSE: tokens } }),
    });
    return (await r.json()) as {
      status?: boolean;
      message?: string;
      errorcode?: string;
      data?: { fetched?: Array<{ tradingSymbol: string; symbolToken: string; ltp: number }> };
    };
  };

  let { jwt } = await getSession();
  let json = await doFetch(jwt);

  // Session expired → re-login once and retry.
  if (!json.status && /token|session|unauthor/i.test(json.message ?? "")) {
    cached = null;
    jwt = (await getSession()).jwt;
    json = await doFetch(jwt);
  }

  const out: Record<string, number> = {};
  for (const row of json.data?.fetched ?? []) {
    const ticker =
      symbolToTicker.get(row.tradingSymbol) ?? tokenToTicker.get(row.symbolToken);
    if (ticker && typeof row.ltp === "number") out[ticker] = row.ltp;
  }
  return out;
}
