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

export const askNishiraAI = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => InputSchema.parse(raw))
  .handler(async ({ data }) => {
    // Prefer user-supplied Gemini API key (direct Google API, unlimited by user's own quota).
    // Fall back to Lovable AI gateway.
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      const contents = data.messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
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
      if (res.status === 429) throw new Error("Rate limit reached. Try again in a moment.");
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Gemini error (${res.status}): ${text.slice(0, 200)}`);
      }
      const json = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const reply = json.candidates?.[0]?.content?.parts?.map((p) => p.text).join("").trim();
      return { reply: reply || "Sorry, I couldn't process that. Please try again." };
    }

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing GEMINI_API_KEY or LOVABLE_API_KEY");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...data.messages,
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (res.status === 429) throw new Error("Rate limit reached. Try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please add credits in Settings → Plans & credits.");
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`AI gateway error (${res.status}): ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = json.choices?.[0]?.message?.content?.trim();
    return { reply: reply || "Sorry, I couldn't process that. Please try again." };
  });
