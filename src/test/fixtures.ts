import type { Match } from "@/types";

export function makeMatch(over: Partial<Match> = {}): Match {
  return {
    id: "m-test",
    sport: "football",
    league: "英超",
    leagueShort: "EPL",
    home: { name: "主队A", short: "AAA", logo: "AAA", color: "#EF0107" },
    away: { name: "客队B", short: "BBB", logo: "BBB", color: "#034694" },
    startTime: Date.now() + 3600000,
    status: "scheduled",
    score: { home: 0, away: 0 },
    markets: [
      {
        key: "1x2",
        label: "胜平负",
        selections: [
          { key: "home", label: "主胜", odds: 2.0, prevOdds: 2.0, updatedAt: 0, trend: "stable" },
          { key: "draw", label: "平局", odds: 3.2, prevOdds: 3.2, updatedAt: 0, trend: "stable" },
          { key: "away", label: "客胜", odds: 3.5, prevOdds: 3.5, updatedAt: 0, trend: "stable" },
        ],
      },
    ],
    distribution: { home: 0.5, draw: 0.2, away: 0.3 },
    betVolume: 10000,
    oddsChangeRate: 5,
    anomalyCount: 0,
    isHot: false,
    date: "today",
    ...over,
  };
}
