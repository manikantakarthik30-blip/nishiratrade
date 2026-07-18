import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, PlayCircle, X, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/learn")({
  component: LearnPage,
});

type Difficulty = "Beginner" | "Intermediate" | "Advanced";
type Category =
  | "Basics"
  | "Candlesticks"
  | "Technical Indicators"
  | "Indian Market"
  | "F&O"
  | "Strategies";

interface Video {
  id: string;
  title: string;
  channel: string;
  duration: string;
  difficulty: Difficulty;
  category: Category;
}

const VIDEOS: Video[] = [
  { id: "p7HKvqRI_Bo", title: "Stock Market for Beginners in Hindi", channel: "Pranjal Kamra", duration: "23:45", difficulty: "Beginner", category: "Basics" },
  { id: "86rjS0EpR3E", title: "How Stock Market Works", channel: "CA Rachana Ranade", duration: "18:32", difficulty: "Beginner", category: "Basics" },
  { id: "Xn7KWR9EOGQ", title: "Demat Account & Trading Account Explained", channel: "Zerodha Varsity", duration: "12:15", difficulty: "Beginner", category: "Basics" },
  { id: "wxyAJ3oYLqE", title: "Candlestick Patterns You Must Know", channel: "Trading with Vivek", duration: "31:20", difficulty: "Beginner", category: "Candlesticks" },
  { id: "Y7K8EMUhLGw", title: "Top 10 Candlestick Patterns", channel: "CA Rachana Ranade", duration: "27:44", difficulty: "Intermediate", category: "Candlesticks" },
  { id: "5Y0R1CKpBLA", title: "Doji, Hammer & Engulfing Patterns", channel: "Nitin Bhatia", duration: "22:18", difficulty: "Intermediate", category: "Candlesticks" },
  { id: "ovNVMpg6G8Y", title: "RSI Indicator Explained Simply", channel: "Trading with Vivek", duration: "19:55", difficulty: "Beginner", category: "Technical Indicators" },
  { id: "FiMcJeKRSHU", title: "MACD Indicator Strategy", channel: "Investopedia", duration: "14:30", difficulty: "Intermediate", category: "Technical Indicators" },
  { id: "g2dA5FRrEdY", title: "Moving Averages Complete Guide", channel: "CA Rachana Ranade", duration: "24:10", difficulty: "Beginner", category: "Technical Indicators" },
  { id: "IdoLqC0Ke70", title: "NSE vs BSE — What's the Difference?", channel: "Pranjal Kamra", duration: "11:22", difficulty: "Beginner", category: "Indian Market" },
  { id: "5fYzXq3EMZE", title: "How SEBI Regulates the Market", channel: "CA Rachana Ranade", duration: "16:48", difficulty: "Beginner", category: "Indian Market" },
  { id: "QnEGp4PEwFY", title: "Nifty 50 and Sensex Explained", channel: "Zerodha Varsity", duration: "13:05", difficulty: "Beginner", category: "Indian Market" },
  { id: "xGIFKVmfBpI", title: "Futures & Options for Beginners", channel: "CA Rachana Ranade", duration: "38:20", difficulty: "Intermediate", category: "F&O" },
  { id: "xSTDL3hK-aI", title: "Options Trading Basics in Hindi", channel: "Nitin Bhatia", duration: "29:15", difficulty: "Intermediate", category: "F&O" },
  { id: "5SBbicVYeN4", title: "Swing Trading Strategy for Beginners", channel: "Trading with Vivek", duration: "26:40", difficulty: "Intermediate", category: "Strategies" },
  { id: "bsWXgTmPx5Y", title: "Intraday Trading Rules to Follow", channel: "Pranjal Kamra", duration: "21:33", difficulty: "Intermediate", category: "Strategies" },
  { id: "rf4Gdm1BGOE", title: "Long Term Investing vs Trading", channel: "CA Rachana Ranade", duration: "18:50", difficulty: "Beginner", category: "Strategies" },
];

const CATEGORIES: ("All" | Category)[] = [
  "All", "Basics", "Candlesticks", "Technical Indicators", "Indian Market", "F&O", "Strategies",
];

