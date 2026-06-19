import { ArrowDown, ArrowUp } from "lucide-react";
import type { Selection } from "@/types";
import { formatOdds } from "@/utils/format";
import { cn } from "@/lib/utils";

interface Props {
  selection: Selection;
  isAnomaly?: boolean;
  compact?: boolean;
}

export function OddsCell({ selection, isAnomaly, compact }: Props) {
  const { odds, prevOdds, trend, updatedAt, label, line } = selection;
  const moved = trend !== "stable" && prevOdds !== odds;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border px-2 py-1.5 transition-colors",
        "border-line bg-elevated/60 hover:border-amber/50 hover:bg-raised",
        isAnomaly && "border-hot-anomaly/60 bg-hot-anomaly/10",
        compact ? "min-w-[58px]" : "min-w-[66px]",
      )}
      role="group"
      aria-label={`${label} 赔率 ${formatOdds(odds)}`}
    >
      {moved && (
        <span
          key={updatedAt}
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 rounded-md",
            trend === "down" ? "animate-flash-down" : "animate-flash-up",
          )}
        />
      )}

      <div className="relative flex items-center justify-between gap-1">
        <span
          className={cn(
            "font-sans font-600 uppercase tracking-wide text-ink-muted truncate",
            compact ? "text-[9px]" : "text-[10px]",
          )}
        >
          {label}
          {line != null && (
            <span className="ml-0.5 text-ink-faint">
              {line > 0 ? `+${line}` : line}
            </span>
          )}
        </span>
        {moved && (
          <span
            aria-hidden="true"
            className={trend === "down" ? "text-hot-up" : "text-hot-down"}
          >
            {trend === "down" ? <ArrowDown size={10} /> : <ArrowUp size={10} />}
          </span>
        )}
      </div>

      <div
        className={cn(
          "relative font-mono font-600 tabular-nums leading-tight",
          compact ? "text-sm" : "text-[15px]",
          trend === "down" ? "text-hot-up" : trend === "up" ? "text-hot-down" : "text-ink",
        )}
        aria-live="polite"
      >
        {formatOdds(odds)}
      </div>
    </div>
  );
}
