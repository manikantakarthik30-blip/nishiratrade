import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Rocket, CheckCircle2, AlertCircle } from "lucide-react";
import { Starfield } from "@/components/Starfield";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Forgot password — NISHIRA.TRADE" },
      { name: "description", content: "Reset your NISHIRA.TRADE password by email." },
      { property: "og:title", content: "Forgot password — NISHIRA.TRADE" },
      { property: "og:description", content: "Reset your NISHIRA.TRADE password by email." },
      { property: "og:url", content: "https://nishiratrade.lovable.app/forgot-password" },
    ],
    links: [{ rel: "canonical", href: "https://nishiratrade.lovable.app/forgot-password" }],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + "/reset-password",
    });
    setLoading(false);
    if (err) return setError(err.message);
    setSent(true);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <Starfield density={200} />
      <Link to="/" className="absolute left-6 top-6 z-10 flex items-center gap-2">
        <Rocket className="h-5 w-5 text-primary" />
        <span className="font-display font-bold tracking-tight">
          NISHIRA<span className="text-primary">.TRADE</span>
        </span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass relative z-10 w-full max-w-md rounded-2xl p-6 shadow-[var(--shadow-glow)] sm:p-8"
      >
        <h1 className="text-center font-display text-2xl font-bold">Reset your password</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Enter your email and we'll send you a reset link.
        </p>

        {sent ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
              <div>
                <p className="font-medium text-emerald-300">Check your email</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  We sent a reset link to <span className="text-foreground">{email}</span>. It expires in 1 hour. Don't forget to check spam.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
            >
              Send to a different email
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fp-email">Email</Label>
              <Input
                id="fp-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <Button type="submit" className="w-full animate-pulse-glow" disabled={loading}>
              {loading ? "Sending…" : "Send Reset Link"}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center text-xs">
          <Link to="/auth" search={{ mode: "login" }} className="text-muted-foreground hover:text-primary">
            ← Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
