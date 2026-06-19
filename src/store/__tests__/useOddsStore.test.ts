import { describe, it, expect, beforeEach } from "vitest";
import { useOddsStore } from "@/store/useOddsStore";
import { makeMatch } from "@/test/fixtures";

beforeEach(() => {
  useOddsStore.getState().reset();
});

describe("useOddsStore", () => {
  it("setSnapshot marks hot matches and opens connection", () => {
    const m = makeMatch({ id: "a", betVolume: 900, status: "live" });
    useOddsStore.getState().setSnapshot([m], 1000);
    const s = useOddsStore.getState();
    expect(s.matches).toHaveLength(1);
    expect(s.matches[0].isHot).toBe(true);
    expect(s.connState).toBe("open");
  });

  it("applyOddsUpdate updates odds, prevOdds and trend", () => {
    useOddsStore.getState().setSnapshot([makeMatch({ id: "a" })], 1000);
    useOddsStore.getState().applyOddsUpdate("a", "1x2", "home", 2.4, 2000);
    const sel = useOddsStore.getState().matches[0].markets[0].selections[0];
    expect(sel.odds).toBe(2.4);
    expect(sel.prevOdds).toBe(2.0);
    expect(sel.trend).toBe("up");
  });

  it("flags an anomaly on a sharp drop", () => {
    useOddsStore.getState().setSnapshot([makeMatch({ id: "a" })], 1000);
    useOddsStore.getState().applyOddsUpdate("a", "1x2", "home", 1.5, 2000);
    const s = useOddsStore.getState();
    expect(s.matches[0].anomalyCount).toBe(1);
    expect(s.anomalies).toHaveLength(1);
    expect(s.anomalies[0].dropPct).toBeGreaterThan(0.2);
  });

  it("applyDistribution updates the distribution", () => {
    useOddsStore.getState().setSnapshot([makeMatch({ id: "a" })], 1000);
    useOddsStore.getState().applyDistribution("a", { home: 0.6, draw: 0.1, away: 0.3 });
    expect(useOddsStore.getState().matches[0].distribution.home).toBe(0.6);
  });

  it("applyStatus updates status and score", () => {
    useOddsStore.getState().setSnapshot([makeMatch({ id: "a" })], 1000);
    useOddsStore.getState().applyStatus("a", "live", { home: 1, away: 0 });
    const mm = useOddsStore.getState().matches[0];
    expect(mm.status).toBe("live");
    expect(mm.score.home).toBe(1);
  });

  it("tickHot keeps anomalies within the window and prunes afterwards", () => {
    useOddsStore.getState().setSnapshot([makeMatch({ id: "a", betVolume: 900, status: "live" })], 1000);
    useOddsStore.getState().applyOddsUpdate("a", "1x2", "home", 1.5, 2000);
    useOddsStore.getState().tickHot(10000);
    expect(useOddsStore.getState().matches[0].anomalyCount).toBe(1);
    useOddsStore.getState().tickHot(400000);
    expect(useOddsStore.getState().matches[0].anomalyCount).toBe(0);
  });
});
