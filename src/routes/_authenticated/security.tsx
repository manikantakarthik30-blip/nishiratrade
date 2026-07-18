import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Shield, KeyRound, ShieldCheck, LogOut, Trash2, History, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrength, scorePassword } from "@/components/PasswordStrength";
import { deleteAccount } from "@/lib/auth.functions";

export const Route = createFileRoute("/_authenticated/security")({
  component: SecurityPage,
});

function SecurityPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const doDelete = useServerFn(deleteAccount);

  // ---- Change password ----
  const [pw, setPw] = useState("");
  const [cpw, setCpw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);

  const changePw = async () => {
    if (pw !== cpw) return toast.error("Passwords don't match");
    if (scorePassword(pw).score < 2) return toast.error("Choose a stronger password");
    setPwBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setPwBusy(false);
    if (error) return toast.error(error.message);
    setPw(""); setCpw("");
    toast.success("Password updated");
  };

  // ---- Login activity ----
  const { data: activity = [] } = useQuery({
    queryKey: ["login-activity"],
    queryFn: async () =>
      (await supabase
        .from("login_activity")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20)).data ?? [],
  });

  // ---- MFA (TOTP) ----
  const { data: factors, refetch: refetchFactors } = useQuery({
    queryKey: ["mfa-factors"],
    queryFn: async () => (await supabase.auth.mfa.listFactors()).data,
  });
  const totp = factors?.totp?.[0];
  const [enrolling, setEnrolling] = useState<null | { factorId: string; qr: string; secret: string }>(null);
  const [otp, setOtp] = useState("");

  const startEnroll = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    if (error) return toast.error(error.message);
    setEnrolling({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  };
  const verifyEnroll = async () => {
    if (!enrolling) return;
    const { data: chal, error: cErr } = await supabase.auth.mfa.challenge({ factorId: enrolling.factorId });
    if (cErr || !chal) return toast.error(cErr?.message ?? "Challenge failed");
    const { error } = await supabase.auth.mfa.verify({
      factorId: enrolling.factorId,
      challengeId: chal.id,
      code: otp.trim(),
    });
    if (error) return toast.error(error.message);
    toast.success("Two-factor authentication enabled");
    setEnrolling(null); setOtp("");
    refetchFactors();
  };
  const disableMfa = async () => {
    if (!totp) return;
    if (!confirm("Disable two-factor authentication?")) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId: totp.id });
    if (error) return toast.error(error.message);
    toast.success("2FA disabled");
    refetchFactors();
  };

  // ---- Sign out others ----
  const signOutOthers = async () => {
    const { error } = await supabase.auth.signOut({ scope: "others" });
    if (error) return toast.error(error.message);
    toast.success("Signed out on other devices");
  };

  // ---- Delete account ----
  const [confirmText, setConfirmText] = useState("");
  const [delBusy, setDelBusy] = useState(false);
  const remove = async () => {
    if (confirmText !== "DELETE") return toast.error('Type "DELETE" to confirm');
    setDelBusy(true);
    try {
      await doDelete({});
      await supabase.auth.signOut();
      qc.clear();
      toast.success("Account deleted");
      navigate({ to: "/", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDelBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Security</h1>
          <p className="text-sm text-muted-foreground">Protect your account with strong credentials and 2FA</p>
        </div>
      </header>

      {/* Change password */}
      <Section icon={<KeyRound className="h-4 w-4 text-primary" />} title="Change password">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="npw">New password</Label>
            <div className="relative">
              <Input id="npw" type={showPw ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-primary">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <PasswordStrength pw={pw} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cpw">Confirm password</Label>
            <Input id="cpw" type={showPw ? "text" : "password"} value={cpw} onChange={(e) => setCpw(e.target.value)} />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={changePw} disabled={pwBusy || !pw}>
            {pwBusy ? "Updating…" : "Update password"}
          </Button>
        </div>
      </Section>

      {/* MFA */}
      <Section icon={<ShieldCheck className="h-4 w-4 text-primary" />} title="Two-factor authentication (TOTP)">
        {totp?.status === "verified" ? (
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="font-semibold text-emerald-400">Enabled</div>
              <div className="text-xs text-muted-foreground">Authenticator app codes required at sign-in</div>
            </div>
            <Button variant="outline" onClick={disableMfa}>Disable 2FA</Button>
          </div>
        ) : enrolling ? (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Scan the QR code below with Google Authenticator, 1Password, or Authy, then enter the 6-digit code to confirm.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <img src={enrolling.qr} alt="TOTP QR" className="h-40 w-40 rounded-md border border-border/60 bg-white p-2" />
              <div className="flex-1 space-y-2">
                <div className="text-xs text-muted-foreground">Or enter this secret manually:</div>
                <code className="block break-all rounded bg-black/40 p-2 text-xs">{enrolling.secret}</code>
                <Label htmlFor="otp">Verification code</Label>
                <Input id="otp" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} />
                <div className="flex gap-2">
                  <Button onClick={verifyEnroll} disabled={otp.length !== 6}>Verify & enable</Button>
                  <Button variant="outline" onClick={() => { setEnrolling(null); setOtp(""); }}>Cancel</Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="font-semibold">Not enabled</div>
              <div className="text-xs text-muted-foreground">Add an extra layer of protection using an authenticator app</div>
            </div>
            <Button onClick={startEnroll}>Enable 2FA</Button>
          </div>
        )}
      </Section>

      {/* Sessions / trusted devices */}
      <Section icon={<LogOut className="h-4 w-4 text-primary" />} title="Sessions">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Sign yourself out everywhere except this device. Useful if you left yourself signed in on a public computer.
          </p>
          <Button variant="outline" onClick={signOutOthers}>Sign out other devices</Button>
        </div>
      </Section>

      {/* Login activity */}
      <Section icon={<History className="h-4 w-4 text-primary" />} title="Recent login activity">
        {activity.length === 0 ? (
          <p className="text-xs text-muted-foreground">No login activity recorded yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border/50">
            <table className="w-full text-xs">
              <thead className="bg-white/[0.04] text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">When</th>
                  <th className="px-3 py-2 text-left font-medium">IP</th>
                  <th className="px-3 py-2 text-left font-medium">Device</th>
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(activity as any[]).map((row) => (
                  <tr key={row.id} className="border-t border-border/40">
                    <td className="px-3 py-2 tabular-nums">{new Date(row.created_at).toLocaleString()}</td>
                    <td className="px-3 py-2 tabular-nums">{row.ip ?? "—"}</td>
                    <td className="max-w-[300px] truncate px-3 py-2 text-muted-foreground">{row.user_agent ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Danger zone */}
      <Section icon={<Trash2 className="h-4 w-4 text-red-400" />} title="Delete account" tone="danger">
        <p className="text-xs text-muted-foreground">
          This permanently deletes your NISHIRA.TRADE account, all holdings, trade history, and profile data. This cannot be undone.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder='Type "DELETE" to confirm'
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="sm:max-w-xs"
          />
          <Button
            variant="destructive"
            disabled={confirmText !== "DELETE" || delBusy}
            onClick={remove}
          >
            {delBusy ? "Deleting…" : "Delete my account"}
          </Button>
        </div>
      </Section>
    </div>
  );
}

// Placeholder for typed row access (kept so ESLint recognizes usage above).
useEffect;

function Section({
  icon, title, tone, children,
}: { icon: React.ReactNode; title: string; tone?: "danger"; children: React.ReactNode }) {
  return (
    <section
      className={`rounded-xl border p-4 md:p-6 ${
        tone === "danger" ? "border-red-500/30 bg-red-500/5" : "border-border/50 bg-white/[0.03]"
      }`}
    >
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}
