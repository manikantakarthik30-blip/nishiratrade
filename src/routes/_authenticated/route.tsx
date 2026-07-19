import { createFileRoute, Outlet, redirect, Link, useRouter, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, TrendingUp, Wallet, Trophy, Rocket, LogOut,
  CandlestickChart, GraduationCap, User, Settings, BookOpen, Shield,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Starfield } from "@/components/Starfield";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatMoney } from "@/lib/stocks";
import { useEnsureProfile } from "@/hooks/useEnsureProfile";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { mode: "login" } });
    return { user: data.user };
  },
  component: AuthedLayout,
});

const nav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Markets", url: "/markets", icon: TrendingUp },
  { title: "Chart", url: "/chart", icon: CandlestickChart },
  { title: "Portfolio", url: "/portfolio", icon: Wallet },
  { title: "Learn", url: "/learn", icon: GraduationCap },
  { title: "Docs", url: "/docs", icon: BookOpen },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
] as const;

const mobileNav = nav.filter((n) => n.title !== "Leaderboard" && n.title !== "Learn");

function AuthedLayout() {
  const router = useRouter();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isTradePage = pathname.startsWith("/trade/");
  useEnsureProfile();
  const { showWarning, dismiss } = useSessionTimeout(30);

  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
    staleTime: 60_000,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      return (await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle()).data;
    },
    staleTime: 0,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", search: { mode: "login" }, replace: true });
  };

  const displayName: string =
    (profile?.username as string | undefined) ||
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "trader";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const initials = displayName.slice(0, 2).toUpperCase();
  const inrBalance = Number(profile?.balance_inr ?? 0);
  const usdBalance = Number(profile?.balance_usd ?? 0);


  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden">
      <Starfield density={80} />

      {showWarning && (
        <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
          <span>You've been inactive for 30 minutes. Still there?</span>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={dismiss}>
            Yes, I'm here
          </Button>
        </div>
      )}


      {/* Top header */}
      <header
        className="sticky top-0 z-40 flex h-[60px] items-center gap-3 border-b px-4 md:px-6"
        style={{ background: "#0a0a1a", borderBottomColor: "#1a1a2e" }}
      >
        <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
          <Rocket className="h-5 w-5 text-primary" />
          <span className="font-display text-sm font-bold tracking-tight md:text-base">
            NISHIRA<span className="text-primary">.TRADE</span>
          </span>
        </Link>

        {/* Center nav — desktop only */}
        <nav className="mx-auto hidden items-center gap-8 md:flex">
          {nav.map((item) => {
            const active = pathname === item.url || pathname.startsWith(item.url + "/");
            return (
              <Link
                key={item.title}
                to={item.url}
                className={`relative py-[19px] text-sm transition-colors ${
                  active
                    ? "text-primary"
                    : "text-[#a0a0b0] hover:text-white"
                }`}
              >
                {item.title}
                {active && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: balance + avatar */}
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden rounded-md border border-border/40 bg-muted/30 px-3 py-1.5 text-sm font-semibold text-success tabular-nums sm:block">
            {formatMoney(inrBalance, "INR")}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full outline-none ring-primary/50 focus-visible:ring-2">
              <Avatar className="h-9 w-9 border border-border/60">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                <AvatarFallback className="bg-primary/20 text-xs font-bold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="sm:hidden">
                <span className="text-success">{formatMoney(inrBalance, "INR")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/profile"><User className="mr-2 h-4 w-4" /> Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/security"><Shield className="mr-2 h-4 w-4" /> Security</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings"><Settings className="mr-2 h-4 w-4" /> Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className={`flex-1 ${isTradePage ? "" : "p-3 pb-20 md:p-8 md:pb-8"}`}>
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-center justify-around border-t md:hidden"
        style={{ background: "#0d0d1a", borderTopColor: "#1a1a2e" }}
      >
        {mobileNav.map((item) => {
          const active = pathname === item.url || pathname.startsWith(item.url + "/");
          return (
            <Link
              key={item.title}
              to={item.url}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10px] transition-colors"
              style={{ color: active ? "#00d4ff" : "#4a4a6a" }}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
