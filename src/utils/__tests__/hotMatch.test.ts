import { describe, it, expect } from "vitest";
import { computeHotScore, markHotMatches } from "@/utils/hotMatch";
import { makeMatch } from "@/test/fixtures";

describe("hot match utils", () => {
  it("scores matches higher when live and high volume", () => {
    const live = makeMatch({ id: "a", betVolume: 900, status: "live", anomalyCount: 2 });
    const dull = makeMatch({ id: "b", betVolume: 100, status: "scheduled", anomalyCount: 0 });
    expect(computeHotScore(live)).toBeGreaterThan(computeHotScore(dull));
  });

  it("marks only the top N as hot", () => {
    const matches = [
      makeMatch({ id: "a", betVolume: 100, oddsChangeRate: 1, anomalyCount: 0 }),
      makeMatch({ id: "b", betVolume: 900, oddsChangeRate: 1, anomalyCount: 0, status: "live" }),
      makeMatch({ id: "c", betVolume: 500, oddsChangeRate: 1, anomalyCount: 0 }),
    ];
    const out = markHotMatches(matches, 1);
    expect(out.find((m) => m.id === "b")!.isHot).toBe(true);
    expect(out.filter((m) => m.isHot).length).toBe(1);
  });

  it("returns empty array unchanged", () => {
    expect(markHotMatches([], 5)).toEqual([]);
  });
});
