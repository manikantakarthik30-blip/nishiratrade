import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Rocket, ShieldCheck, LineChart, GraduationCap, Menu, X, PlayCircle, LayoutDashboard } from "lucide-react";
import { SpaceCanvas } from "@/components/SpaceCanvas";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/")({
  component: Landing,
});


const features = [
  {
    icon: LineChart,
    title: "Real Charts",
    desc: "Live TradingView charts for NSE, BSE, NYSE and NASDAQ stocks.",
  },
  {
    icon: ShieldCheck,
    title: "Zero Risk",
    desc: "Start with ₹10,00,000 virtual money. Make mistakes. Learn. Repeat.",
  },
  {
    icon: GraduationCap,
    title: "Learn & Trade",
    desc: "Curated video tutorials from basics to advanced F&O strategies.",
  },
];

const stats = [
  { value: "10,000+", label: "Traders" },
  { value: "₹50 Cr+", label: "Practiced" },
  { value: "200+", label: "Stocks" },
  { value: "100%", label: "Free" },
];

function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: user } = useQuery({
    queryKey: ["landing-auth-user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
    staleTime: 30_000,
  });
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "trader";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const initials = displayName.slice(0, 2).toUpperCase();

  const scrollToLearn = () => {

    document.getElementById("learn")?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <SpaceCanvas />
      <div className="pointer-events-none fixed inset-0 z-[1] bg-black/30" aria-hidden />


      {/* Navbar */}
      <header className="relative z-20 px-4 py-4 md:px-12 md:py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Rocket className="h-6 w-6 text-primary" />
            <span className="font-display text-lg font-bold tracking-tight md:text-xl">
              NISHIRA<span className="text-primary">.TRADE</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition">Home</Link>
            <a href="#features" className="hover:text-foreground transition">Markets</a>
            <a href="#learn" className="hover:text-foreground transition">Learn</a>
            <Link to="/docs" className="hover:text-foreground transition">Docs</Link>
          </nav>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            {user ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-full border border-border/60 bg-background/40 px-2 py-1 pr-3 text-sm hover:border-primary/60"
              >
                <Avatar className="h-7 w-7">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                  <AvatarFallback className="bg-primary/20 text-[10px] font-bold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-[120px] truncate">{displayName}</span>
              </Link>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/auth" search={{ mode: "login" }}>Login</Link>
                </Button>
                <Button asChild size="sm" className="animate-pulse-glow">
                  <Link to="/auth" search={{ mode: "signup" }}>Sign Up</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile: avatar (if logged in) + hamburger */}
          {user && (
            <Link
              to="/dashboard"
              aria-label="Open dashboard"
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/50"
            >
              <Avatar className="h-8 w-8">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                <AvatarFallback className="bg-primary/20 text-[10px] font-bold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Link>
          )}


          {/* Mobile hamburger */}
          <button
            aria-label="Toggle menu"
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-border/50 text-foreground"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden mt-3 rounded-xl border border-border/50 bg-background/90 p-3 backdrop-blur-md">
            <nav className="flex flex-col">
              <Link to="/" onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-muted">Home</Link>
              <a href="#features" onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-muted">Markets</a>
              <button onClick={scrollToLearn} className="rounded-md px-3 py-2 text-left text-sm hover:bg-muted">Learn</button>
              <Link to="/auth" search={{ mode: "login" }} onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-muted">Login</Link>
              <Link to="/auth" search={{ mode: "signup" }} onClick={() => setMenuOpen(false)} className="mt-1 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground text-center font-medium">Sign Up</Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-4 pt-10 pb-16 text-center md:px-6 md:pt-20 md:pb-24">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-7xl"
        >
          Trade Smart. <span className="glow-text text-primary">Start Safe.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-6 max-w-2xl text-base text-muted-foreground md:text-xl"
        >
          Practice with real market data and virtual money. Build your skills before risking a single rupee.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-center"
        >
          <Button asChild size="lg" className="animate-pulse-glow px-8 py-6 text-base font-semibold w-full sm:w-auto">
            <Link to="/auth" search={{ mode: "signup" }}>Start Trading Free →</Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={scrollToLearn}
            className="px-8 py-6 text-base font-semibold w-full sm:w-auto"
          >
            <PlayCircle className="mr-2 h-5 w-5" />
            Watch How It Works
          </Button>
        </motion.div>

        {/* Stats bar */}
        <div className="mt-16 grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="glass rounded-xl p-4 text-center">
              <div className="font-display text-xl font-bold text-primary md:text-2xl">{s.value}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div id="features" className="mt-20 grid w-full gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="glass group relative overflow-hidden rounded-2xl p-6 text-left transition-shadow hover:shadow-[var(--shadow-glow)]"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary transition-transform group-hover:scale-110">
                <f.icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold">{f.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Learn section anchor */}
        <div id="learn" className="mt-24 w-full">
          <div className="glass rounded-2xl p-8 text-center">
            <h2 className="font-display text-2xl font-bold md:text-3xl">Learn as you trade</h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              From candlestick basics to advanced F&O strategies — curated tutorials help you level up while you practice.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link to="/auth" search={{ mode: "signup" }}>Get Started Free</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/40 px-4 py-10 md:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 md:flex-row md:items-start md:justify-between">
          <div className="text-center md:text-left">
            <Link to="/" className="inline-flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              <span className="font-display font-bold tracking-tight">
                NISHIRA<span className="text-primary">.TRADE</span>
              </span>
            </Link>
            <p className="mt-2 text-xs text-muted-foreground">Practice the market. Risk nothing. Learn everything.</p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <Link to="/markets" className="hover:text-foreground">Markets</Link>
            <Link to="/chart" className="hover:text-foreground">Chart</Link>
            <a href="#learn" className="hover:text-foreground">Learn</a>
            <Link to="/auth" search={{ mode: "login" }} className="hover:text-foreground">Login</Link>
          </nav>
        </div>

        <div className="mx-auto mt-8 max-w-7xl border-t border-border/40 pt-6 text-center text-xs text-muted-foreground">
          <p>Built for Indian traders learning the market.</p>
          <p className="mt-1">© 2025 NISHIRA.TRADE</p>
        </div>
      </footer>
    </div>
  );
}
