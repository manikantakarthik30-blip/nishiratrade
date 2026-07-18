import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, PlayCircle, X, GraduationCap, BookOpen, ExternalLink, Copy, AlertTriangle, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/learn")({
  component: LearnPage,
});

/* ---------------- VIDEOS ---------------- */

type Lang = "EN" | "HI" | "TE";
type Difficulty = "Beginner" | "Intermediate" | "Advanced";
type Category = "All" | "Basics" | "Candlesticks" | "Indicators" | "F&O" | "Strategies" | "Indian Market";

interface Video {
  id: string;
  title: string;
  channel: string;
  lang: Lang;
  category: Exclude<Category, "All">;
  difficulty: Difficulty;
}

const VIDEOS: Video[] = [
  // English — Zerodha Varsity
  { id: "pMSRPpEv4QQ", title: "Stock Market Basics for Absolute Beginners", channel: "Zerodha Varsity", lang: "EN", category: "Basics", difficulty: "Beginner" },
  { id: "3dsl4GTZJLM", title: "How to Read Candlestick Charts", channel: "Zerodha Varsity", lang: "EN", category: "Candlesticks", difficulty: "Beginner" },
  { id: "EQjMCHbRVDQ", title: "Technical Indicators Explained", channel: "Zerodha Varsity", lang: "EN", category: "Indicators", difficulty: "Intermediate" },
  { id: "hlRuxZFdlyM", title: "Introduction to Futures Trading", channel: "Zerodha Varsity", lang: "EN", category: "F&O", difficulty: "Intermediate" },
  { id: "SD7sw0bf1ms", title: "Options Theory for Professional Trading", channel: "Zerodha Varsity", lang: "EN", category: "F&O", difficulty: "Advanced" },
  // English — Trading with Vivek
  { id: "wxyAJ3oYLqE", title: "Top Candlestick Patterns Every Trader Must Know", channel: "Trading with Vivek", lang: "EN", category: "Candlesticks", difficulty: "Beginner" },
  { id: "5SBbicVYeN4", title: "Swing Trading Strategy for Beginners", channel: "Trading with Vivek", lang: "EN", category: "Strategies", difficulty: "Intermediate" },
  { id: "ovNVMpg6G8Y", title: "RSI Indicator — Complete Guide", channel: "Trading with Vivek", lang: "EN", category: "Indicators", difficulty: "Beginner" },
  // English — P R Sundar
  { id: "xGIFKVmfBpI", title: "Options Trading Full Course for Beginners", channel: "P R Sundar", lang: "EN", category: "F&O", difficulty: "Intermediate" },
  { id: "dLMSEqHqF6I", title: "How to Sell Options for Monthly Income", channel: "P R Sundar", lang: "EN", category: "F&O", difficulty: "Advanced" },
  // English — Rayner Teo (global technical analysis)
  { id: "eynxyoKgpng", title: "Price Action Trading Secrets", channel: "Rayner Teo", lang: "EN", category: "Strategies", difficulty: "Intermediate" },
  { id: "AbTBOKENjQI", title: "Support and Resistance — Full Guide", channel: "Rayner Teo", lang: "EN", category: "Basics", difficulty: "Beginner" },
  // English — The Trading Channel
  { id: "eynxyoKgpng_tc", title: "Best Chart Patterns for Trading", channel: "The Trading Channel", lang: "EN", category: "Candlesticks", difficulty: "Intermediate" },
  // Hindi — CA Rachana Ranade
  { id: "86rjS0EpR3E", title: "Share Market Kaise Sikhe — Complete Guide", channel: "CA Rachana Ranade", lang: "HI", category: "Basics", difficulty: "Beginner" },
  { id: "Y7K8EMUhLGw", title: "Candlestick Patterns in Hindi", channel: "CA Rachana Ranade", lang: "HI", category: "Candlesticks", difficulty: "Beginner" },
  { id: "g2dA5FRrEdY", title: "Moving Average — Poori Jankari", channel: "CA Rachana Ranade", lang: "HI", category: "Indicators", difficulty: "Beginner" },
  { id: "xSTDL3hK-aI", title: "Futures aur Options Kya Hote Hain", channel: "CA Rachana Ranade", lang: "HI", category: "F&O", difficulty: "Intermediate" },
  // Hindi — Pranjal Kamra
  { id: "p7HKvqRI_Bo", title: "Share Market for Beginners in Hindi", channel: "Pranjal Kamra", lang: "HI", category: "Basics", difficulty: "Beginner" },
  { id: "IdoLqC0Ke70", title: "NSE vs BSE — Difference Explained", channel: "Pranjal Kamra", lang: "HI", category: "Indian Market", difficulty: "Beginner" },
  { id: "bsWXgTmPx5Y", title: "Intraday Trading Rules — Hindi", channel: "Pranjal Kamra", lang: "HI", category: "Strategies", difficulty: "Intermediate" },
  // Hindi — Nitin Bhatia
  { id: "5Y0R1CKpBLA", title: "Doji Hammer Engulfing Patterns — Hindi", channel: "Nitin Bhatia", lang: "HI", category: "Candlesticks", difficulty: "Intermediate" },
  { id: "xSTDL3hK-aI_nb", title: "Options Basics in Hindi", channel: "Nitin Bhatia", lang: "HI", category: "F&O", difficulty: "Intermediate" },
  // Hindi — Pushkar Raj Thakur
  { id: "rf4Gdm1BGOE", title: "Stock Market Se Ameer Kaise Bane", channel: "Pushkar Raj Thakur", lang: "HI", category: "Basics", difficulty: "Beginner" },
  { id: "5fYzXq3EMZE", title: "Long Term Investment Strategy", channel: "Pushkar Raj Thakur", lang: "HI", category: "Strategies", difficulty: "Beginner" },
  // Hindi — Neeraj Joshi
  { id: "QnEGp4PEwFY", title: "Nifty 50 kya hai? — Simple Explanation", channel: "Neeraj Joshi", lang: "HI", category: "Indian Market", difficulty: "Beginner" },
  { id: "FiMcJeKRSHU", title: "MACD Indicator Explained in Hindi", channel: "Neeraj Joshi", lang: "HI", category: "Indicators", difficulty: "Intermediate" },
  // Hindi — Trading Chanakya
  { id: "8Ije0jZ3jGY", title: "Intraday Chart Analysis Hindi", channel: "Trading Chanakya", lang: "HI", category: "Strategies", difficulty: "Intermediate" },
  { id: "wKlkVjZLIJc", title: "Bollinger Bands Full Course Hindi", channel: "Trading Chanakya", lang: "HI", category: "Indicators", difficulty: "Intermediate" },
  // Hindi — Booming Bulls
  { id: "1kaJQ4ePvXY", title: "Price Action Trading Hindi", channel: "Booming Bulls", lang: "HI", category: "Strategies", difficulty: "Advanced" },
  { id: "6R3sPeR9Idc", title: "Nifty Bank Nifty Analysis Live", channel: "Booming Bulls", lang: "HI", category: "Indian Market", difficulty: "Intermediate" },
  // Hindi — FinnovationZ (Prasad)
  { id: "SEfsfB5Bmck", title: "Fundamental Analysis Hindi", channel: "FinnovationZ", lang: "HI", category: "Basics", difficulty: "Intermediate" },
  // Telugu — Day Trader Telugu
  { id: "8IYRMX_sM0Y", title: "Intraday Trading Basics Telugu lo", channel: "Day Trader Telugu", lang: "TE", category: "Strategies", difficulty: "Beginner" },
  { id: "mMkBNqXJhP4", title: "Candlestick Patterns Telugu — Complete Guide", channel: "Day Trader Telugu", lang: "TE", category: "Candlesticks", difficulty: "Beginner" },
  { id: "kNpJVuFGz2c", title: "RSI Indicator Telugu lo Nerchukovadm Ela", channel: "Day Trader Telugu", lang: "TE", category: "Indicators", difficulty: "Beginner" },
  // Telugu — Telugu Trader Shyam
  { id: "vKb8a7XTQRM", title: "Share Market Basics Telugu lo", channel: "Telugu Trader Shyam", lang: "TE", category: "Basics", difficulty: "Beginner" },
  { id: "Lp2rXXt4yZA", title: "Technical Analysis Telugu — Full Course", channel: "Telugu Trader Shyam", lang: "TE", category: "Indicators", difficulty: "Intermediate" },
  // Telugu — Money Purse
  { id: "o7fREl3LGGA", title: "Stock Market lo Ela Invest Cheyali", channel: "Money Purse", lang: "TE", category: "Basics", difficulty: "Beginner" },
  { id: "3dRXnPPLhqY", title: "Mutual Funds vs Stocks — Telugu", channel: "Money Purse", lang: "TE", category: "Basics", difficulty: "Beginner" },
  // Telugu — Mister Trader
  { id: "HQqrTQvkdpM", title: "Options Trading Telugu — Beginners Guide", channel: "Mister Trader", lang: "TE", category: "F&O", difficulty: "Intermediate" },
  { id: "W9qZW6s0jR4", title: "Swing Trading Telugu lo Nerchukovadm", channel: "Mister Trader", lang: "TE", category: "Strategies", difficulty: "Intermediate" },
  // Telugu — Market Feed Telugu
  { id: "vXmYnPzKjQ8", title: "NSE BSE Telugu lo Explain Chesamu", channel: "Market Feed Telugu", lang: "TE", category: "Indian Market", difficulty: "Beginner" },
  { id: "tRnLpWqXmY2", title: "Nifty Bank Nifty Telugu Analysis", channel: "Market Feed Telugu", lang: "TE", category: "Indian Market", difficulty: "Intermediate" },
  // Telugu — Trading Marathon
  { id: "K0e1ihLcH8w", title: "Intraday Strategy Telugu", channel: "Trading Marathon Telugu", lang: "TE", category: "Strategies", difficulty: "Intermediate" },
  { id: "hDx3lI2XxjQ", title: "Moving Average Telugu Guide", channel: "Trading Marathon Telugu", lang: "TE", category: "Indicators", difficulty: "Beginner" },
];

