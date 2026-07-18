import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Rocket, Eye, EyeOff, Mail, Phone } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Starfield } from "@/components/Starfield";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { PasswordStrength, scorePassword } from "@/components/PasswordStrength";
import { loginWithMobile, recordLogin } from "@/lib/auth.functions";

const searchSchema = z.object({
  mode: z.enum(["login", "signup"]).catch("login"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const doMobileLogin = useServerFn(loginWithMobile);
  const doRecord = useServerFn(recordLogin);

  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [loginMode, setLoginMode] = useState<"email" | "mobile">("email");
  const [remember, setRemember] = useState(true);

  // Shared
  const [password, setPassword] = useState("");

  // Login state
  const [identifier, setIdentifier] = useState(""); // email or mobile

  // Forgot state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  // Verification pending state (shown after signup or when login blocked)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Signup state
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const afterLogin = async () => {
    try {
      await doRecord({});
    } catch {
      /* non-fatal */
    }
    toast.success("Welcome back, astronaut.");
    navigate({ to: "/dashboard" });
  };

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (loginMode === "email") {
        const { error } = await supabase.auth.signInWithPassword({
          email: identifier.trim(),
          password,
        });
        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes("confirm") || msg.includes("not confirmed") || msg.includes("verify")) {
            setPendingEmail(identifier.trim());
            toast.error("Please verify your email first. We can resend the link.");
            return;
          }
          throw error;
        }
      } else {
        const tokens = await doMobileLogin({
          data: { mobile: identifier.trim(), password },
        });
        const { error } = await supabase.auth.setSession(tokens);
        if (error) throw error;
      }
      if (!remember) {
        window.addEventListener(
          "beforeunload",
          () => {
            void supabase.auth.signOut();
          },
          { once: true },
        );
      }
      await afterLogin();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPw) return toast.error("Passwords do not match");
    if (scorePassword(password).score < 2) return toast.error("Choose a stronger password");
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail.trim(),
        password,
        options: {
          emailRedirectTo: window.location.origin + "/dashboard",
          data: {
            username: (username || signupEmail.split("@")[0]).trim(),
            full_name: fullName.trim() || null,
            mobile: mobile.replace(/[^\d+]/g, "") || null,
          },
        },
      });
      if (error) throw error;
      if (data.session) {
        try {
          await doRecord({});
        } catch {
          /* non-fatal */
        }
        toast.success("Account created. Launching…");
        navigate({ to: "/dashboard" });
      } else {
        setPendingEmail(signupEmail.trim());
        toast.success("Verification email sent. Check your inbox.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const onResendVerification = async () => {
    if (!pendingEmail || resendCooldown > 0) return;
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: pendingEmail,
      options: { emailRedirectTo: window.location.origin + "/dashboard" },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Verification email resent.");
    setResendCooldown(45);
    const iv = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(iv);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };



  const onGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      return toast.error(result.error.message);
    }
    if (result.redirected) return;
    await afterLogin();
  };

  const onForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: window.location.origin + "/reset-password",
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password reset link sent. Check your inbox.");
    setForgotOpen(false);
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
        <h1 className="text-center font-display text-2xl font-bold">
          {pendingEmail
            ? "Verify your email"
            : forgotOpen
              ? "Reset your password"
              : mode === "signup"
                ? "Create your account"
                : "Welcome back"}
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {pendingEmail
            ? `We sent a verification link to ${pendingEmail}. Click it to activate your account, then sign in.`
            : forgotOpen
              ? "We'll email you a secure reset link."
              : mode === "signup"
                ? "Practice the market. Risk nothing. Learn everything."
                : "Welcome back to NISHIRA.TRADE."}
        </p>

        {pendingEmail ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
              Didn't get the email? Check your spam folder. Links can take a minute to arrive.
              Some providers block unverified senders — if nothing comes through, try a different email.
            </div>
            <Button
              type="button"
              className="w-full"
              onClick={onResendVerification}
              disabled={loading || resendCooldown > 0}
            >
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : loading
                  ? "Sending…"
                  : "Resend verification email"}
            </Button>
            <button
              type="button"
              onClick={() => setPendingEmail(null)}
              className="w-full text-center text-xs text-muted-foreground hover:text-primary"
            >
              ← Back to sign in
            </button>
          </div>
        ) : forgotOpen ? (
          <form onSubmit={onForgot} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fpw-email">Email</Label>
              <Input
                id="fpw-email"
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              If you don't see it within a minute, check spam. The link expires in 1 hour.
            </p>
            <button
              type="button"
              onClick={() => setForgotOpen(false)}
              className="w-full text-center text-xs text-muted-foreground hover:text-primary"
            >
              ← Back to sign in
            </button>
          </form>
        ) : (
          <Tabs
            value={mode}
            onValueChange={(v) => navigate({ to: "/auth", search: { mode: v as "login" | "signup" } })}
            className="mt-6"
          >
            <Button
              type="button"
              variant="outline"
              className="mb-4 w-full"
              onClick={onGoogle}
              disabled={loading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <div className="mb-3 flex rounded-md border border-border/50 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setLoginMode("email")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded py-1.5 transition ${
                    loginMode === "email" ? "bg-primary/15 text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Mail className="h-3.5 w-3.5" /> Email
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMode("mobile")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded py-1.5 transition ${
                    loginMode === "mobile" ? "bg-primary/15 text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Phone className="h-3.5 w-3.5" /> Mobile
                </button>
              </div>

              <form onSubmit={onLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ident">{loginMode === "email" ? "Email" : "Mobile"}</Label>
                  <Input
                    id="ident"
                    type={loginMode === "email" ? "email" : "tel"}
                    required
                    autoComplete={loginMode === "email" ? "email" : "tel"}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={loginMode === "email" ? "you@example.com" : "+91 98765 43210"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw-l">Password</Label>
                  <div className="relative">
                    <Input
                      id="pw-l"
                      type={showPw ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-primary"
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-3.5 w-3.5 accent-primary"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(loginMode === "email" ? identifier : "");
                      setForgotOpen(true);
                    }}
                    className="text-muted-foreground hover:text-primary"
                  >
                    Forgot password?
                  </button>
                </div>
                <Button type="submit" className="w-full animate-pulse-glow" disabled={loading}>
                  {loading ? "Signing in…" : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={onSignup} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fn-s">Full name</Label>
                    <Input
                      id="fn-s"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ada Lovelace"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-s">Username</Label>
                    <Input
                      id="user-s"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="stardust"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-s">Email</Label>
                  <Input
                    id="email-s"
                    type="email"
                    required
                    autoComplete="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mob-s">Mobile</Label>
                  <Input
                    id="mob-s"
                    type="tel"
                    autoComplete="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw-s">Password</Label>
                  <div className="relative">
                    <Input
                      id="pw-s"
                      type={showPw ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-primary"
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <PasswordStrength pw={password} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpw-s">Confirm password</Label>
                  <Input
                    id="cpw-s"
                    type={showPw ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                  />
                  {confirmPw && confirmPw !== password && (
                    <div className="text-[10px] text-red-400">Passwords do not match</div>
                  )}
                </div>
                <Button type="submit" className="w-full animate-pulse-glow" disabled={loading}>
                  {loading ? "Creating…" : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </motion.div>
    </div>
  );
}