const STORAGE_KEY = "nishira_watched";

function diffClass(d: Difficulty) {
  if (d === "Beginner") return "bg-success/20 text-success border-success/30";
  if (d === "Intermediate") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  return "bg-destructive/20 text-destructive border-destructive/30";
}

function LearnPage() {
  const [tab, setTab] = useState<"All" | Category>("All");
  const [watched, setWatched] = useState<string[]>([]);
  const [active, setActive] = useState<Video | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setWatched(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const saveWatched = (list: string[]) => {
    setWatched(list);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* ignore */ }
  };

  const markWatched = (id: string) => {
    if (watched.includes(id)) return;
    saveWatched([...watched, id]);
  };

  const filtered = useMemo(
    () => (tab === "All" ? VIDEOS : VIDEOS.filter((v) => v.category === tab)),
    [tab],
  );

  const watchedCount = watched.filter((id) => VIDEOS.some((v) => v.id === id)).length;
  const pct = Math.round((watchedCount / VIDEOS.length) * 100);

  return (
    <div className="mx-auto max-w-7xl space-y-4 md:space-y-6">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary md:h-12 md:w-12">
          <GraduationCap className="h-5 w-5 md:h-6 md:w-6" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold md:text-3xl">Trading Academy</h1>
          <p className="text-xs text-muted-foreground md:text-sm">Learn trading from basics to advanced — all in one place</p>
        </div>
      </div>

      <Card className="glass p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="tabular-nums font-semibold">{watchedCount} of {VIDEOS.length} videos watched</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted/40">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", damping: 24, stiffness: 120 }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          />
        </div>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "All" | Category)} className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
        <TabsList className="w-max">
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c} value={c}>{c}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((v) => {
          const isWatched = watched.includes(v.id);
          return (
            <motion.div key={v.id} layout whileHover={{ y: -4 }}>
              <Card className="glass overflow-hidden">
                <div className="relative aspect-video bg-muted/30">
                  <img
                    src={`https://img.youtube.com/vi/${v.id}/hqdefault.jpg`}
                    alt={v.title}
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    className="h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 grid place-items-center bg-background/40 opacity-0 transition-opacity hover:opacity-100">
                    <PlayCircle className="h-14 w-14 text-primary drop-shadow-[0_0_16px_rgba(0,212,255,0.5)]" />
                  </div>
                  <span className="absolute right-2 top-2 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur">
                    {v.duration}
                  </span>
                  {isWatched && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-success/90 px-2 py-0.5 text-[10px] font-semibold text-success-foreground">
                      <CheckCircle2 className="h-3 w-3" /> Watched
                    </span>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${diffClass(v.difficulty)}`}>
                      {v.difficulty}
                    </span>
                    <span className="rounded border border-border/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {v.category}
                    </span>
                  </div>
                  <div className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold">{v.title}</div>
                  <div className="text-xs text-muted-foreground">{v.channel}</div>
                  <Button onClick={() => setActive(v)} size="sm" className="w-full">
                    <PlayCircle className="mr-1 h-4 w-4" /> Watch
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-3xl p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>{active?.title ?? "Video"}</DialogTitle>
          </DialogHeader>
          {active && (
            <div>
              <div className="relative aspect-video w-full bg-black">
                <iframe
                  key={active.id}
                  src={`https://www.youtube.com/embed/${active.id}?autoplay=1&rel=0`}
                  title={active.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
                <button
                  onClick={() => setActive(null)}
                  aria-label="Close"
                  className="absolute right-2 top-2 rounded-full bg-background/70 p-1.5 backdrop-blur hover:bg-background"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <div className="text-lg font-bold">{active.title}</div>
                  <div className="text-sm text-muted-foreground">{active.channel} • {active.duration} • {active.category}</div>
                </div>
                <Button
                  onClick={() => { markWatched(active.id); }}
                  disabled={watched.includes(active.id)}
                  className="w-full"
                  variant={watched.includes(active.id) ? "outline" : "default"}
                >
                  {watched.includes(active.id) ? (
                    <><CheckCircle2 className="mr-1 h-4 w-4" /> Watched</>
                  ) : (
                    "Mark as Watched"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
