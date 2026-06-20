import { Inbox } from "lucide-react";
import type { Match } from "@/types";
import { useVirtualList } from "@/hooks/useVirtualList";
import { MatchCard } from "@/components/MatchCard";

interface Props {
  matches: Match[];
  itemHeight: number;
  onOpenDetail?: (match: Match) => void;
}

export function MatchList({ matches, itemHeight, onOpenDetail }: Props) {
  const { containerRef, range } = useVirtualList({
    itemCount: matches.length,
    itemHeight,
    overscan: 4,
  });

  if (matches.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full border border-line bg-raised text-ink-faint">
          <Inbox size={26} />
        </span>
        <p className="font-display text-[14px] font-600 uppercase tracking-wide text-ink-muted">
          未找到匹配赛事
        </p>
        <p className="text-[12px] text-ink-faint">尝试调整筛选条件或切换日期</p>
      </div>
    );
  }

  const visible = matches.slice(range.startIndex, range.endIndex + 1);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3"
      role="list"
      aria-label="赛事列表"
      tabIndex={0}
    >
      <div style={{ height: range.totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${range.offsetY}px)` }}>
          {visible.map((m) => (
            <div key={m.id} style={{ height: itemHeight }} role="listitem" className="pb-2.5">
              <MatchCard match={m} onOpenDetail={onOpenDetail ? () => onOpenDetail(m) : undefined} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
