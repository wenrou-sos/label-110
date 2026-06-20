import type { Match } from "@/types";

const LEAGUE_SHORT_TO_NAME: Record<string, string> = {
  EPL: "英超",
  LALIGA: "西甲",
  SERIEA: "意甲",
  SEA: "意甲",
  LAL: "西甲",
  NBA: "NBA",
  ATP: "ATP大师赛",
};

export function makeMatch(over: Partial<Match> = {}): Match {
  const leagueShort = over.leagueShort ?? "EPL";
  const defaultLeague = LEAGUE_SHORT_TO_NAME[leagueShort] ?? leagueShort;
  return {
    id: "m-test",
    sport: "football",
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
    league: over.league ?? defaultLeague,
    leagueShort,
  };
}
