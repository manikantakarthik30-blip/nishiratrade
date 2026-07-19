import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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
  return JSON.parse(slice) as AnalysisReport;
};

export const generateStockAnalysis = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => InputSchema.parse(raw))
  .handler(async ({ data }): Promise<AnalysisReport> => {
    const prompt = buildPrompt(data);
    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 1800, responseMimeType: "application/json" },
          }),
        },
      );
      if (res.status === 429) throw new Error("Rate limit reached. Try again in a moment.");
      if (!res.ok) throw new Error(`Gemini error (${res.status}): ${(await res.text()).slice(0, 200)}`);
      const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
      return extractJson(text);
    }

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing GEMINI_API_KEY or LOVABLE_API_KEY");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1800,
      }),
    });
    if (res.status === 429) throw new Error("Rate limit reached. Try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please add credits in Settings → Plans & credits.");
    if (!res.ok) throw new Error(`AI gateway error (${res.status}): ${(await res.text()).slice(0, 200)}`);
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content ?? "";
    return extractJson(text);
  });
