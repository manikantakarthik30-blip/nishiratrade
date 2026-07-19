import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Crown } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { livePrice } from "@/lib/stocks";
import { useTicker } from "@/hooks/useLivePrices";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  component: LeaderboardPage,
});

type Market = "GLOBAL" | "IN" | "US";

// Mock traders per market
const MOCK_USERS_US = [
  { username: "quantumleap", value: 24500 },
  { username: "novabolt", value: 21200 },
  { username: "starstruck", value: 18900 },
  { username: "warpdrive", value: 17650 },
  { username: "eventhorizon", value: 15300 },
  { username: "cosmicray", value: 13800 },
  { username: "stellarwind", value: 12400 },
  { username: "gravitywell", value: 11100 },
  { username: "voidwalker", value: 10500 },
  { username: "asteroidhunter", value: 9800 },
];

const MOCK_USERS_IN = [
  { username: "dalalstreetking", value: 2450000 },
  { username: "niftyninja", value: 2120000 },
  { username: "sensexsage", value: 1890000 },
  { username: "bullbaba", value: 1765000 },
  { username: "chaiwalatrader", value: 1530000 },
  { username: "mumbaimogul", value: 1380000 },
  { username: "rupeerocket", value: 1240000 },
  { username: "banknifty_boss", value: 1110000 },
  { username: "intradayindra", value: 1050000 },
  { username: "swingsingh", value: 980000 },
];

const INR_TO_USD = 1 / 83;

function LeaderboardPage() {
  useTicker();
  const [market, setMarket] = useState<Market>("GLOBAL");

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      return (await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle()).data;
    },
  });

  const { data: holdings = [] } = useQuery({
    queryKey: ["holdings"],
    queryFn: async () => (await supabase.from("holdings").select("*")).data ?? [],
  });

  const inrHoldings = holdings.filter((h) => h.market === "IN").reduce((s, h) => s + Number(h.qty) * livePrice(h.ticker), 0);
  const usdHoldings = holdings.filter((h) => h.market === "US").reduce((s, h) => s + Number(h.qty) * livePrice(h.ticker), 0);
  const meUsdValue = usdHoldings + Number(profile?.balance_usd ?? 10000);
  const meInrValue = inrHoldings + Number(profile?.balance_inr ?? 1000000);
  const meGlobalUsd = meUsdValue + meInrValue * INR_TO_USD;

  const config = {
    GLOBAL: {
      label: "Global",
      currency: "$",
      formatter: (v: number) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      users: [
        ...MOCK_USERS_US,
        ...MOCK_USERS_IN.map((u) => ({ username: u.username, value: u.value * INR_TO_USD })),
      ],
      meValue: meGlobalUsd,
      startingValue: 10000 + 1000000 * INR_TO_USD,
      subtitle: "All traders, ranked by portfolio value (USD).",
    },
    IN: {
      label: "🇮🇳 Indian Market",
      currency: "₹",
      formatter: (v: number) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
      users: MOCK_USERS_IN,
      meValue: meInrValue,
      startingValue: 1000000,
      subtitle: "Top NSE/BSE traders, ranked by portfolio value (INR).",
    },
    US: {
      label: "🇺🇸 US Market",
      currency: "$",
      formatter: (v: number) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      users: MOCK_USERS_US,
      meValue: meUsdValue,
      startingValue: 10000,
      subtitle: "Top NYSE/NASDAQ traders, ranked by portfolio value (USD).",
    },
  }[market];

  const allUsers = [
    ...config.users,
    { username: profile?.username ?? "you", value: config.meValue, isMe: true },
  ].sort((a, b) => b.value - a.value);

  return (
    <div className="mx-auto max-w-4xl space-y-4 md:space-y-6">
      <div className="text-center">
        <Trophy className="mx-auto h-8 w-8 text-primary md:h-10 md:w-10" />
        <h1 className="mt-2 font-display text-xl font-bold md:text-3xl">Leaderboard</h1>
        <p className="mt-1 text-xs text-muted-foreground md:text-sm">{config.subtitle}</p>
      </div>

      <div className="flex justify-center gap-2">
        {(["GLOBAL", "IN", "US"] as Market[]).map((m) => (
          <Button
            key={m}
            size="sm"
            variant={market === m ? "default" : "outline"}
            onClick={() => setMarket(m)}
            className="text-xs md:text-sm"
          >
            {m === "GLOBAL" ? "🌍 Global" : m === "IN" ? "🇮🇳 India" : "🇺🇸 USA"}
          </Button>
        ))}
      </div>

      <Card className="glass overflow-hidden p-0">
        <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-muted/20 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 md:px-6">Rank</th>
                <th className="px-4 py-3 md:px-6">Trader</th>
                <th className="px-4 py-3 md:px-6">Portfolio Value</th>
                <th className="px-4 py-3 text-right md:px-6">Return</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((u, i) => {
                const isMe = "isMe" in u && u.isMe;
                const returnPct = ((u.value - config.startingValue) / config.startingValue) * 100;
                return (
                  <tr
                    key={u.username + i}
                    className={`border-t border-border/30 ${isMe ? "bg-primary/10" : ""}`}
                  >
                    <td className="px-4 py-3 font-semibold md:px-6">
                      {i === 0 ? <Crown className="inline h-4 w-4 text-yellow-400" /> : null}
                      <span className="ml-1">#{i + 1}</span>
                    </td>
                    <td className="px-4 py-3 md:px-6">
                      <span className={isMe ? "font-bold text-primary" : ""}>{u.username}</span>
                      {isMe && <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] text-primary">YOU</span>}
                    </td>
                    <td className="px-4 py-3 md:px-6">{config.formatter(u.value)}</td>
                    <td className={`px-4 py-3 text-right font-medium md:px-6 ${returnPct >= 0 ? "text-success" : "text-destructive"}`}>
                      {returnPct >= 0 ? "+" : ""}{returnPct.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
