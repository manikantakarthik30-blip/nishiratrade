import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Rocket, X, Minus, Send, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { askNishiraAI } from "@/lib/nishira-ai.functions";
import { DraggableAIButton, getSavedCorner, type Corner } from "./DraggableAIButton";


type Msg = {
  role: "user" | "assistant";
  content: string;
  ts: number;
};

const WELCOME: Msg = {
  role: "assistant",
  ts: Date.now(),
  content: `Hi! I'm **NISHIRA.AI** 🚀 your personal trading education assistant. I can help you understand:

• Candlestick patterns & chart reading
• Technical indicators (RSI, MACD, Bollinger Bands)
• Trading strategies & concepts
• How markets work
• Your portfolio analysis

⚠️ Note: I provide education only — I won't tell you to buy or sell any specific stock.

What would you like to learn today?`,
};

const CHIPS = [
  "What is RSI?",
  "How to read candlesticks?",
  "Explain MACD",
  "What is support & resistance?",
];

export function NishiraAI() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [corner, setCorner] = useState<Corner>("bottom-right");
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ask = useServerFn(askNishiraAI);

  useEffect(() => {
    setCorner(getSavedCorner());
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && !minimized) {
      setHasUnread(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, minimized]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError(null);
    const nextMsgs: Msg[] = [
      ...messages,
      { role: "user", content: trimmed, ts: Date.now() },
    ];
    setMessages(nextMsgs);
    setInput("");
    setLoading(true);
    try {
      const payload = nextMsgs
        .filter((m) => m !== WELCOME)
        .map((m) => ({ role: m.role, content: m.content }));
      const { reply } = await ask({ data: { messages: payload } });
      setMessages((prev) => [...prev, { role: "assistant", content: reply, ts: Date.now() }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const showChips = messages.length === 1;

  return (
    <>
      {/* Floating trigger */}
      <AnimatePresence>
        {(!open || minimized) && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setOpen(true); setMinimized(false); }}
            aria-label="Open NISHIRA.AI"
            title="NISHIRA.AI — Trading Assistant"
            className="group fixed right-6 bottom-20 z-[9999] flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_10px_40px_rgba(124,58,237,0.5)] md:bottom-6"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #00d4ff 100%)" }}
          >
            <span className="absolute inset-0 animate-ping rounded-full opacity-30" style={{ background: "linear-gradient(135deg, #7c3aed, #00d4ff)" }} />
            <Rocket className="relative z-10 h-6 w-6" />
            {hasUnread && (
              <span className="absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-[#0d0d1a] bg-red-500" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && !minimized && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
            className="fixed z-[9999] flex flex-col overflow-hidden border border-[#2a2a4e] bg-[#0d0d1a] shadow-[0_0_40px_rgba(124,58,237,0.3)] max-md:inset-0 max-md:rounded-t-2xl md:bottom-6 md:right-6 md:h-[520px] md:w-[380px] md:rounded-2xl"
          >
            {/* Header */}
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#1a1a2e] px-4">
              <div className="flex min-w-0 items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "linear-gradient(135deg, #7c3aed, #00d4ff)" }}>
                  <Rocket className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="truncate bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-sm font-bold text-transparent">
                    NISHIRA.AI
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Sparkles className="h-2.5 w-2.5" /> Powered by Gemini
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMinimized(true)}
                  className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  aria-label="Minimize"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((m, i) => (
                <MessageBubble key={i} msg={m} />
              ))}
              {loading && <TypingDots />}
              {error && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                  {error}
                </div>
              )}
              {showChips && !loading && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {CHIPS.map((c) => (
                    <button
                      key={c}
                      onClick={() => send(c)}
                      className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary transition hover:bg-primary/20"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-[#1a1a2e] p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  rows={1}
                  placeholder="Ask about trading concepts..."
                  className="max-h-28 flex-1 resize-none rounded-lg border border-[#2a2a4e] bg-[#1a1a2e] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  disabled={loading}
                />
                <button
                  onClick={() => send(input)}
                  disabled={loading || !input.trim()}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white transition disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #00d4ff)" }}
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MessageBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  const time = new Date(msg.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (isUser) {
    return (
      <div className="flex flex-col items-end">
        <div className="max-w-[75%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-[#1a1a4a] px-3 py-2 text-sm text-foreground">
          {msg.content}
        </div>
        <div className="mt-1 text-[10px] text-muted-foreground">{time}</div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full" style={{ background: "linear-gradient(135deg, #7c3aed, #00d4ff)" }}>
        <Rocket className="h-3 w-3 text-white" />
      </div>
      <div className="flex max-w-[85%] flex-col">
        <div className="prose prose-sm prose-invert max-w-none rounded-2xl rounded-bl-sm bg-[#1a1a2e] px-3 py-2 text-sm text-foreground [&_p]:my-1 [&_ul]:my-1 [&_ul]:pl-4 [&_ol]:my-1 [&_ol]:pl-4 [&_strong]:text-primary [&_code]:rounded [&_code]:bg-black/40 [&_code]:px-1">
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>
        <div className="mt-1 text-[10px] text-muted-foreground">{time}</div>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-6 w-6 place-items-center rounded-full" style={{ background: "linear-gradient(135deg, #7c3aed, #00d4ff)" }}>
        <Rocket className="h-3 w-3 text-white" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-[#1a1a2e] px-3 py-2.5">
        <Dot delay={0} /><Dot delay={0.15} /><Dot delay={0.3} />
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <motion.span
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 0.9, repeat: Infinity, delay }}
      className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground"
    />
  );
}
