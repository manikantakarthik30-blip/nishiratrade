import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Rocket, ShieldCheck, LineChart, Sparkles } from "lucide-react";
import { Starfield } from "@/components/Starfield";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

const features = [
  {
    icon: LineChart,
    title: "Real-Time Data",
    desc: "Simulated live prices for 20+ NSE, BSE, NASDAQ & NYSE tickers, updating every 3 seconds.",
  },
  {
    icon: ShieldCheck,
    title: "Zero Risk",
    desc: "Start with ₹1,00,000 and $10,000 in virtual capital. Learn the market without burning real cash.",
  },
  {
    icon: Sparkles,
    title: "Portfolio Tracker",
    desc: "Follow your holdings, P&L, and allocation with beautiful charts and a live leaderboard.",
  },
];

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Starfield density={180} />

      {/* Navbar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <Link to="/" className="flex items-center gap-2">
          <Rocket className="h-6 w-6 text-primary" />
          <span className="font-display text-xl font-bold tracking-tight">
            Cosmic<span className="text-primary">Trade</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth" search={{ mode: "login" }}>
              Login
            </Link>
          </Button>
          <Button asChild size="sm" className="animate-pulse-glow">
            <Link to="/auth" search={{ mode: "signup" }}>
              Sign Up
            </Link>
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pt-16 pb-24 text-center md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs text-primary"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Paper trading, cosmic experience
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl"
        >
          Cosmic<span className="glow-text text-primary">Trade</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl"
        >
          Practice the stock market with real data, fake money.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10"
        >
          <Button
            asChild
            size="lg"
            className="animate-pulse-glow px-8 py-6 text-base font-semibold"
          >
            <Link to="/auth" search={{ mode: "signup" }}>
              Start Trading →
            </Link>
          </Button>
        </motion.div>

        {/* Features */}
        <div className="mt-24 grid w-full gap-6 md:grid-cols-3">
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
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        Built for learning. No real money is ever traded.
      </footer>
    </div>
  );
}
