import { describe, it, expect } from "vitest";
import {
  ANOMALY_THRESHOLD,
  AnomalyTracker,
  computeDropPct,
  isAnomalous,
} from "@/utils/anomaly";

describe("anomaly utils", () => {
  it("computes drop percentage", () => {
    expect(computeDropPct(2.0, 1.5)).toBeCloseTo(0.25, 5);
    expect(computeDropPct(0, 1)).toBe(0);
  });

  it("detects anomalous drops at threshold", () => {
    expect(isAnomalous(2.0, 1.5)).toBe(true);
    expect(isAnomalous(2.0, 1.7)).toBe(false);
    expect(ANOMALY_THRESHOLD).toBe(0.2);
  });

  it("tracks and reports anomalies over a window", () => {
    const tracker = new AnomalyTracker(60000, 0.2);
    expect(tracker.record("m1", "1x2", "home", 3.0, 1000)).toBeNull();
    expect(tracker.record("m1", "1x2", "home", 2.9, 2000)).toBeNull();
    const ev = tracker.record("m1", "1x2", "home", 2.2, 3000);
    expect(ev).not.toBeNull();
    expect(ev!.dropPct).toBeGreaterThan(0.2);
    expect(tracker.has("m1", "1x2", "home")).toBe(true);
    expect(tracker.count("m1")).toBe(1);
    expect(tracker.size()).toBe(1);
  });

  it("prunes events outside the window", () => {
    const tracker = new AnomalyTracker(60000, 0.2);
    tracker.record("m1", "1x2", "home", 3.0, 1000);
    tracker.record("m1", "1x2", "home", 2.0, 2000);
    expect(tracker.has("m1", "1x2", "home")).toBe(true);
    tracker.prune(70000);
    expect(tracker.has("m1", "1x2", "home")).toBe(false);
  });

  it("isolates anomalies by selection key", () => {
    const tracker = new AnomalyTracker(60000, 0.2);
    tracker.record("m1", "1x2", "home", 3.0, 1000);
    tracker.record("m1", "1x2", "home", 2.0, 2000);
    expect(tracker.has("m1", "1x2", "away")).toBe(false);
    expect(tracker.has("m2", "1x2", "home")).toBe(false);
  });
});
