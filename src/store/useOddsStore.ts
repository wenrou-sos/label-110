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
const notifiedAnomalies = new Map<string, number>();

export const HOT_TOP_N = 6;
const NOTIFICATION_COOLDOWN_MS = 30 * 1000;
const NOTIFICATION_PERMISSION_REQ = "default";

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

function pruneNotified(now: number): void {
  for (const [k, t] of notifiedAnomalies) {
    if (now - t > NOTIFICATION_COOLDOWN_MS) notifiedAnomalies.delete(k);
  }
}

function anomalyKey(matchId: string, market: MarketKey, selection: string) {
  return `${matchId}|${market}|${selection}`;
}

async function requestNotifyPermission(): Promise<NotificationPermission> {
  if (typeof Notification === "undefined") return NOTIFICATION_PERMISSION_REQ as NotificationPermission;
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

function sendAnomalyNotification(match: Match, ev: AnomalyEvent, marketLabel: string, selectionLabel: string): void {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const title = `⚠️ 赔率异常 · ${match.home.short} vs ${match.away.short}`;
  const body =
    `【${match.leagueShort}】${marketLabel} · ${selectionLabel}\n` +
    `赔率 ${ev.before.toFixed(2)} → ${ev.after.toFixed(2)}（↓${(ev.dropPct * 100).toFixed(0)}%）`;
  try {
    new Notification(title, { body, tag: anomalyKey(ev.matchId, ev.market, ev.selection) });
  } catch {
    /* ignore */
  }
}

interface OddsState {
  matches: Match[];
  connState: ConnState;
  anomalies: AnomalyEvent[];
  lastUpdated: number;
  reconnectAttempt: number;
  favorites: Set<string>;

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
  toggleFavorite: (matchId: string) => Promise<void>;
  reset: () => void;
}

export const useOddsStore = create<OddsState>((set, get) => ({
  matches: [],
  connState: "connecting",
  anomalies: [],
  lastUpdated: 0,
  reconnectAttempt: 0,
  favorites: new Set<string>(),

  setConnState: (s) => set({ connState: s }),
  setReconnectAttempt: (n) => set({ reconnectAttempt: n }),

  setSnapshot: (matches, now) => {
    tracker.clear();
    changeCounts.clear();
    notifiedAnomalies.clear();
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
    const state0 = get();
    const current = state0.matches.find((m) => m.id === matchId);
    const marketRef = current?.markets.find((mk) => mk.key === market);
    const selRef = marketRef?.selections.find((s) => s.key === selectionKey);
    const prevOdds = selRef ? selRef.odds : odds;
    const trend = odds > prevOdds ? "up" : odds < prevOdds ? "down" : "stable";

    const ev = tracker.record(matchId, market, selectionKey, odds, now);
    bumpChange(matchId);

    if (ev && current && state0.favorites.has(matchId)) {
      const k = anomalyKey(matchId, market, selectionKey);
      const lastT = notifiedAnomalies.get(k) ?? 0;
      if (now - lastT >= NOTIFICATION_COOLDOWN_MS) {
        notifiedAnomalies.set(k, now);
        const mk = current.markets.find((x) => x.key === market);
        const sel = mk?.selections.find((s) => s.key === selectionKey);
        sendAnomalyNotification(current, ev, mk?.label ?? market, sel?.label ?? selectionKey);
      }
    }

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
    pruneNotified(now);
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

  toggleFavorite: async (matchId) => {
    const next = new Set(get().favorites);
    const willAdd = !next.has(matchId);
    if (willAdd) {
      next.add(matchId);
    } else {
      next.delete(matchId);
    }
    set({ favorites: next });
    if (willAdd) {
      requestNotifyPermission();
    }
  },

  reset: () => {
    tracker.clear();
    changeCounts.clear();
    notifiedAnomalies.clear();
    set({
      matches: [],
      anomalies: [],
      connState: "connecting",
      lastUpdated: 0,
      favorites: new Set(),
    });
  },
}));