const cleanId = (id: string) => id.replace(/_.*$/, "");
const youtubeUrl = (id: string) => `https://www.youtube.com/watch?v=${cleanId(id)}`;

const LANG_META: Record<Lang | "ALL", { label: string; flag: string; pill: string }> = {
  ALL: { label: "All", flag: "🌐", pill: "bg-white/10 text-white" },
  EN: { label: "English", flag: "🇬🇧", pill: "bg-blue-500/20 text-blue-300" },
  HI: { label: "Hindi", flag: "🇮🇳", pill: "bg-orange-500/20 text-orange-300" },
  TE: { label: "Telugu", flag: "తె", pill: "bg-emerald-500/20 text-emerald-300" },
};

const DIFF_PILL: Record<Difficulty, string> = {
  Beginner: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Intermediate: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Advanced: "bg-red-500/20 text-red-300 border-red-500/30",
};

const CATEGORIES: Category[] = ["All", "Basics", "Candlesticks", "Indicators", "F&O", "Strategies", "Indian Market"];

const WATCH_KEY = "nishira_watched_v2";

function useWatched() {
  const [watched, setWatched] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(WATCH_KEY);
      if (raw) setWatched(JSON.parse(raw));
    } catch {}
  }, []);
  const persist = (arr: string[]) => {
    setWatched(arr);
    try { localStorage.setItem(WATCH_KEY, JSON.stringify(arr)); } catch {}
  };
  const toggle = (id: string) => {
    persist(watched.includes(id) ? watched.filter((x) => x !== id) : [...watched, id]);
  };
  const mark = (id: string) => {
    if (!watched.includes(id)) persist([...watched, id]);
  };
  return { watched, toggle, mark };
}

