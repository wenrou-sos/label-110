import { create } from "zustand";
import type {
  AnomalyEvent,
  ConnState,
  Distribution,
  MarketKey,
  Match,
  Score,
  Status,
} from "@/types";
import { AnomalyTracker } from "@/utils/anomaly";
import { markHotMatches } from "@/utils/hotMatch";

const tracker = new AnomalyTracker();
const changeCounts = new Map<string, number>();

export const HOT_TOP_N = 6;

function bumpChange(matchId: string): void {
  changeCounts.set(matchId, (changeCounts.get(matchId) ?? 0) + 1);
}

function decayChanges(): void {
  for (const [id, v] of changeCounts) {
    const next = Math.floor(v / 2);
    if (next <= 0) changeCounts.delete(id);
    else changeCounts.set(id, next);
  }
}

interface OddsState {
  matches: Match[];
  connState: ConnState;
  anomalies: AnomalyEvent[];
  lastUpdated: number;
  reconnectAttempt: number;

  setConnState: (s: ConnState) => void;
  setReconnectAttempt: (n: number) => void;
  setSnapshot: (matches: Match[], now: number) => void;
  applyOddsUpdate: (
    matchId: string,
    market: MarketKey,
    selectionKey: string,
    odds: number,
    now: number,
  ) => void;
  applyDistribution: (matchId: string, dist: Distribution) => void;
  applyStatus: (matchId: string, status: Status, score: Score) => void;
  tickHot: (now: number) => void;
  reset: () => void;
}

export const useOddsStore = create<OddsState>((set, get) => ({
  matches: [],
  connState: "connecting",
  anomalies: [],
  lastUpdated: 0,
  reconnectAttempt: 0,

  setConnState: (s) => set({ connState: s }),
  setReconnectAttempt: (n) => set({ reconnectAttempt: n }),

  setSnapshot: (matches, now) => {
    tracker.clear();
    changeCounts.clear();
    for (const m of matches) {
      for (const mk of m.markets) {
        for (const sel of mk.selections) {
          tracker.seed(m.id, mk.key, sel.key, sel.odds, now);
        }
      }
    }
    set({
      matches: markHotMatches(matches, HOT_TOP_N),
      anomalies: [],
      lastUpdated: now,
      connState: "open",
      reconnectAttempt: 0,
    });
  },

  applyOddsUpdate: (matchId, market, selectionKey, odds, now) => {
    const current = get().matches.find((m) => m.id === matchId);
    const marketRef = current?.markets.find((mk) => mk.key === market);
    const selRef = marketRef?.selections.find((s) => s.key === selectionKey);
    const prevOdds = selRef ? selRef.odds : odds;
    const trend = odds > prevOdds ? "up" : odds < prevOdds ? "down" : "stable";

    tracker.record(matchId, market, selectionKey, odds, now);
    bumpChange(matchId);

    set((state) => ({
      lastUpdated: now,
      matches: state.matches.map((m) =>
        m.id !== matchId
          ? m
          : {
              ...m,
              markets: m.markets.map((mk) =>
                mk.key !== market
                  ? mk
                  : {
                      ...mk,
                      selections: mk.selections.map((sel) =>
                        sel.key !== selectionKey
                          ? sel
                          : { ...sel, prevOdds, odds, trend, updatedAt: now },
                      ),
                    },
              ),
              anomalyCount: tracker.count(matchId),
            },
      ),
      anomalies: tracker.list(),
    }));
  },

  applyDistribution: (matchId, dist) =>
    set((state) => ({
      matches: state.matches.map((m) =>
        m.id !== matchId
          ? m
          : {
              ...m,
              distribution: dist,
              betVolume: Math.max(
                2000,
                m.betVolume + Math.floor((Math.random() - 0.4) * 2500),
              ),
            },
      ),
    })),

  applyStatus: (matchId, status, score) =>
    set((state) => ({
      matches: state.matches.map((m) =>
        m.id !== matchId ? m : { ...m, status, score },
      ),
    })),

  tickHot: (now) => {
    tracker.prune(now);
    set((state) => {
      const refreshed = state.matches.map((m) => ({
        ...m,
        oddsChangeRate: changeCounts.get(m.id) ?? 0,
        anomalyCount: tracker.count(m.id),
      }));
      decayChanges();
      return {
        matches: markHotMatches(refreshed, HOT_TOP_N),
        anomalies: tracker.list(),
      };
    });
  },

  reset: () => {
    tracker.clear();
    changeCounts.clear();
    set({ matches: [], anomalies: [], connState: "connecting", lastUpdated: 0 });
  },
}));
