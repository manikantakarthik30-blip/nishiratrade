import { createFileRoute, Outlet, redirect, Link, useRouter, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, TrendingUp, Wallet, Trophy, Rocket, LogOut, CandlestickChart, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Starfield } from "@/components/Starfield";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useQueryClient } from "@tanstack/react-query";

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
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
] as const;

const mobileNav = nav.filter((n) => n.title !== "Leaderboard");

function AuthedLayout() {
  const router = useRouter();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", search: { mode: "login" }, replace: true });
  };

  return (
    <SidebarProvider>
      <Starfield density={80} />
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon" className="hidden border-r border-sidebar-border md:flex">
          <SidebarHeader>
            <Link to="/dashboard" className="flex items-center gap-2 px-2 py-2">
              <Rocket className="h-5 w-5 text-primary shrink-0" />
              <span className="font-display font-bold tracking-tight group-data-[collapsible=icon]:hidden">
                NISHIRA<span className="text-primary">.TRADE</span>
              </span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {nav.map((item) => {
                    const active = pathname === item.url || pathname.startsWith(item.url + "/");
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                          <Link to={item.url}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={signOut} tooltip="Sign out">
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border/40 bg-background/60 px-4 backdrop-blur-md">
            <SidebarTrigger className="hidden md:inline-flex" />
            <Link to="/dashboard" className="flex items-center gap-2 md:hidden">
              <Rocket className="h-4 w-4 text-primary" />
              <span className="font-display text-sm font-bold">NISHIRA<span className="text-primary">.TRADE</span></span>
            </Link>
            <span className="ml-auto text-xs text-muted-foreground hidden md:inline">Practice the market. Risk nothing.</span>
            <button onClick={signOut} className="text-xs text-muted-foreground hover:text-foreground md:hidden">
              <LogOut className="h-4 w-4" />
            </button>
          </header>
          <main className="flex-1 p-4 pb-24 md:p-8 md:pb-8">
            <Outlet />
          </main>

          {/* Mobile bottom nav */}
          <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-border/60 bg-background/95 backdrop-blur-md md:hidden">
            {mobileNav.map((item) => {
              const active = pathname === item.url || pathname.startsWith(item.url + "/");
              return (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </SidebarProvider>
  );
}

