import { describe, it, expect } from "vitest";
import { formatClock, formatOdds, formatPercent, formatSignedPercent, formatTime, countdownTo } from "@/utils/format";

describe("format utils", () => {
  it("formats time as HH:MM", () => {
    const ts = new Date(2026, 5, 19, 9, 5).getTime();
    expect(formatTime(ts)).toBe("09:05");
  });

  it("formats clock as HH:MM:SS", () => {
    const ts = new Date(2026, 5, 19, 14, 7, 9).getTime();
    expect(formatClock(ts)).toBe("14:07:09");
  });

  it("formats odds to 2 decimals", () => {
    expect(formatOdds(2.1)).toBe("2.10");
    expect(formatOdds(1.005)).toBe("1.01");
    expect(formatOdds(NaN)).toBe("—");
  });

  it("formats percent", () => {
    expect(formatPercent(0.5)).toBe("50.0%");
    expect(formatPercent(0.234, 0)).toBe("23%");
  });

  it("formats signed percent", () => {
    expect(formatSignedPercent(0.12)).toBe("+12.0%");
    expect(formatSignedPercent(-0.05)).toBe("-5.0%");
  });

  it("countdown to future time", () => {
    const now = new Date(2026, 5, 19, 12, 0, 0).getTime();
    expect(countdownTo(now + 5 * 60000, now)).toBe("5分钟后");
    expect(countdownTo(now + 70 * 60000, now)).toBe("1时10分后");
    expect(countdownTo(now - 1000, now)).toBe("进行中");
  });
});
