import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  symbol: z.string().min(1).max(16),
  companyName: z.string().min(1).max(120),
  market: z.enum(["IN", "US"]),
  currentPrice: z.number().positive(),
  changePercent: z.number(),
});

export type AnalysisReport = {
  summary: string;
  priceAnalysis: {
    currentTrend: string;
    trendStrength: string;
    keyObservation: string;
  };
  technicalLevels: {
    strongSupport: string;
    weakSupport: string;
    weakResistance: string;
    strongResistance: string;
    pivot: string;
  };
  indicators: {
    rsi: { value: string; signal: string; interpretation: string };
    macd: { signal: string; interpretation: string };
    movingAverages: { signal: string; interpretation: string };
    volume: { status: string; interpretation: string };
  };
  volatility: {
    level: string;
    betaEstimate: string;
    riskLevel: string;
    observation: string;
  };
  patterns: string[];
  keyRisks: string[];
  opportunities: string[];
  disclaimer: string;
};

const buildPrompt = (s: z.infer<typeof InputSchema>) => {
  const sym = s.market === "IN" ? "₹" : "$";
  const mkt = s.market === "IN" ? "NSE India" : "NASDAQ/NYSE USA";
  return `You are a professional financial analyst AI for NISHIRA.TRADE, a paper trading platform. Generate a comprehensive technical analysis report for ${s.symbol} (${s.companyName}).

Current Data:
- Symbol: ${s.symbol}
- Market: ${mkt}
- Current Price: ${sym}${s.currentPrice}
- Today's Change: ${s.changePercent}%

Generate a PROFESSIONAL TRADER'S REPORT in the following exact JSON structure. Return ONLY valid JSON, no markdown:

{
  "summary": "2-3 sentence executive summary of the stock's current position",
  "priceAnalysis": {
    "currentTrend": "Bullish/Bearish/Sideways",
    "trendStrength": "Strong/Moderate/Weak",
    "keyObservation": "Key price observation in 1-2 sentences"
  },
  "technicalLevels": {
    "strongSupport": "price level",
    "weakSupport": "price level",
    "weakResistance": "price level",
    "strongResistance": "price level",
    "pivot": "price level"
  },
  "indicators": {
    "rsi": {"value": "estimated 0-100", "signal": "Overbought/Neutral/Oversold", "interpretation": "1 sentence"},
    "macd": {"signal": "Bullish/Bearish/Neutral", "interpretation": "1 sentence"},
    "movingAverages": {"signal": "Above/Below MA", "interpretation": "1 sentence"},
    "volume": {"status": "High/Normal/Low", "interpretation": "1 sentence"}
  },
  "volatility": {
    "level": "High/Medium/Low",
    "betaEstimate": "estimated beta value",
    "riskLevel": "High Risk/Medium Risk/Low Risk",
    "observation": "1 sentence about volatility"
  },
  "patterns": ["pattern1 observed", "pattern2 observed"],
  "keyRisks": ["risk1", "risk2", "risk3"],
  "opportunities": ["opportunity1", "opportunity2"],
  "disclaimer": "This is an educational analysis only. Not investment advice. Past patterns do not guarantee future results. Consult a SEBI-registered advisor before investing."
}`;
};

const extractJson = (text: string): AnalysisReport => {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const slice = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  try {
    return JSON.parse(slice) as AnalysisReport;
  } catch {
    // Repair common model JSON issues: trailing commas, smart quotes,
    // unescaped newlines inside strings, missing commas between properties.
    let repaired = slice
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/,(\s*[}\]])/g, "$1")
      .replace(/}\s*\n\s*"/g, '},\n"')
      .replace(/"\s*\n\s*"/g, '",\n"');
    // Escape raw newlines inside string literals
    repaired = repaired.replace(/"((?:\\.|[^"\\])*)"/gs, (_m, inner) =>
      '"' + inner.replace(/\r?\n/g, "\\n") + '"',
    );
    try {
      return JSON.parse(repaired) as AnalysisReport;
    } catch (e) {
      throw new Error(
        "The AI returned malformed JSON. Please click Generate again — this usually succeeds on retry.",
      );
    }
  }
};

// Simple in-memory cache (per server instance) — keyed by symbol + rounded price bucket.
// Cuts repeated API calls when users click Generate multiple times on the same stock.
const CACHE = new Map<string, { at: number; report: AnalysisReport }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function tryGemini(
  model: string,
  key: string,
  prompt: string,
): Promise<AnalysisReport> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      }),
    },
  );
  if (res.status === 429 || res.status === 503) throw new Error(`RETRY_${res.status}`);
  if (!res.ok) throw new Error(`Gemini ${model} (${res.status}): ${(await res.text()).slice(0, 160)}`);
  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
  return extractJson(text);
}

async function tryLovable(model: string, key: string, prompt: string): Promise<AnalysisReport> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });
  if (res.status === 429 || res.status === 503) throw new Error(`RETRY_${res.status}`);
  if (res.status === 402)
    throw new Error("AI credits exhausted. Please add credits in Settings → Plans & credits.");
  if (!res.ok) throw new Error(`Lovable ${model} (${res.status}): ${(await res.text()).slice(0, 160)}`);
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = json.choices?.[0]?.message?.content ?? "";
  return extractJson(text);
}

export const generateStockAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => InputSchema.parse(raw))
  .handler(async ({ data }): Promise<AnalysisReport> => {
    const prompt = buildPrompt(data);
    const cacheKey = `${data.market}:${data.symbol}:${Math.round(data.currentPrice)}`;
    const cached = CACHE.get(cacheKey);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.report;

    const geminiKey = process.env.GEMINI_API_KEY;
    const lovableKey = process.env.LOVABLE_API_KEY;

    // Provider chain — tries fastest+cheapest first, then wider fallbacks.
    // Each provider gets 2 attempts with exponential backoff on 429/503.
    type Provider = { name: string; run: () => Promise<AnalysisReport> };
    const chain: Provider[] = [];
    if (geminiKey) {
      chain.push({ name: "gemini-2.0-flash", run: () => tryGemini("gemini-2.0-flash", geminiKey, prompt) });
      chain.push({ name: "gemini-1.5-flash", run: () => tryGemini("gemini-1.5-flash", geminiKey, prompt) });
    }
    if (lovableKey) {
      chain.push({ name: "lovable:gemini-2.5-flash", run: () => tryLovable("google/gemini-2.5-flash", lovableKey, prompt) });
      chain.push({ name: "lovable:gemini-2.5-flash-lite", run: () => tryLovable("google/gemini-2.5-flash-lite", lovableKey, prompt) });
    }
    if (chain.length === 0) throw new Error("Missing GEMINI_API_KEY or LOVABLE_API_KEY");

    let lastErr: Error | null = null;
    for (const provider of chain) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const report = await provider.run();
          CACHE.set(cacheKey, { at: Date.now(), report });
          return report;
        } catch (err) {
          lastErr = err as Error;
          const msg = lastErr.message;
          const retryable = msg.startsWith("RETRY_");
          console.warn(`[analysis] ${provider.name} attempt ${attempt + 1} failed: ${msg}`);
          if (!retryable) break; // non-retryable → next provider
          if (attempt === 0) await sleep(800 + Math.random() * 600); // backoff before retry
        }
      }
    }

    throw new Error(
      `All AI providers are busy right now. Please try again in a few seconds. (${lastErr?.message ?? "unknown"})`,
    );
  });
