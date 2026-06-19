import type { Match } from "@/types";

export interface HotWeights {
  volume: number;
  changeRate: number;
  anomaly: number;
  live: number;
}

export const DEFAULT_HOT_WEIGHTS: HotWeights = {
  volume: 0.35,
  changeRate: 0.3,
  anomaly: 0.25,
  live: 0.1,
};

function minMax(values: number[]): { min: number; max: number } {
  if (values.length === 0) return { min: 0, max: 0 };
  let min = values[0];
  let max = values[0];
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { min, max };
}

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

export function computeHotScore(match: Match, weights: HotWeights = DEFAULT_HOT_WEIGHTS): number {
  const liveBonus = match.status === "live" ? 1 : 0;
  const score =
    match.betVolume * weights.volume +
    match.oddsChangeRate * weights.changeRate +
    match.anomalyCount * weights.anomaly +
    liveBonus * weights.live;
  return score;
}

export function markHotMatches(
  matches: Match[],
  topN: number = 6,
  weights: HotWeights = DEFAULT_HOT_WEIGHTS,
): Match[] {
  if (matches.length === 0) return matches;

  const volumes = matches.map((m) => m.betVolume);
  const rates = matches.map((m) => m.oddsChangeRate);
  const anomalies = matches.map((m) => m.anomalyCount);
  const v = minMax(volumes);
  const r = minMax(rates);
  const a = minMax(anomalies);

  const scored = matches.map((m) => {
    const norm =
      normalize(m.betVolume, v.min, v.max) * weights.volume +
      normalize(m.oddsChangeRate, r.min, r.max) * weights.changeRate +
      normalize(m.anomalyCount, a.min, a.max) * weights.anomaly +
      (m.status === "live" ? 1 : 0) * weights.live;
    return { match: m, score: norm };
  });

  const thresholdScore = scored
    .map((s) => s.score)
    .sort((x, y) => y - x)[Math.min(topN - 1, scored.length - 1)] ?? 0;

  return matches.map((m) => {
    const entry = scored.find((s) => s.match.id === m.id)!;
    const isHot = entry.score >= thresholdScore && thresholdScore > 0;
    return { ...m, isHot };
  });
}
