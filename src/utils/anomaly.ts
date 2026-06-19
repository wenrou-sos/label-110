import type { AnomalyEvent, MarketKey } from "@/types";

export const ANOMALY_WINDOW_MS = 5 * 60 * 1000;
export const ANOMALY_THRESHOLD = 0.2;

export function computeDropPct(before: number, after: number): number {
  if (before <= 0) return 0;
  return (before - after) / before;
}

export function isAnomalous(
  before: number,
  after: number,
  threshold: number = ANOMALY_THRESHOLD,
): boolean {
  return before > 0 && after > 0 && computeDropPct(before, after) >= threshold;
}

interface Record {
  odds: number;
  t: number;
}

const k = (matchId: string, market: MarketKey, selection: string) =>
  `${matchId}|${market}|${selection}`;

export class AnomalyTracker {
  private history = new Map<string, Record[]>();
  private events = new Map<string, AnomalyEvent>();

  constructor(
    private windowMs: number = ANOMALY_WINDOW_MS,
    private threshold: number = ANOMALY_THRESHOLD,
  ) {}

  record(
    matchId: string,
    market: MarketKey,
    selection: string,
    odds: number,
    now: number,
  ): AnomalyEvent | null {
    const key = k(matchId, market, selection);
    const raw = this.history.get(key) ?? [];
    const windowed = raw.filter((r) => now - r.t <= this.windowMs);
    const before = windowed.length ? Math.max(...windowed.map((r) => r.odds)) : odds;
    windowed.push({ odds, t: now });
    this.history.set(key, windowed);

    const dropPct = computeDropPct(before, odds);
    if (windowed.length > 1 && before > 0 && dropPct >= this.threshold) {
      const ev: AnomalyEvent = {
        matchId,
        market,
        selection,
        before,
        after: odds,
        dropPct,
        detectedAt: now,
      };
      this.events.set(key, ev);
      return ev;
    }
    return null;
  }

  seed(
    matchId: string,
    market: MarketKey,
    selection: string,
    odds: number,
    now: number,
  ): void {
    const key = k(matchId, market, selection);
    this.history.set(key, [{ odds, t: now }]);
  }

  prune(now: number): void {
    for (const [key, ev] of this.events) {
      if (now - ev.detectedAt > this.windowMs) {
        this.events.delete(key);
        this.history.delete(key);
      }
    }
  }

  get(
    matchId: string,
    market: MarketKey,
    selection: string,
  ): AnomalyEvent | undefined {
    return this.events.get(k(matchId, market, selection));
  }

  has(matchId: string, market: MarketKey, selection: string): boolean {
    return this.events.has(k(matchId, market, selection));
  }

  count(matchId: string): number {
    let n = 0;
    for (const ev of this.events.values()) if (ev.matchId === matchId) n++;
    return n;
  }

  list(): AnomalyEvent[] {
    return Array.from(this.events.values());
  }

  size(): number {
    return this.events.size;
  }

  clear(): void {
    this.history.clear();
    this.events.clear();
  }
}
