import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchOHLCV } from "@/lib/chart-theme";

/** Expose the Finnhub key to the browser for WebSocket streaming. */
export const getFinnhubKey = createServerFn({ method: "GET" }).handler(async () => {
  return process.env.FINNHUB_API_KEY ?? null;
});

const ohlcvSchema = z.object({
  ticker: z.string().min(1).max(16),
  market: z.enum(["IN", "US"]),
});

/** Fetch OHLCV history server-side so the Alpha Vantage key stays secret. */
export const getOHLCV = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => ohlcvSchema.parse(raw))
  .handler(async ({ data }) => {
    return fetchOHLCV(data.ticker, data.market, process.env.ALPHA_VANTAGE_KEY ?? undefined);
  });
