import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Guarantees that the signed-in user has a profile row with proper starting
 * balances. The DB trigger normally handles this on signup, but this hook is
 * a safety net for OAuth users, legacy accounts, or any case where the row
 * is missing.
 */
export function useEnsureProfile() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user || cancelled) return;

      const { data: existing } = await supabase
        .from("profiles")
        .select("id, balance_inr, balance_usd")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (!existing) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabase.from("profiles").insert({
          id: user.id,
          username:
            (user.user_metadata?.username as string | undefined) ??
            user.email?.split("@")[0] ??
            "trader",
          full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
          balance_inr: 1_000_000,
          balance_usd: 10_000,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
      } else if (
        Number(existing.balance_inr ?? 0) === 0 &&
        Number(existing.balance_usd ?? 0) === 0
      ) {
        // Zero-balance backfill (only when both are zero, so we don't wipe real balances).
        await supabase
          .from("profiles")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update({ balance_inr: 1_000_000, balance_usd: 10_000 } as any)
          .eq("id", user.id);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
}
