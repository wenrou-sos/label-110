import type { Distribution, Match, ServerMessage } from "@/types";

const CONNECTING = 0;
const OPEN = 1;
const CLOSING = 2;
const CLOSED = 3;

export interface SocketOptions {
  connectDelay?: number;
  oddsInterval?: number;
  distributionInterval?: number;
  statusInterval?: number;
  chaos?: boolean;
  chaosEvery?: number;
  chaosChance?: number;
  sharpDropProb?: number;
  riseProb?: number;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const clamp01 = (v: number) => clamp(v, 0, 1);
const round2 = (v: number) => +v.toFixed(2);
const round3 = (v: number) => +v.toFixed(3);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class MockOddsEngine {
  matches: Match[];

  constructor(seed: Match[]) {
    this.matches = structuredClone(seed);
  }

  snapshot(): Match[] {
    return structuredClone(this.matches);
  }

  nextOddsUpdate(now: number, opts: Required<SocketOptions>): Extract<ServerMessage, { type: "odds_update" }> | null {
    const m = pick(this.matches);
    const mk = pick(m.markets);
    const sel = pick(mk.selections);
    const prev = sel.odds;
    const r = Math.random();
    let next: number;
    if (r < opts.sharpDropProb) {
      next = prev * (1 - (0.22 + Math.random() * 0.18));
    } else if (r < opts.sharpDropProb + opts.riseProb) {
      next = prev * (1 + (0.04 + Math.random() * 0.1));
    } else {
      next = prev * (1 + (Math.random() - 0.5) * 0.1);
    }
    next = clamp(next, 1.02, 60);
    sel.odds = round2(next);
    return {
      type: "odds_update",
      matchId: m.id,
      market: mk.key,
      selection: sel.key,
      odds: sel.odds,
      timestamp: now,
    };
  }

  nextDistribution(): Extract<ServerMessage, { type: "distribution" }> | null {
    const m = pick(this.matches);
    const d = m.distribution;
    const home = clamp01(d.home + (Math.random() - 0.5) * 0.1);
    const draw = m.sport === "football" ? clamp01(d.draw + (Math.random() - 0.5) * 0.06) : 0;
    const away = clamp01(1 - home - draw);
    const sum = home + draw + away || 1;
    const dist: Distribution = {
      home: round3(home / sum),
      draw: round3(draw / sum),
      away: round3(away / sum),
    };
    m.distribution = dist;
    return { type: "distribution", matchId: m.id, distribution: dist };
  }

  nextStatus(now: number): Extract<ServerMessage, { type: "status" }> | null {
    const live = this.matches.filter((m) => m.status === "live");
    if (live.length && Math.random() < 0.35) {
      const m = pick(live);
      if (Math.random() < 0.5) m.score = { home: m.score.home + 1, away: m.score.away };
      else m.score = { home: m.score.home, away: m.score.away + 1 };
      return { type: "status", matchId: m.id, status: "live", score: { ...m.score } };
    }
    const due = this.matches.filter((m) => m.status === "scheduled" && m.startTime <= now);
    if (due.length && Math.random() < 0.5) {
      const m = pick(due);
      m.status = "live";
      m.score = { home: 0, away: 0 };
      return { type: "status", matchId: m.id, status: "live", score: { ...m.score } };
    }
    return null;
  }
}

type EventListener = (ev: { data?: string }) => void;

export class MockWebSocket {
  static CONNECTING = CONNECTING;
  static OPEN = OPEN;
  static CLOSING = CLOSING;
  static CLOSED = CLOSED;

  readyState: number = CONNECTING;
  binaryType: "blob" | "arraybuffer" = "blob";
  onopen: ((ev: Event) => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onclose: ((ev: Event) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;

  private listeners = new Map<string, Set<EventListener>>();
  private timers: ReturnType<typeof setInterval | typeof setTimeout>[] = [];
  private closedByUser = false;
  private opts: Required<SocketOptions>;

  constructor(
    private engine: MockOddsEngine,
    options: SocketOptions = {},
  ) {
    this.opts = {
      connectDelay: options.connectDelay ?? 500,
      oddsInterval: options.oddsInterval ?? 900,
      distributionInterval: options.distributionInterval ?? 2800,
      statusInterval: options.statusInterval ?? 4000,
      chaos: options.chaos ?? true,
      chaosEvery: options.chaosEvery ?? 22000,
      chaosChance: options.chaosChance ?? 0.12,
      sharpDropProb: options.sharpDropProb ?? 0.05,
      riseProb: options.riseProb ?? 0.15,
    };
    this.timers.push(setTimeout(() => this._open(), this.opts.connectDelay));
  }

  private _open(): void {
    if (this.closedByUser) return;
    this.readyState = OPEN;
    this.dispatchEvent("open");
    this.emit({ type: "snapshot", matches: this.engine.snapshot(), serverTime: Date.now() });
    this.timers.push(
      setInterval(() => {
        const upd = this.engine.nextOddsUpdate(Date.now(), this.opts);
        if (upd) this.emit(upd);
      }, this.opts.oddsInterval),
    );
    this.timers.push(
      setInterval(() => {
        const upd = this.engine.nextDistribution();
        if (upd) this.emit(upd);
      }, this.opts.distributionInterval),
    );
    this.timers.push(
      setInterval(() => {
        const upd = this.engine.nextStatus(Date.now());
        if (upd) this.emit(upd);
      }, this.opts.statusInterval),
    );
    if (this.opts.chaos) {
      this.timers.push(
        setInterval(() => {
          if (Math.random() < this.opts.chaosChance) this._drop();
        }, this.opts.chaosEvery),
      );
    }
  }

  private _drop(): void {
    if (this.readyState !== OPEN) return;
    this.readyState = CLOSED;
    this._clearTimers();
    this.dispatchEvent("close");
  }

  private emit(message: ServerMessage): void {
    if (this.readyState !== OPEN) return;
    const data = JSON.stringify(message);
    this.dispatchEvent("message", { data });
  }

  private _clearTimers(): void {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
  }

  send(_data: string): void {
  }

  close(): void {
    this.closedByUser = true;
    this.readyState = CLOSED;
    this._clearTimers();
    this.dispatchEvent("close");
  }

  addEventListener(type: string, listener: EventListener): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this.listeners.get(type)?.delete(listener);
  }

  private dispatchEvent(type: "open" | "message" | "close" | "error", ev: { data?: string } = {}): void {
    if (type === "open") this.onopen?.call(this, ev as unknown as Event);
    else if (type === "message") this.onmessage?.call(this, ev as { data: string });
    else if (type === "close") this.onclose?.call(this, ev as unknown as Event);
    else if (type === "error") this.onerror?.call(this, ev as unknown as Event);
    this.listeners.get(type)?.forEach((l) => l(ev));
  }
}

let sharedEngine: MockOddsEngine | null = null;

export function getEngine(seed: Match[]): MockOddsEngine {
  if (!sharedEngine) sharedEngine = new MockOddsEngine(seed);
  return sharedEngine;
}

export function createMockSocket(seed: Match[], options?: SocketOptions): MockWebSocket {
  return new MockWebSocket(getEngine(seed), options);
}

export function __resetEngine(): void {
  sharedEngine = null;
}
