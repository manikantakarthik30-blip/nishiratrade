import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Server-only publishable client that speaks to Data API + Auth without a bearer.
function publicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/**
 * Login using mobile + password. Looks up the email tied to that mobile
 * in `profiles` (server-side, so the mapping never leaks), then performs
 * a normal password sign-in and returns the resulting session tokens.
 * The client is expected to hand these to `supabase.auth.setSession`.
 */
export const loginWithMobile = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        mobile: z.string().min(6).max(20),
        password: z.string().min(6).max(200),
      })
      .parse(raw),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    const normalized = data.mobile.replace(/[^\d+]/g, "");
    // Load service role only if available (optional — falls back to admin fetch via publishable if RLS permits)
    let email: string | null = null;
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: row } = await supabaseAdmin
        .from("profiles")
        .select("id, mobile")
        .eq("mobile", normalized)
        .maybeSingle();
      if (row) {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(row.id);
        email = authUser.user?.email ?? null;
      }
    } catch {
      // ignore — will error below
    }
    if (!email) throw new Error("No account found for that mobile number");

    const { data: signIn, error } = await sb.auth.signInWithPassword({
      email,
      password: data.password,
    });
    if (error || !signIn.session) throw new Error(error?.message ?? "Invalid credentials");
    return {
      access_token: signIn.session.access_token,
      refresh_token: signIn.session.refresh_token,
    };
  });

/** Record a successful login (IP + UA) and stamp profiles.last_login_at. */
export const recordLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const req = getRequest();
    const ip =
      req?.headers.get("cf-connecting-ip") ??
      req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      null;
    const ua = req?.headers.get("user-agent") ?? null;
    await context.supabase.from("login_activity").insert({
      user_id: context.userId,
      ip,
      user_agent: ua,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await context.supabase
      .from("profiles")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ last_login_at: new Date().toISOString() } as any)
      .eq("id", context.userId);
    return { ok: true as const };
  });

/** Permanently delete the caller's account and all owned rows. */
export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    // Wipe owned rows first (FK ON DELETE CASCADE also cleans up, but be explicit)
    await supabase.from("trades").delete().eq("user_id", userId);
    await supabase.from("holdings").delete().eq("user_id", userId);
    await supabase.from("watchlist").delete().eq("user_id", userId);
    await supabase.from("login_activity").delete().eq("user_id", userId);
    await supabase.from("profiles").delete().eq("id", userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
