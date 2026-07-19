import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchOHLCV } from "@/lib/chart-theme";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Expose the Finnhub key only to authenticated users for WebSocket streaming. */
export const getFinnhubKey = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
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

const ltpSchema = z.object({ tickers: z.array(z.string().min(1).max(16)).max(30) });

/** Real-time LTP for Indian stocks via AngelOne SmartAPI. Returns {} on failure. */
export const getIndianLTP = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => ltpSchema.parse(raw))
  .handler(async ({ data }) => {
    try {
      const { fetchLTPs } = await import("@/lib/angelone.server");
      return await fetchLTPs(data.tickers);
    } catch (err) {
      console.error("[angelone] LTP failed:", err instanceof Error ? err.message : err);
      return {} as Record<string, number>;
    }
  });
