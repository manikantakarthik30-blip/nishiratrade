import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Rocket, Eye, EyeOff } from "lucide-react";
import { Starfield } from "@/components/Starfield";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { PasswordStrength, scorePassword } from "@/components/PasswordStrength";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [cpw, setCpw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // Supabase parses the recovery link into a session automatically when the
  // helper detects the URL hash. Just wait for a session to appear.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw !== cpw) return toast.error("Passwords do not match");
    if (scorePassword(pw).score < 2) return toast.error("Choose a stronger password");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated. Please sign in.");
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { mode: "login" } });
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
        className="glass relative z-10 w-full max-w-md rounded-2xl p-8 shadow-[var(--shadow-glow)]"
      >
        <h1 className="text-center font-display text-2xl font-bold">Set a new password</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {ready ? "Choose a strong password you haven't used before." : "Verifying reset link…"}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rp-pw">New password</Label>
            <div className="relative">
              <Input
                id="rp-pw"
                type={showPw ? "text" : "password"}
                required
                minLength={8}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                disabled={!ready}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-primary"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <PasswordStrength pw={pw} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rp-cpw">Confirm password</Label>
            <Input
              id="rp-cpw"
              type={showPw ? "text" : "password"}
              required
              value={cpw}
              onChange={(e) => setCpw(e.target.value)}
              disabled={!ready}
            />
          </div>
          <Button type="submit" className="w-full" disabled={!ready || loading}>
            {loading ? "Updating…" : "Update password"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
