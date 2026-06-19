import { describe, it, expect } from "vitest";
import { MockOddsEngine, MockWebSocket, type SocketOptions } from "@/services/mockSocket";
import type { Match, ServerMessage } from "@/types";
import { makeMatch } from "@/test/fixtures";

const FULL_OPTS: Required<SocketOptions> = {
  connectDelay: 0,
  oddsInterval: 1,
  distributionInterval: 1000,
  statusInterval: 1000,
  chaos: false,
  chaosEvery: 999999,
  chaosChance: 0,
  sharpDropProb: 0,
  riseProb: 0.2,
};

function smallSeed(): Match[] {
  return [makeMatch({ id: "s1" }), makeMatch({ id: "s2" })];
}

describe("MockOddsEngine", () => {
  it("returns an independent snapshot clone", () => {
    const engine = new MockOddsEngine(smallSeed());
    const snap = engine.snapshot();
    expect(snap).toHaveLength(2);
    snap[0].home.name = "CHANGED";
    expect(engine.matches[0].home.name).not.toBe("CHANGED");
  });

  it("produces odds updates within bounds", () => {
    const engine = new MockOddsEngine(smallSeed());
    const upd = engine.nextOddsUpdate(1000, FULL_OPTS);
    expect(upd).not.toBeNull();
    expect(upd!.odds).toBeGreaterThan(1);
    expect(upd!.odds).toBeLessThan(61);
    expect(upd!.matchId).toMatch(/s[12]/);
  });

  it("produces normalized distribution updates", () => {
    const engine = new MockOddsEngine(smallSeed());
    const upd = engine.nextDistribution();
    expect(upd).not.toBeNull();
    const d = upd!.distribution;
    const sum = d.home + d.draw + d.away;
    expect(sum).toBeCloseTo(1, 2);
  });
});

describe("MockWebSocket", () => {
  it("opens, sends a snapshot, then streams odds updates", async () => {
    const engine = new MockOddsEngine(smallSeed());
    const socket = new MockWebSocket(engine, {
      connectDelay: 0,
      oddsInterval: 5,
      distributionInterval: 30,
      statusInterval: 40,
      chaos: false,
    });
    const messages: ServerMessage[] = [];
    socket.onmessage = (ev) => messages.push(JSON.parse(ev.data));

    await new Promise((r) => setTimeout(r, 12));
    expect(socket.readyState).toBe(1);
    expect(messages.some((m) => m.type === "snapshot")).toBe(true);

    await new Promise((r) => setTimeout(r, 50));
    expect(messages.filter((m) => m.type === "odds_update").length).toBeGreaterThan(0);

    socket.close();
    expect(socket.readyState).toBe(3);
  });

  it("supports addEventListener listeners", async () => {
    const engine = new MockOddsEngine(smallSeed());
    const socket = new MockWebSocket(engine, { connectDelay: 0, oddsInterval: 4, chaos: false });
    let opened = false;
    socket.addEventListener("open", () => (opened = true));
    await new Promise((r) => setTimeout(r, 8));
    expect(opened).toBe(true);
    socket.close();
  });
});
