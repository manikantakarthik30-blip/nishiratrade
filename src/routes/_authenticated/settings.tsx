import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Palette, RefreshCw, Check, AlertTriangle, Settings as SettingsIcon } from "lucide-react";
import { THEMES, applyTheme, getStoredThemeId, type ThemeId } from "@/lib/themes";
import { resetBalance } from "@/lib/trade.functions";
import { formatMoney } from "@/lib/stocks";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [themeId, setThemeId] = useState<ThemeId>("cosmic");
  const [wipe, setWipe] = useState(false);
  const [busy, setBusy] = useState<null | "INR" | "USD" | "BOTH">(null);
  const reset = useServerFn(resetBalance);
  const qc = useQueryClient();

  useEffect(() => {
    setThemeId(getStoredThemeId());
  }, []);

  const pick = (id: ThemeId) => {
    setThemeId(id);
    applyTheme(id);
    toast.success(`Theme applied: ${THEMES.find((t) => t.id === id)?.name}`);
  };

  const doReset = async (scope: "INR" | "USD" | "BOTH") => {
    const label = scope === "BOTH" ? "both balances" : `${scope} balance`;
    const wipeMsg = wipe ? " and wipe all holdings + trade history" : "";
    if (!confirm(`Reset ${label}${wipeMsg}? This cannot be undone.`)) return;
    setBusy(scope);
    try {
      await reset({ data: { scope, wipeHoldings: wipe } });
      await qc.invalidateQueries();
      toast.success(
        `Reset complete: ${scope === "USD" ? formatMoney(10000, "USD") : scope === "INR" ? formatMoney(1_000_000, "INR") : "₹10,00,000 + $10,000"}`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
          <SettingsIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Settings</h1>
          <p className="text-sm text-muted-foreground">Customize your NISHIRA experience</p>
        </div>
      </div>

      {/* Theme */}
      <section className="mb-8 rounded-xl border border-border/50 bg-white/[0.03] p-4 md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">Theme</h2>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Pick your palette — applies instantly and remembers your choice.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {THEMES.map((t) => {
            const active = themeId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => pick(t.id)}
                className={`relative flex flex-col gap-3 rounded-xl border p-4 text-left transition ${
                  active
                    ? "border-primary bg-primary/10 shadow-[0_0_0_1px_var(--primary)]"
                    : "border-border/50 bg-white/[0.02] hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{t.name}</span>
                  {active && (
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  {t.swatch.map((c, i) => (
                    <span
                      key={i}
                      className="h-8 flex-1 rounded-md border border-white/10"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">{t.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Money refresh */}
      <section className="rounded-xl border border-border/50 bg-white/[0.03] p-4 md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">Reset Balance</h2>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Wipe the slate clean and restart with fresh virtual capital.
        </p>

        <label className="mb-4 flex cursor-pointer items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs">
          <input
            type="checkbox"
            checked={wipe}
            onChange={(e) => setWipe(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-yellow-500"
          />
          <span className="flex-1">
            <span className="flex items-center gap-1 font-semibold text-yellow-300">
              <AlertTriangle className="h-3.5 w-3.5" />
              Also wipe holdings & trade history
            </span>
            <span className="mt-1 block text-muted-foreground">
              Deletes every open position and every past order. Leaderboard entry stays.
            </span>
          </span>
        </label>

        <div className="grid gap-2 sm:grid-cols-3">
          <ResetBtn
            label="Reset INR"
            sub="→ ₹10,00,000"
            busy={busy === "INR"}
            onClick={() => doReset("INR")}
          />
          <ResetBtn
            label="Reset USD"
            sub="→ $10,000"
            busy={busy === "USD"}
            onClick={() => doReset("USD")}
          />
          <ResetBtn
            label="Reset Both"
            sub="→ Full refresh"
            busy={busy === "BOTH"}
            onClick={() => doReset("BOTH")}
            primary
          />
        </div>
      </section>
    </div>
  );
}

function ResetBtn({
  label, sub, busy, onClick, primary,
}: { label: string; sub: string; busy: boolean; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`flex flex-col items-start rounded-lg border px-4 py-3 text-left transition disabled:opacity-50 ${
        primary
          ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
          : "border-border/60 bg-white/[0.03] hover:border-primary/40"
      }`}
    >
      <span className="flex items-center gap-2 text-sm font-semibold">
        {busy && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
        {label}
      </span>
      <span className={`text-xs ${primary ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
        {sub}
      </span>
    </button>
  );
}
