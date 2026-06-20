import { useMemo } from "react";
import { X, Trash2, GitCompare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Match, MarketKey } from "@/types";
import { SPORT_META, MARKET_LABELS } from "@/types";
import { useOddsStore } from "@/store/useOddsStore";
import { formatTime, formatOdds } from "@/utils/format";
import { TeamLogo } from "@/components/TeamLogo";
import { StatusBadge } from "@/components/Badges";
import { cn } from "@/lib/utils";

const COMPARE_MARKETS: MarketKey[] = ["1x2", "handicap", "overUnder"];

function MarketRow({
  marketKey,
  matches,
}: {
  marketKey: MarketKey;
  matches: Match[];
}) {
  const markets = matches.map((m) => m.markets.find((mk) => mk.key === marketKey));
  const hasMarket = markets.some(Boolean);

  const allKeys = useMemo(() => {
    const keys: string[] = [];
    for (const mk of markets) {
      if (!mk) continue;
      for (const sel of mk.selections) {
        if (!keys.includes(sel.key)) keys.push(sel.key);
      }
    }
    return keys;
  }, [markets]);

  if (!hasMarket) return null;

  const labelOf = (key: string) => {
    for (const mk of markets) {
      if (!mk) continue;
      const s = mk.selections.find((s) => s.key === key);
      if (s) return s.label;
    }
    return key;
  };

  const firstMarketWithLine = markets.find((mk) => mk?.line != null);

  return (
    <div className="rounded-lg border border-line bg-elevated/40">
      <div className="border-b border-line/60 px-3 py-2">
        <span className="font-display text-[11px] font-600 uppercase tracking-wide text-ink-muted">
          {MARKET_LABELS[marketKey] ?? marketKey}
          {firstMarketWithLine?.line != null && (
            <span className="ml-1.5 text-cyan">· {firstMarketWithLine.line}</span>
          )}
        </span>
      </div>
      <div className="grid gap-1 p-2" style={{ gridTemplateColumns: `repeat(${matches.length}, 1fr)` }}>
        {matches.map((m, mi) => {
          const mk = markets[mi];
          return (
            <div key={m.id} className="space-y-1">
              {allKeys.map((key) => {
                const sel = mk?.selections.find((s) => s.key === key);
                return (
                  <div
                    key={key}
                    className={cn(
                      "rounded-md border px-2 py-1",
                      sel
                        ? "border-line/60 bg-surface"
                        : "border-dashed border-line/30 bg-transparent opacity-40",
                    )}
                  >
                    <div className="text-[9px] font-500 uppercase tracking-wide text-ink-faint">
                      {labelOf(key)}
                      {sel?.line != null && (
                        <span className="ml-0.5 text-ink-faint">
                          {sel.line > 0 ? `+${sel.line}` : sel.line}
                        </span>
                      )}
                    </div>
                    <div
                      className={cn(
                        "font-mono text-sm font-600 tabular-nums",
                        sel?.trend === "down"
                          ? "text-hot-up"
                          : sel?.trend === "up"
                            ? "text-hot-down"
                            : "text-ink",
                      )}
                    >
                      {sel ? formatOdds(sel.odds) : "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompareCard({ match, onRemove }: { match: Match; onRemove: () => void }) {
  const { home, away, score, status, startTime, sport, leagueShort } = match;
  const showScore = status === "live" || status === "finished";
  const meta = SPORT_META[sport];

  return (
    <div className="relative rounded-lg border border-line bg-elevated/50 p-3">
      <button
        type="button"
        onClick={onRemove}
        aria-label="移除对比"
        className="focus-ring absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-md text-ink-faint transition-colors hover:bg-raised hover:text-ink"
      >
        <X size={12} strokeWidth={2} />
      </button>

      <div className="mb-1 flex items-center gap-1.5">
        <span className="chip border border-line bg-raised text-ink-muted text-[10px]">
          <span aria-hidden="true">{meta.emoji}</span>
          {leagueShort}
        </span>
        <StatusBadge status={status} />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <TeamLogo team={home} size={18} />
          <span className="truncate font-display text-[12px] font-500 text-ink">
            {home.short}
          </span>
        </div>
        {showScore ? (
          <span className="font-mono text-[14px] font-700 tabular-nums text-amber">
            {score.home}
          </span>
        ) : null}
      </div>

      <div className="mt-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <TeamLogo team={away} size={18} />
          <span className="truncate font-display text-[12px] font-500 text-ink">
            {away.short}
          </span>
        </div>
        {showScore ? (
          <span className="font-mono text-[14px] font-700 tabular-nums text-amber">
            {score.away}
          </span>
        ) : (
          <span className="font-mono text-[11px] tabular-nums text-cyan">
            {formatTime(startTime)}
          </span>
        )}
      </div>
    </div>
  );
}

export function ComparePanel() {
  const isOpen = useOddsStore((s) => s.isComparePanelOpen);
  const comparisonIds = useOddsStore((s) => s.comparisonIds);
  const matches = useOddsStore((s) => s.matches);
  const toggleComparison = useOddsStore((s) => s.toggleComparison);
  const clearComparison = useOddsStore((s) => s.clearComparison);
  const setComparePanelOpen = useOddsStore((s) => s.setComparePanelOpen);

  const compareMatches = useMemo(
    () =>
      [...comparisonIds]
        .map((id) => matches.find((m) => m.id === id))
        .filter((m): m is Match => Boolean(m)),
    [comparisonIds, matches],
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="fixed right-0 top-0 z-40 flex h-full w-full max-w-md flex-col border-l border-line bg-surface shadow-2xl"
        role="dialog"
        aria-modal="false"
        aria-label="比赛对比面板"
      >
        <header className="flex shrink-0 items-center gap-2 border-b border-line bg-elevated/60 px-4 py-3">
          <div className="flex items-center gap-2 text-ink">
            <GitCompare size={16} className="text-cyan" strokeWidth={2} />
            <h2 className="font-display text-[13px] font-700 uppercase tracking-wide">
              比赛对比
            </h2>
            <span className="chip border border-line bg-raised text-ink-muted text-[10px]">
              {compareMatches.length} 场
            </span>
          </div>

          <div className="ml-auto flex items-center gap-1">
            {compareMatches.length > 0 && (
              <button
                type="button"
                onClick={clearComparison}
                className="focus-ring flex items-center gap-1 rounded-md border border-line bg-raised px-2 py-1 text-[10px] text-ink-faint transition-colors hover:text-hot-up"
              >
                <Trash2 size={12} />
                清空
              </button>
            )}
            <button
              type="button"
              onClick={() => setComparePanelOpen(false)}
              aria-label="关闭对比面板"
              className="focus-ring grid h-7 w-7 place-items-center rounded-md text-ink-muted transition-colors hover:bg-raised hover:text-ink"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          {compareMatches.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full border border-dashed border-line/60 text-ink-faint">
                <GitCompare size={20} strokeWidth={1.5} />
              </div>
              <div>
                <div className="font-display text-[12px] font-500 text-ink-muted">
                  暂无对比场次
                </div>
                <p className="mt-1 font-mono text-[10px] text-ink-faint">
                  点击赛事卡片上的
                  <span className="mx-1 text-cyan">对比</span>
                  按钮添加
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(compareMatches.length, 2)}, 1fr)`,
                }}
              >
                {compareMatches.map((m) => (
                  <CompareCard
                    key={m.id}
                    match={m}
                    onRemove={() => toggleComparison(m.id)}
                  />
                ))}
              </div>

              <div className="space-y-3">
                {COMPARE_MARKETS.map((mk) => (
                  <MarketRow key={mk} marketKey={mk} matches={compareMatches} />
                ))}
              </div>
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-line bg-elevated/30 px-4 py-2 text-center">
          <span className="font-mono text-[10px] text-ink-faint">
            最多可对比 2 场 · 数据实时更新
          </span>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
}
