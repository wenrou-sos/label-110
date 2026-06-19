import type { Market } from "@/types";
import { MARKET_LABELS } from "@/types";
import { OddsCell } from "@/components/OddsCell";

interface Props {
  markets: Market[];
  anomalyKeys: Set<string>;
}

export function OddsGrid({ markets, anomalyKeys }: Props) {
  return (
    <div
      className="flex gap-2 overflow-x-auto scrollbar-thin pb-1"
      role="group"
      aria-label="赔率选项"
    >
      {markets.map((mk) => (
        <div
          key={mk.key}
          className="shrink-0 rounded-lg border border-line bg-night/40 p-1.5"
        >
          <div className="flex items-center gap-1 px-0.5 pb-1">
            <span className="font-display text-[10px] font-600 uppercase tracking-wide text-ink-muted">
              {MARKET_LABELS[mk.key]}
            </span>
            {mk.line != null && (
              <span className="font-mono text-[9px] text-cyan">{mk.line}</span>
            )}
          </div>
          <div className="flex gap-1">
            {mk.selections.map((sel) => (
              <OddsCell
                key={sel.key}
                selection={sel}
                isAnomaly={anomalyKeys.has(`${mk.key}:${sel.key}`)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
