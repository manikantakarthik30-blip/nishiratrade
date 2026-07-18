import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { livePrice } from "@/lib/stocks";
import { useTicker } from "@/hooks/useLivePrices";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  component: LeaderboardPage,
});

// Mock traders — same USD-normalized valuation for a common ranking
const MOCK_USERS = [
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

const INR_TO_USD = 1 / 83; // rough

function LeaderboardPage() {
  useTicker();

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await supabase.from("profiles").select("*").maybeSingle()).data,
  });

  const { data: holdings = [] } = useQuery({
    queryKey: ["holdings"],
    queryFn: async () => (await supabase.from("holdings").select("*")).data ?? [],
  });

  // My portfolio value in USD terms for ranking
  const inrHoldings = holdings.filter((h) => h.market === "IN").reduce((s, h) => s + Number(h.qty) * livePrice(h.ticker), 0);
  const usdHoldings = holdings.filter((h) => h.market === "US").reduce((s, h) => s + Number(h.qty) * livePrice(h.ticker), 0);
  const meValueUsd =
    usdHoldings + Number(profile?.balance_usd ?? 10000) +
    (inrHoldings + Number(profile?.balance_inr ?? 100000)) * INR_TO_USD;

  const allUsers = [
    ...MOCK_USERS,
    { username: profile?.username ?? "you", value: meValueUsd, isMe: true },
  ].sort((a, b) => b.value - a.value);

  return (
    <div className="mx-auto max-w-4xl space-y-4 md:space-y-6">
      <div className="text-center">
        <Trophy className="mx-auto h-8 w-8 text-primary md:h-10 md:w-10" />
        <h1 className="mt-2 font-display text-xl font-bold md:text-3xl">Leaderboard</h1>
        <p className="mt-1 text-xs text-muted-foreground md:text-sm">Top cosmic traders, ranked by portfolio value (USD).</p>
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
                const startingUsd = 10000 + 100000 * INR_TO_USD;
                const returnPct = ((u.value - startingUsd) / startingUsd) * 100;
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
                    <td className="px-4 py-3 md:px-6">${u.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
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
