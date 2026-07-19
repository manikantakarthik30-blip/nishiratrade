import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SYSTEM_PROMPT = `You are NISHIRA.AI, a trading education assistant for NISHIRA.TRADE — a paper trading platform.

Your role:
- Teach users about trading concepts, technical analysis, chart patterns, indicators
- Explain how markets work, trading terminology, strategies
- Help users understand their portfolio (if context is provided)
- Be friendly, clear, and educational

STRICT RULES — Never violate these:
1. NEVER recommend buying or selling any specific stock, cryptocurrency, or asset
2. NEVER give price targets or predictions
3. NEVER say "you should buy X" or "sell Y now"
4. If asked for stock tips: say "I can only provide education, not investment advice. Please consult a SEBI-registered advisor."
5. Keep responses concise (max 200 words unless explaining a complex concept)
6. Use simple language — users are beginners to intermediate traders
7. Use bullet points and emojis to make responses engaging
8. Always relate answers to the user's learning journey

You know about: NSE, BSE, Nifty, Sensex, Indian markets, US markets, candlesticks, technical indicators, F&O basics, trading psychology.`;

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});
const InputSchema = z.object({
  messages: z.array(MessageSchema).max(40),
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callGemini(model: string, key: string, messages: z.infer<typeof MessageSchema>[]) {
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
      }),
    },
  );
  if (res.status === 429 || res.status === 503) throw new Error(`RETRY_${res.status}`);
  if (!res.ok) throw new Error(`Gemini ${model} (${res.status}): ${(await res.text()).slice(0, 160)}`);
  const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return json.candidates?.[0]?.content?.parts?.map((p) => p.text).join("").trim() ?? "";
}

async function callLovable(model: string, key: string, messages: z.infer<typeof MessageSchema>[]) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });
  if (res.status === 429 || res.status === 503) throw new Error(`RETRY_${res.status}`);
  if (res.status === 402) throw new Error("AI credits exhausted. Please add credits in Settings → Plans & credits.");
  if (!res.ok) throw new Error(`Lovable ${model} (${res.status}): ${(await res.text()).slice(0, 160)}`);
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content?.trim() ?? "";
}

export const askNishiraAI = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => InputSchema.parse(raw))
  .handler(async ({ data }) => {
    const geminiKey = process.env.GEMINI_API_KEY;
    const lovableKey = process.env.LOVABLE_API_KEY;

    type Provider = { name: string; run: () => Promise<string> };
    const chain: Provider[] = [];
    if (geminiKey) {
      chain.push({ name: "gemini-2.0-flash", run: () => callGemini("gemini-2.0-flash", geminiKey, data.messages) });
      chain.push({ name: "gemini-1.5-flash", run: () => callGemini("gemini-1.5-flash", geminiKey, data.messages) });
    }
    if (lovableKey) {
      chain.push({ name: "lovable:gemini-2.5-flash", run: () => callLovable("google/gemini-2.5-flash", lovableKey, data.messages) });
      chain.push({ name: "lovable:gemini-2.5-flash-lite", run: () => callLovable("google/gemini-2.5-flash-lite", lovableKey, data.messages) });
    }
    if (chain.length === 0) throw new Error("Missing GEMINI_API_KEY or LOVABLE_API_KEY");

    let lastErr: Error | null = null;
    for (const provider of chain) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const reply = await provider.run();
          return { reply: reply || "Sorry, I couldn't process that. Please try again." };
        } catch (err) {
          lastErr = err as Error;
          console.warn(`[nishira-ai] ${provider.name} attempt ${attempt + 1}: ${lastErr.message}`);
          if (!lastErr.message.startsWith("RETRY_")) break;
          if (attempt === 0) await sleep(700 + Math.random() * 500);
        }
      }
    }
    throw new Error(`AI is busy right now — please try again in a moment. (${lastErr?.message ?? "unknown"})`);
  });
