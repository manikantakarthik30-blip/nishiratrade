import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { User, Mail, Phone, Globe, Clock, Calendar, CheckCircle2, XCircle, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const qc = useQueryClient();
  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      return (await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle()).data;
    },
  });

  const [form, setForm] = useState({
    username: "",
    full_name: "",
    mobile: "",
    country: "",
    timezone: "",
    bio: "",
    avatar_url: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      username: (profile as any).username ?? "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      full_name: (profile as any).full_name ?? "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mobile: (profile as any).mobile ?? "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      country: (profile as any).country ?? "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      timezone: (profile as any).timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bio: (profile as any).bio ?? "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      avatar_url: (profile as any).avatar_url ?? "",
    });
  }, [profile]);

  const emailVerified = Boolean(user?.email_confirmed_at);
  const mobileVerified = Boolean(user?.phone_confirmed_at);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastLogin = (profile as any)?.last_login_at as string | null | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createdAt = (profile as any)?.created_at as string | undefined;

  const save = async () => {
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("profiles").update(form as any).eq("id", user!.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  const initials = (form.full_name || form.username || user?.email || "?").slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your public and account information</p>
        </div>
      </header>

      <section className="flex flex-col items-center gap-4 rounded-xl border border-border/50 bg-white/[0.03] p-6 sm:flex-row">
        <Avatar className="h-20 w-20 border border-border/60">
          {form.avatar_url && <AvatarImage src={form.avatar_url} alt={form.full_name || "avatar"} />}
          <AvatarFallback className="bg-primary/20 text-lg font-bold text-primary">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1 text-center sm:text-left">
          <div className="text-lg font-semibold">{form.full_name || form.username || "Trader"}</div>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:justify-start">
            <span className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" /> {user?.email}
              {emailVerified ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-yellow-400" />
              )}
            </span>
            {form.mobile && (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> {form.mobile}
                {mobileVerified ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-yellow-400" />
                )}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:justify-start">
            {createdAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Joined {new Date(createdAt).toLocaleDateString()}
              </span>
            )}
            {lastLogin && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Last login {new Date(lastLogin).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border/50 bg-white/[0.03] p-6">
        <h2 className="mb-4 text-lg font-semibold">Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="fn" label="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
          <Field id="un" label="Username" value={form.username} onChange={(v) => setForm({ ...form, username: v })} />
          <Field id="mo" label="Mobile" value={form.mobile} onChange={(v) => setForm({ ...form, mobile: v })} icon={<Phone className="h-3.5 w-3.5" />} />
          <Field id="co" label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} icon={<Globe className="h-3.5 w-3.5" />} />
          <Field id="tz" label="Timezone" value={form.timezone} onChange={(v) => setForm({ ...form, timezone: v })} icon={<Clock className="h-3.5 w-3.5" />} />
          <Field id="av" label="Avatar URL" value={form.avatar_url} onChange={(v) => setForm({ ...form, avatar_url: v })} />
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              rows={3}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Trader by day, stargazer by night."
              maxLength={280}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={save} disabled={saving}>
            <Save className="mr-2 h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </section>
    </div>
  );
}

function Field({
  id, label, value, onChange, icon,
}: { id: string; label: string; value: string; onChange: (v: string) => void; icon?: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-1.5">
        {icon}
        {label}
      </Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
