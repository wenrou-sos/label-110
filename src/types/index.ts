export type Sport = "football" | "basketball" | "tennis";
export type Status = "scheduled" | "live" | "finished";
export type MarketKey = "1x2" | "handicap" | "overUnder" | "cs" | "goals";
export type Trend = "up" | "down" | "stable";
export type DateBucket = "today" | "tomorrow";
export type ConnState = "connecting" | "open" | "closed" | "reconnecting" | "error";

export interface Team {
  name: string;
  short: string;
  logo: string;
  color: string;
}

export interface Score {
  home: number;
  away: number;
}

export interface Selection {
  key: string;
  label: string;
  odds: number;
  prevOdds: number;
  updatedAt: number;
  trend: Trend;
  line?: number;
}

export interface Market {
  key: MarketKey;
  label: string;
  selections: Selection[];
  line?: number;
}

export interface Distribution {
  home: number;
  draw: number;
  away: number;
}

export interface AnomalyEvent {
  matchId: string;
  market: MarketKey;
  selection: string;
  before: number;
  after: number;
  dropPct: number;
  detectedAt: number;
}

export interface Match {
  id: string;
  sport: Sport;
  league: string;
  leagueShort: string;
  home: Team;
  away: Team;
  startTime: number;
  status: Status;
  score: Score;
  markets: Market[];
  distribution: Distribution;
  betVolume: number;
  oddsChangeRate: number;
  anomalyCount: number;
  isHot: boolean;
  date: DateBucket;
}

export type ServerMessage =
  | { type: "snapshot"; matches: Match[]; serverTime: number }
  | {
      type: "odds_update";
      matchId: string;
      market: MarketKey;
      selection: string;
      odds: number;
      timestamp: number;
    }
  | {
      type: "distribution";
      matchId: string;
      distribution: Distribution;
    }
  | { type: "status"; matchId: string; status: Status; score: Score };

export interface SubscribeMessage {
  type: "subscribe";
  filters: { date: DateBucket; sports: Sport[]; league?: string };
}

export interface SportMeta {
  key: Sport;
  label: string;
  emoji: string;
}

export const SPORT_META: Record<Sport, SportMeta> = {
  football: { key: "football", label: "足球", emoji: "⚽" },
  basketball: { key: "basketball", label: "篮球", emoji: "🏀" },
  tennis: { key: "tennis", label: "网球", emoji: "🎾" },
};

export const MARKET_LABELS: Record<MarketKey, string> = {
  "1x2": "胜平负",
  handicap: "让球盘",
  overUnder: "大小球",
  cs: "波胆",
  goals: "总进球",
};
