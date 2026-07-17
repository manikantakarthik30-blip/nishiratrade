import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const placeOrderSchema = z.object({
  ticker: z.string().min(1).max(16),
  market: z.enum(["IN", "US"]),
  side: z.enum(["BUY", "SELL"]),
  qty: z.number().positive().max(1_000_000),
  price: z.number().positive().max(10_000_000),
});

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => placeOrderSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { ticker, market, side, qty, price } = data;
    const cost = qty * price;
    const balanceCol = market === "IN" ? "balance_inr" : "balance_usd";

    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select(`id, ${balanceCol}`)
      .eq("id", userId)
      .maybeSingle();
    if (pErr || !profile) throw new Error("Profile not found");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const balance = Number((profile as any)[balanceCol]);

    const { data: existing } = await supabase
      .from("holdings")
      .select("id, qty, avg_price")
      .eq("user_id", userId)
      .eq("ticker", ticker)
      .maybeSingle();

    if (side === "BUY") {
      if (balance < cost) throw new Error("Insufficient balance");
      const newQty = Number(existing?.qty ?? 0) + qty;
      const newAvg = existing
        ? (Number(existing.qty) * Number(existing.avg_price) + cost) / newQty
        : price;
      if (existing) {
        await supabase
          .from("holdings")
          .update({ qty: newQty, avg_price: newAvg, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("holdings")
          .insert({ user_id: userId, ticker, market, qty: newQty, avg_price: newAvg });
      }
      await supabase
        .from("profiles")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ [balanceCol]: balance - cost } as any)
        .eq("id", userId);
    } else {
      const heldQty = Number(existing?.qty ?? 0);
      if (heldQty < qty) throw new Error("Not enough shares to sell");
      const newQty = heldQty - qty;
      if (newQty <= 0) {
        await supabase.from("holdings").delete().eq("id", existing!.id);
      } else {
        await supabase
          .from("holdings")
          .update({ qty: newQty, updated_at: new Date().toISOString() })
          .eq("id", existing!.id);
      }
      await supabase
        .from("profiles")
        .update({ [balanceCol]: balance + cost })
        .eq("id", userId);
    }

    await supabase
      .from("trades")
      .insert({ user_id: userId, ticker, market, side, qty, price });

    return { ok: true as const };
  });
