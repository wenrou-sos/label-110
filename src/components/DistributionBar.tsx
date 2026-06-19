import { useState } from "react";
import type { Distribution, Sport } from "@/types";
import { formatPercent } from "@/utils/format";
import { cn } from "@/lib/utils";

interface Props {
  distribution: Distribution;
  sport: Sport;
  className?: string;
}

const SEGMENTS = [
  { key: "home", label: "主胜", color: "#F5B614" },
  { key: "draw", label: "平局", color: "#64748B" },
  { key: "away", label: "客胜", color: "#22D3EE" },
] as const;

export function DistributionBar({ distribution, sport, className }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const segments = SEGMENTS.filter((s) => (s.key === "draw" ? sport === "football" : true));

  return (
    <div className={cn("flex flex-col gap-2", className)} role="group" aria-label="投注资金分布">
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-raised ring-1 ring-inset ring-line">
        {segments.map((s) => {
          const value = distribution[s.key];
          const active = hovered === null || hovered === s.key;
          return (
            <div
              key={s.key}
              className="absolute top-0 h-full transition-all duration-300"
              style={{
                left: `${leftOffset(distribution, s.key, sport)}%`,
                width: `${Math.max(value * 100, value > 0 ? 1.5 : 0)}%`,
                backgroundColor: s.color,
                opacity: active ? 1 : 0.35,
                boxShadow: hovered === s.key ? `0 0 12px -1px ${s.color}` : "none",
              }}
              role="meter"
              aria-valuenow={Math.round(value * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${s.label} ${formatPercent(value)}`}
              onMouseEnter={() => setHovered(s.key)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
        {hovered && (
          <div
            className="pointer-events-none absolute -top-7 z-10 -translate-x-1/2 whitespace-nowrap rounded border border-line bg-night/95 px-1.5 py-0.5 font-mono text-[10px] text-ink shadow-card"
            style={{ left: `${tooltipPos(distribution, hovered, sport)}%` }}
          >
            {SEGMENTS.find((s) => s.key === hovered)?.label}{" "}
            {formatPercent(distribution[hovered as keyof Distribution])}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1">
        {SEGMENTS.map((s) => {
          if (s.key === "draw" && sport !== "football") {
            return <div key={s.key} className="text-[9px] text-ink-faint">—</div>;
          }
          const value = distribution[s.key];
          const active = hovered === null || hovered === s.key;
          return (
            <div
              key={s.key}
              className={cn(
                "flex items-center gap-1 rounded px-1 py-0.5 transition-opacity",
                !active && "opacity-40",
              )}
              onMouseEnter={() => setHovered(s.key)}
              onMouseLeave={() => setHovered(null)}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-[9px] uppercase text-ink-muted">{s.label}</span>
              <span className="ml-auto font-mono text-[10px] font-600 text-ink">
                {formatPercent(value, 0)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function leftOffset(d: Distribution, key: keyof Distribution, sport: Sport): number {
  if (key === "home") return 0;
  if (key === "draw") return d.home * 100;
  const draw = sport === "football" ? d.draw : 0;
  return (d.home + draw) * 100;
}

function tooltipPos(d: Distribution, key: string, sport: Sport): number {
  const start = leftOffset(d, key as keyof Distribution, sport);
  const value = d[key as keyof Distribution];
  return Math.min(92, Math.max(8, start + value * 50));
}
