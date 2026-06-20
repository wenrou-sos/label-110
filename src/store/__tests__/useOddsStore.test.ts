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

  describe("odds history trajectory", () => {
    it("seeds exactly one real point per selection from the snapshot (no fabrication)", () => {
      const m = makeMatch({ id: "a" });
      useOddsStore.getState().setSnapshot([m], 1000);
      const hist = useOddsStore.getState().getOddsHistory("a", "1x2", "home");
      expect(hist).toHaveLength(1);
      expect(hist[0]).toEqual({ odds: 2.0, t: 1000 });
    });

    it("appends only the real updates it actually receives", () => {
      useOddsStore.getState().setSnapshot([makeMatch({ id: "a" })], 1000);
      useOddsStore.getState().applyOddsUpdate("a", "1x2", "home", 2.2, 2000);
      useOddsStore.getState().applyOddsUpdate("a", "1x2", "home", 1.9, 3000);
      const hist = useOddsStore.getState().getOddsHistory("a", "1x2", "home");
      expect(hist.map((p) => p.odds)).toEqual([2.0, 2.2, 1.9]);
      expect(hist.map((p) => p.t)).toEqual([1000, 2000, 3000]);
    });

    it("keeps every recorded point well beyond the old 60 cap", () => {
      useOddsStore.getState().setSnapshot([makeMatch({ id: "a" })], 0);
      for (let i = 1; i <= 80; i++) {
        useOddsStore.getState().applyOddsUpdate("a", "1x2", "home", 2 + i * 0.01, i * 1000);
      }
      const hist = useOddsStore.getState().getOddsHistory("a", "1x2", "home");
      expect(hist).toHaveLength(81);
      expect(hist[hist.length - 1].odds).toBe(2 + 80 * 0.01);
      expect(hist[0].odds).toBe(2.0);
    });

    it("never fabricates points before the first connection", () => {
      const m = makeMatch({ id: "a", status: "live", startTime: 1 });
      useOddsStore.getState().setSnapshot([m], 5000);
      const hist = useOddsStore.getState().getOddsHistory("a", "1x2", "home");
      expect(hist).toHaveLength(1);
      expect(hist[0].t).toBe(5000);
      expect(hist.every((p) => p.t >= 5000)).toBe(true);
    });

    it("preserves the real trajectory across a reconnect snapshot", () => {
      useOddsStore.getState().setSnapshot([makeMatch({ id: "a" })], 1000);
      useOddsStore.getState().applyOddsUpdate("a", "1x2", "home", 2.2, 2000);
      useOddsStore.getState().applyOddsUpdate("a", "1x2", "home", 1.9, 3000);

      const before = useOddsStore.getState().getOddsHistory("a", "1x2", "home");
      useOddsStore.getState().setSnapshot([makeMatch({ id: "a" })], 4000);
      const after = useOddsStore.getState().getOddsHistory("a", "1x2", "home");

      expect(after).toEqual(before);
      expect(after.map((p) => p.odds)).toEqual([2.0, 2.2, 1.9]);
    });

    it("reset clears the recorded trajectory", () => {
      useOddsStore.getState().setSnapshot([makeMatch({ id: "a" })], 1000);
      useOddsStore.getState().applyOddsUpdate("a", "1x2", "home", 2.2, 2000);
      useOddsStore.getState().reset();
      expect(useOddsStore.getState().getOddsHistory("a", "1x2", "home")).toEqual([]);
    });
  });
});