/* ---------------- CANDLESTICK PATTERNS ---------------- */

type PatternType = "Bullish" | "Bearish" | "Neutral";
type Reliability = "High" | "Medium" | "Low";
type CandleSpec = { x: number; bodyTop: number; bodyBottom: number; wickTop: number; wickBottom: number; color: "g" | "r" };
interface Pattern {
  name: string;
  type: PatternType;
  reliability: Reliability;
  desc: string;
  hint: string;
  candles: CandleSpec[];
}

// coordinates in a 100x120 svg (x centered, y 0=top, 120=bottom)
const G = "#26a69a";
const R = "#ef5350";

const c = (x: number, bt: number, bb: number, wt: number, wb: number, col: "g" | "r"): CandleSpec => ({
  x, bodyTop: bt, bodyBottom: bb, wickTop: wt, wickBottom: wb, color: col,
});

const PATTERNS: Pattern[] = [
  // Bullish
  { name: "Hammer", type: "Bullish", reliability: "High",
    desc: "Small body at top with a long lower wick — buyers rejected lower prices.",
    hint: "Look for confirmation candle above the hammer to enter long.",
    candles: [c(50, 20, 35, 15, 105, "g")] },
  { name: "Inverted Hammer", type: "Bullish", reliability: "Medium",
    desc: "Small body near the low with a long upper wick after a downtrend.",
    hint: "Wait for a strong green candle next before buying.",
    candles: [c(50, 80, 95, 15, 100, "g")] },
  { name: "Bullish Engulfing", type: "Bullish", reliability: "High",
    desc: "Large green candle completely engulfs the previous small red body.",
    hint: "Enter on close; stop-loss below the engulfing candle low.",
    candles: [c(35, 55, 75, 45, 85, "r"), c(65, 30, 90, 20, 100, "g")] },
  { name: "Morning Star", type: "Bullish", reliability: "High",
    desc: "Three candles: red, small doji, then strong green. Powerful reversal.",
    hint: "Best signal after an extended downtrend near support.",
    candles: [c(22, 35, 75, 25, 85, "r"), c(50, 68, 74, 60, 82, "g"), c(78, 25, 65, 15, 75, "g")] },
  { name: "Piercing Line", type: "Bullish", reliability: "Medium",
    desc: "Green candle opens below prior red's low and closes above its midpoint.",
    hint: "Confirmation with rising volume strengthens the signal.",
    candles: [c(35, 30, 80, 20, 90, "r"), c(65, 40, 90, 30, 100, "g")] },
  { name: "Three White Soldiers", type: "Bullish", reliability: "High",
    desc: "Three consecutive green candles closing progressively higher.",
    hint: "Strong trend continuation — avoid chasing if too extended.",
    candles: [c(22, 70, 95, 60, 100, "g"), c(50, 45, 75, 35, 80, "g"), c(78, 20, 55, 10, 60, "g")] },
  { name: "Bullish Harami", type: "Bullish", reliability: "Medium",
    desc: "A large red candle followed by a small green candle inside its range.",
    hint: "Suggests bears are losing steam — confirm with next candle.",
    candles: [c(35, 20, 90, 10, 100, "r"), c(65, 45, 65, 40, 70, "g")] },
  { name: "Dragonfly Doji", type: "Bullish", reliability: "Medium",
    desc: "Open = close near the high with a long lower wick. Buying pressure.",
    hint: "Strong reversal at support; weak in choppy ranges.",
    candles: [c(50, 25, 28, 25, 105, "g")] },
  { name: "Rising Three Methods", type: "Bullish", reliability: "High",
    desc: "Big green, three small reds inside its range, then another big green.",
    hint: "Continuation pattern — trail stops as trend resumes.",
    candles: [
      c(15, 25, 90, 15, 100, "g"),
      c(35, 45, 60, 40, 65, "r"),
      c(50, 50, 65, 45, 70, "r"),
      c(65, 55, 70, 50, 75, "r"),
      c(85, 20, 80, 10, 90, "g"),
    ] },
  { name: "Tweezer Bottom", type: "Bullish", reliability: "Medium",
    desc: "Two candles sharing the same low — buyers defended the level twice.",
    hint: "Enter above the second candle's high with stop below the low.",
    candles: [c(35, 30, 85, 20, 100, "r"), c(65, 40, 85, 30, 100, "g")] },

  // Bearish
  { name: "Shooting Star", type: "Bearish", reliability: "High",
    desc: "Small body near the low with a long upper wick after an uptrend.",
    hint: "Sell on next red candle close; stop above the wick.",
    candles: [c(50, 85, 100, 15, 105, "r")] },
  { name: "Hanging Man", type: "Bearish", reliability: "Medium",
    desc: "Hammer-shape body at the top of an uptrend — warning of reversal.",
    hint: "Confirm with a strong red candle before shorting.",
    candles: [c(50, 20, 35, 15, 105, "r")] },
  { name: "Bearish Engulfing", type: "Bearish", reliability: "High",
    desc: "Large red candle completely engulfs the previous small green body.",
    hint: "Short on close; stop-loss above the engulfing candle high.",
    candles: [c(35, 55, 75, 45, 85, "g"), c(65, 30, 90, 20, 100, "r")] },
  { name: "Evening Star", type: "Bearish", reliability: "High",
    desc: "Three candles: green, small doji, then strong red. Powerful reversal.",
    hint: "Best signal after an extended uptrend near resistance.",
    candles: [c(22, 25, 65, 15, 75, "g"), c(50, 38, 44, 30, 52, "r"), c(78, 35, 80, 25, 90, "r")] },
  { name: "Dark Cloud Cover", type: "Bearish", reliability: "Medium",
    desc: "Red candle opens above prior green's high and closes below its midpoint.",
    hint: "Confirmation with volume expansion strengthens signal.",
    candles: [c(35, 20, 70, 10, 80, "g"), c(65, 30, 80, 20, 90, "r")] },
  { name: "Three Black Crows", type: "Bearish", reliability: "High",
    desc: "Three consecutive red candles closing progressively lower.",
    hint: "Strong bearish momentum — do not buy the dip prematurely.",
    candles: [c(22, 20, 55, 10, 60, "r"), c(50, 45, 75, 35, 80, "r"), c(78, 70, 95, 60, 100, "r")] },
  { name: "Bearish Harami", type: "Bearish", reliability: "Medium",
    desc: "A large green candle followed by a small red candle inside its range.",
    hint: "Signals weakening momentum — wait for confirmation.",
    candles: [c(35, 20, 90, 10, 100, "g"), c(65, 45, 65, 40, 70, "r")] },
  { name: "Gravestone Doji", type: "Bearish", reliability: "Medium",
    desc: "Open = close near the low with a long upper wick. Selling pressure.",
    hint: "Strong reversal at resistance zones.",
    candles: [c(50, 92, 95, 15, 95, "r")] },

  // Neutral
  { name: "Doji", type: "Neutral", reliability: "Low",
    desc: "Open equals close — cross shape. Market indecision.",
    hint: "Trade only after next candle confirms direction.",
    candles: [c(50, 58, 62, 20, 100, "g")] },
  { name: "Spinning Top", type: "Neutral", reliability: "Low",
    desc: "Small body with roughly equal upper and lower wicks. Indecision.",
    hint: "Ignore during trends; watch for cluster near key levels.",
    candles: [c(50, 50, 70, 20, 100, "g")] },
];

function CandleSVG({ candles }: { candles: CandleSpec[] }) {
  return (
    <svg viewBox="0 0 100 120" className="h-24 w-full" aria-hidden>
      {candles.map((cd, i) => {
        const col = cd.color === "g" ? G : R;
        const w = 14;
        return (
          <g key={i}>
            <line x1={cd.x} x2={cd.x} y1={cd.wickTop} y2={cd.wickBottom} stroke={col} strokeWidth={1.5} />
            <rect x={cd.x - w / 2} y={cd.bodyTop} width={w} height={Math.max(2, cd.bodyBottom - cd.bodyTop)} fill={col} rx={1} />
          </g>
        );
      })}
    </svg>
  );
}

/* ---------------- PAGE ---------------- */

type MainTab = "videos" | "patterns";

function LearnPage() {
  const [mainTab, setMainTab] = useState<MainTab>("videos");

  // Video filters
  const [langTab, setLangTab] = useState<"ALL" | Lang>("ALL");
  const [catTab, setCatTab] = useState<Category>("All");
  const { watched, toggle, mark } = useWatched();
  const [playing, setPlaying] = useState<Video | null>(null);
  const [embedError, setEmbedError] = useState<null | { code?: number; message: string }>(null);
  const [embedReady, setEmbedReady] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Pattern filter
  const [patternFilter, setPatternFilter] = useState<"All" | PatternType>("All");

  const filteredVideos = useMemo(() => {
    return VIDEOS.filter(
      (v) =>
        (langTab === "ALL" || v.lang === langTab) &&
        (catTab === "All" || v.category === catTab)
    );
  }, [langTab, catTab]);

  const filteredPatterns = useMemo(
    () => PATTERNS.filter((p) => patternFilter === "All" || p.type === patternFilter),
    [patternFilter]
  );

  const total = VIDEOS.length;
  const watchedCount = watched.filter((id) => VIDEOS.some((v) => v.id === id)).length;
  const pct = total ? Math.round((watchedCount / total) * 100) : 0;

  // Escape to close modal
  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPlaying(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing]);

  // Detect YouTube embed errors via IFrame API postMessage protocol
  useEffect(() => {
    if (!playing) return;
    setEmbedError(null);
    setEmbedReady(false);

    const ERROR_MESSAGES: Record<number, string> = {
      2: "Invalid video request.",
      5: "The video can't be played in this HTML5 player.",
      100: "Video not found or has been removed.",
      101: "The video's owner does not allow it to be played in embedded players.",
      150: "The video's owner does not allow it to be played in embedded players.",
    };

    const onMessage = (ev: MessageEvent) => {
      if (typeof ev.data !== "string") return;
      if (!/youtube\.com$/i.test(new URL(ev.origin).hostname.replace(/^www\./, ""))) return;
      try {
        const data = JSON.parse(ev.data);
        if (data?.event === "onReady" || data?.event === "infoDelivery") {
          setEmbedReady(true);
        }
        if (data?.event === "onError") {
          const code = Number(data.info);
          setEmbedError({ code, message: ERROR_MESSAGES[code] ?? "This video failed to load." });
        }
      } catch {
        /* not JSON — ignore */
      }
    };
    window.addEventListener("message", onMessage);

    // Fallback: if we never hear back within 6s, assume blocked/failed
    const timer = window.setTimeout(() => {
      setEmbedReady((ready) => {
        if (!ready) {
          setEmbedError((prev) => prev ?? { message: "The video didn't respond. It may be blocked or unavailable." });
        }
        return ready;
      });
    }, 6000);

    return () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(timer);
    };
  }, [playing, iframeKey]);

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">

          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold md:text-3xl">Learning Hub</h1>
          <p className="text-sm text-muted-foreground">Master trading in your language — English, Hindi, Telugu</p>
        </div>
      </div>

      {/* Main tabs */}
      <div className="mb-4 inline-flex rounded-lg border border-border/50 bg-muted/20 p-1">
        {(["videos", "patterns"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setMainTab(t)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
              mainTab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "videos" ? "Videos" : "Candlestick Patterns"}
          </button>
        ))}
      </div>

      {mainTab === "videos" ? (
        <>
          {/* Progress */}
          <div className="mb-6 rounded-xl border border-border/50 bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">{watchedCount} of {total} videos watched</span>
              <span className="text-muted-foreground">{pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted/40">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: "linear-gradient(90deg, #a855f7, #6366f1)" }}
              />
            </div>
          </div>

          {/* Language row */}
          <div className="-mx-3 mb-3 overflow-x-auto px-3">
            <div className="flex gap-2">
              {(["ALL", "EN", "HI", "TE"] as const).map((l) => {
                const m = LANG_META[l];
                const active = langTab === l;
                return (
                  <button
                    key={l}
                    onClick={() => setLangTab(l)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-border/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="mr-1">{m.flag}</span>{m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category row */}
          <div className="-mx-3 mb-6 overflow-x-auto px-3">
            <div className="flex gap-2">
              {CATEGORIES.map((cat) => {
                const active = catTab === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCatTab(cat)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-border/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Video grid */}
          {filteredVideos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/50 p-12 text-center text-sm text-muted-foreground">
              No videos match this filter.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredVideos.map((v) => (
                <VideoCard
                  key={v.id}
                  video={v}
                  watched={watched.includes(v.id)}
                  onToggle={() => toggle(v.id)}
                  onPlay={() => setPlaying(v)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Pattern filter */}
          <div className="-mx-3 mb-6 overflow-x-auto px-3">
            <div className="flex gap-2">
              {(["All", "Bullish", "Bearish", "Neutral"] as const).map((f) => {
                const active = patternFilter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setPatternFilter(f)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-border/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPatterns.map((p) => (
              <PatternCard key={p.name} pattern={p} />
            ))}
          </div>
        </>
      )}

      {/* Modal */}
      {playing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPlaying(null)}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-xl border border-border/50 bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{playing.title}</div>
                <div className="text-xs text-muted-foreground">{playing.channel}</div>
              </div>
              <button
                onClick={() => setPlaying(null)}
                aria-label="Close"
                className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative w-full bg-black" style={{ aspectRatio: "16/9" }}>
              {!embedError ? (
                <iframe
                  key={iframeKey}
                  title={playing.title}
                  src={`https://www.youtube.com/embed/${cleanId(playing.id)}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "")}`}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                  onLoad={(e) => {
                    // Handshake so the YT player sends us event messages
                    try {
                      (e.currentTarget as HTMLIFrameElement).contentWindow?.postMessage(
                        JSON.stringify({ event: "listening", id: playing.id }),
                        "*"
                      );
                    } catch {
                      /* ignore */
                    }
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-red-500/15 text-red-400">
                    <AlertTriangle className="h-7 w-7" />
                  </div>
                  <div className="max-w-md">
                    <div className="text-base font-semibold text-white">This video can't be played here</div>
                    <div className="mt-1 text-sm text-white/70">{embedError.message}</div>
                    {embedError.code ? (
                      <div className="mt-1 text-[11px] text-white/40">Error code: {embedError.code}</div>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => { setEmbedError(null); setEmbedReady(false); setIframeKey((k) => k + 1); }}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/40 px-3 py-1.5 text-sm font-medium text-white hover:bg-background/70"
                    >
                      <RefreshCw className="h-4 w-4" /> Retry
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(youtubeUrl(playing.id));
                        toast.success("YouTube link copied");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/40 px-3 py-1.5 text-sm font-medium text-white hover:bg-background/70"
                    >
                      <Copy className="h-4 w-4" /> Copy link
                    </button>
                    <a
                      href={youtubeUrl(playing.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md bg-red-500/90 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500"
                    >
                      <ExternalLink className="h-4 w-4" /> Open on YouTube
                    </a>
                  </div>
                </div>
              )}
            </div>
            {!embedError && (
              <div className="border-t border-yellow-500/20 bg-yellow-500/5 px-4 py-2 text-[11px] text-yellow-200/90 flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>Video not loading? Some videos block embeds. Copy the link or open on YouTube.</span>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/40 px-4 py-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(youtubeUrl(playing.id));
                  toast.success("YouTube link copied");
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-border/60 px-3 py-1.5 text-sm font-medium hover:bg-muted/40"
              >
                <Copy className="h-4 w-4" /> Copy link
              </button>
              <a
                href={youtubeUrl(playing.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border/60 px-3 py-1.5 text-sm font-medium hover:bg-muted/40"
              >
                <ExternalLink className="h-4 w-4" /> Open on YouTube
              </a>
              <button
                onClick={() => { mark(playing.id); setPlaying(null); }}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/20 px-3 py-1.5 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30"
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark as Watched
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VideoCard({
  video, watched, onToggle, onPlay,
}: { video: Video; watched: boolean; onToggle: () => void; onPlay: () => void }) {
  // Try hqdefault first (higher quality, most reliable), fall back through the chain, then icon.
  const fallbacks = [
    `https://i.ytimg.com/vi/${cleanId(video.id)}/hqdefault.jpg`,
    `https://i.ytimg.com/vi/${cleanId(video.id)}/mqdefault.jpg`,
    `https://img.youtube.com/vi/${cleanId(video.id)}/0.jpg`,
  ];
  const [imgIdx, setImgIdx] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);
  const langMeta = LANG_META[video.lang];

  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(youtubeUrl(video.id));
    toast.success("YouTube link copied");
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border/50 bg-white/[0.03] transition hover:border-primary/40">
      <div className="relative aspect-video bg-black/60">
        {!imgFailed ? (
          <img
            src={fallbacks[imgIdx]}
            alt={video.title}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => {
              if (imgIdx < fallbacks.length - 1) setImgIdx(imgIdx + 1);
              else setImgFailed(true);
            }}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/20 to-secondary/20">
            <PlayCircle className="h-12 w-12 text-primary/70" />
            <span className="text-[10px] font-medium text-muted-foreground">Preview unavailable</span>
          </div>
        )}
        <button
          onClick={onPlay}
          aria-label="Play"
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100"
        >
          <PlayCircle className="h-14 w-14 text-white drop-shadow-lg" />
        </button>
        <span className="absolute left-2 top-2 max-w-[65%] truncate rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
          {video.channel}
        </span>
        <span className={`absolute right-2 top-2 rounded-md px-2 py-0.5 text-[11px] font-bold ${langMeta.pill}`}>
          {video.lang}
        </span>
        {watched && (
          <span className="absolute bottom-2 right-2 rounded-full bg-emerald-500 p-1 text-white shadow">
            <CheckCircle2 className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{video.title}</h3>
        <div className="mt-auto flex items-center justify-between gap-2">
          <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${DIFF_PILL[video.difficulty]}`}>
            {video.difficulty}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={copy}
              title="Copy YouTube link"
              aria-label="Copy YouTube link"
              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted/40 hover:text-foreground"
            >
              <Copy className="h-4 w-4" />
            </button>
            <a
              href={youtubeUrl(video.id)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Open on YouTube"
              aria-label="Open on YouTube"
              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted/40 hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <button
              onClick={onToggle}
              className={`rounded-md p-1.5 text-xs transition ${
                watched ? "text-emerald-400 hover:bg-emerald-500/10" : "text-muted-foreground hover:bg-muted/40"
              }`}
              aria-label="Toggle watched"
              title={watched ? "Mark unwatched" : "Mark watched"}
            >
              <CheckCircle2 className="h-4 w-4" />
            </button>
            <button
              onClick={onPlay}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <PlayCircle className="h-3.5 w-3.5" /> Watch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PatternCard({ pattern }: { pattern: Pattern }) {
  const typePill =
    pattern.type === "Bullish" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
    : pattern.type === "Bearish" ? "bg-red-500/20 text-red-300 border-red-500/30"
    : "bg-white/10 text-muted-foreground border-border/50";
  const relPill =
    pattern.reliability === "High" ? "bg-primary/20 text-primary"
    : pattern.reliability === "Medium" ? "bg-yellow-500/20 text-yellow-300"
    : "bg-white/10 text-muted-foreground";
  const hintBg =
    pattern.type === "Bullish" ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-100"
    : pattern.type === "Bearish" ? "border-red-500/30 bg-red-500/5 text-red-100"
    : "border-border/40 bg-white/[0.04] text-foreground/80";

  return (
    <div className="flex flex-col rounded-xl border border-border/50 bg-white/[0.03] p-4 transition hover:border-primary/40">
      <div className="grid grid-cols-[100px_minmax(0,1fr)] items-center gap-3">
        <div className="grid h-28 place-items-center rounded-lg bg-black/40 p-2">
          <CandleSVG candles={pattern.candles} />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold">{pattern.name}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${typePill}`}>{pattern.type}</span>
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${relPill}`}>{pattern.reliability}</span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{pattern.desc}</p>
      <div className={`mt-3 rounded-md border p-2 text-xs ${hintBg}`}>
        <span className="font-semibold">What to do: </span>{pattern.hint}
      </div>
      <Link
        to="/docs"
        hash="candlesticks"
        className="mt-3 inline-flex items-center gap-1 self-start text-xs font-medium text-primary hover:underline"
      >
        <BookOpen className="h-3.5 w-3.5" /> Learn More
      </Link>
    </div>
  );
}
