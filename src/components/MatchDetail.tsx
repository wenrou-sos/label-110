import { useEffect, useMemo, useState } from "react";
import { X, Clock, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Star, StarOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Match, Market, Selection, OddsHistoryPoint } from "@/types";
import { SPORT_META, MARKET_LABELS } from "@/types";
import { useOddsStore } from "@/store/useOddsStore";
import { formatTime, formatOdds, formatPercent, formatSignedPercent } from "@/utils/format";
import { TeamLogo } from "@/components/TeamLogo";
import { DistributionBar } from "@/components/DistributionBar";
import { Sparkline } from "@/components/Sparkline";
import { HotBadge, AnomalyBadge, StatusBadge } from "@/components/Badges";
import { cn } from "@/lib/utils";

interface Props {
  match: Match;
  onClose: () => void;
}

function OddsHistoryTimeline({
  history,
  label,
}: {
  history: OddsHistoryPoint[];
  label: string;
}) {
  const sorted = useMemo(() => [...history].sort((a, b) => b.t - a.t), [history]);

  return (
    <div className="space-y-1" role="list" aria-label={`${label} 赔率历史时间线`}>
      {sorted.map((p, i) => {
        const prev = i < sorted.length - 1 ? sorted[i + 1] : null;
        const change = prev ? p.odds - prev.odds : 0;
        const pct = prev ? (p.odds - prev.odds) / prev.odds : 0;
        const isDown = change < 0;
        const isUp = change > 0;

        return (
          <div
            key={p.t}
            role="listitem"
            className="flex items-center gap-2 rounded-md border border-line/60 bg-elevated/40 px-2 py-1.5"
          >
            <div className="flex h-4 w-4 items-center justify-center">
              {isDown ? (
                <TrendingDown size={12} className="text-hot-up" />
              ) : isUp ? (
                <TrendingUp size={12} className="text-hot-down" />
              ) : (
                <Minus size={12} className="text-ink-faint" />
              )}
            </div>
            <span className="font-mono text-[11px] tabular-nums text-ink-muted">
              {formatTime(p.t)}
            </span>
            <span className="ml-auto font-mono text-[12px] font-600 tabular-nums text-ink">
              {formatOdds(p.odds)}
            </span>
            {prev && (
              <span
                className={cn(
                  "font-mono text-[10px] tabular-nums",
                  isDown ? "text-hot-up" : isUp ? "text-hot-down" : "text-ink-faint",
                )}
              >
                {formatSignedPercent(pct, 1)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SelectionDetailRow({
  matchId,
  marketKey,
  selection,
  isAnomaly,
}: {
  matchId: string;
  marketKey: string;
  selection: Selection;
  isAnomaly: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const history = useOddsStore((s) =>
    s.getOddsHistory(matchId, marketKey as any, selection.key),
  );

  const hasHistory = history.length >= 2;
  const firstOdds = hasHistory ? history[0].odds : selection.odds;
  const totalChange = selection.odds - firstOdds;
  const totalPct = firstOdds > 0 ? totalChange / firstOdds : 0;
  const isDown = totalChange < 0;
  const isUp = totalChange > 0;

  const sparkColor = isDown ? "#00E676" : isUp ? "#FF2D55" : "#F5B614";
  const sparkFill = isDown
    ? "rgba(0, 230, 118, 0.12)"
    : isUp
      ? "rgba(255, 45, 85, 0.12)"
      : "rgba(245, 182, 20, 0.15)";

  return (
    <div className="rounded-lg border border-line bg-elevated/50">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="focus-ring flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-raised/60"
      >
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-[11px] font-600 uppercase tracking-wide text-ink">
              {selection.label}
            </span>
            {selection.line != null && (
              <span className="font-mono text-[10px] text-cyan">
                {selection.line > 0 ? `+${selection.line}` : selection.line}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <Clock size={10} className="text-ink-faint" />
            <span className="font-mono text-[10px] tabular-nums text-ink-faint">
              {formatTime(selection.updatedAt)} 更新
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasHistory && (
            <div className="hidden sm:block">
              <Sparkline data={history} width={80} height={28} color={sparkColor} fill={sparkFill} />
            </div>
          )}

          <div className="text-right">
            <div
              className={cn(
                "font-mono text-[15px] font-700 tabular-nums",
                isDown ? "text-hot-up" : isUp ? "text-hot-down" : "text-ink",
                isAnomaly && "text-hot-anomaly",
              )}
            >
              {formatOdds(selection.odds)}
            </div>
            {hasHistory && (
              <div
                className={cn(
                  "font-mono text-[10px] tabular-nums",
                  isDown ? "text-hot-up" : isUp ? "text-hot-down" : "text-ink-faint",
                )}
              >
                {formatSignedPercent(totalPct, 1)}
              </div>
            )}
          </div>

          <div className="text-ink-faint">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && hasHistory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-line px-3 py-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-display text-[10px] font-600 uppercase tracking-wide text-ink-muted">
                  赔率走势
                </span>
                <span className="font-mono text-[10px] text-ink-faint">
                  共 {history.length} 条记录
                </span>
              </div>
              <div className="mb-3 rounded-lg border border-line bg-night/60 p-3">
                <Sparkline
                  data={history}
                  width={260}
                  height={64}
                  color={sparkColor}
                  fill={sparkFill}
                  strokeWidth={2}
                />
                <div className="mt-2 flex items-center justify-between font-mono text-[10px] tabular-nums text-ink-faint">
                  <span>初始 {formatOdds(firstOdds)}</span>
                  <span
                    className={cn(
                      "font-600",
                      isDown ? "text-hot-up" : isUp ? "text-hot-down" : "text-ink",
                    )}
                  >
                    当前 {formatOdds(selection.odds)}
                  </span>
                </div>
              </div>
              <div className="mb-1.5">
                <span className="font-display text-[10px] font-600 uppercase tracking-wide text-ink-muted">
                  历史时间线
                </span>
              </div>
              <div className="max-h-56 overflow-y-auto scrollbar-thin pr-1">
                <OddsHistoryTimeline history={history} label={selection.label} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MarketSection({ matchId, market }: { matchId: string; market: Market }) {
  const anomalyKeysStr = useOddsStore((s) =>
    s.anomalies
      .filter((a) => a.matchId === matchId && a.market === market.key)
      .map((e) => e.selection)
      .join("|"),
  );

  const anomalyKeys = useMemo(() => {
    const set = new Set<string>();
    if (anomalyKeysStr) anomalyKeysStr.split("|").forEach((k) => set.add(k));
    return set;
  }, [anomalyKeysStr]);

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="font-display text-[12px] font-700 uppercase tracking-wide text-ink">
          {MARKET_LABELS[market.key] ?? market.key}
        </h3>
        {market.line != null && (
          <span className="chip border border-cyan/30 bg-cyan/10 text-cyan">
            盘口 {market.line}
          </span>
        )}
        <span className="ml-auto font-mono text-[10px] text-ink-faint">
          {market.selections.length} 个选项
        </span>
      </div>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {market.selections.map((sel) => (
          <SelectionDetailRow
            key={sel.key}
            matchId={matchId}
            marketKey={market.key}
            selection={sel}
            isAnomaly={anomalyKeys.has(sel.key)}
          />
        ))}
      </div>
    </section>
  );
}

export function MatchDetail({ match, onClose }: Props) {
  const { id, home, away, score, status, startTime, sport, league, leagueShort, markets, distribution, isHot, betVolume } =
    match;

  const isFavorited = useOddsStore((s) => s.favorites.has(id));
  const toggleFavorite = useOddsStore((s) => s.toggleFavorite);
  const maxDrop = useOddsStore((s) => {
    const evs = s.anomalies.filter((a) => a.matchId === id);
    return evs.length ? Math.max(...evs.map((e) => e.dropPct)) : 0;
  });
  const anomalyCount = useOddsStore((s) => s.anomalies.filter((a) => a.matchId === id).length);

  const showScore = status === "live" || status === "finished";
  const meta = SPORT_META[sport];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label={`${home.name} 对阵 ${away.name} 详情`}
      >
        <div
          className="absolute inset-0 bg-night/80 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />

        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
        >
          <header className="relative shrink-0 border-b border-line bg-gradient-to-b from-elevated to-surface px-5 py-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="chip border border-line bg-raised text-ink-muted">
                <span aria-hidden="true">{meta.emoji}</span>
                {league}
                <span className="ml-1 text-ink-faint">· {leagueShort}</span>
              </span>
              <StatusBadge status={status} />
              {isHot && <HotBadge />}
              {anomalyCount > 0 && <AnomalyBadge dropPct={maxDrop} />}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-1 items-center gap-3">
                <TeamLogo team={home} size={44} />
                <div className="min-w-0">
                  <div className="truncate font-display text-[16px] font-700 text-ink">
                    {home.name}
                  </div>
                  <div className="font-mono text-[10px] text-ink-faint">主</div>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-center">
                {showScore ? (
                  <div className="font-mono text-[28px] font-800 tabular-nums text-amber">
                    {score.home} - {score.away}
                  </div>
                ) : (
                  <div className="font-mono text-[18px] font-700 tabular-nums text-cyan">
                    {formatTime(startTime)}
                  </div>
                )}
                <div className="font-mono text-[10px] text-ink-faint">VS</div>
              </div>

              <div className="flex flex-1 items-center justify-end gap-3">
                <div className="min-w-0 text-right">
                  <div className="truncate font-display text-[16px] font-700 text-ink">
                    {away.name}
                  </div>
                  <div className="font-mono text-[10px] text-ink-faint">客</div>
                </div>
                <TeamLogo team={away} size={44} />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleFavorite(id)}
                aria-pressed={isFavorited}
                aria-label={isFavorited ? "取消收藏" : "收藏比赛"}
                className={cn(
                  "focus-ring flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-display text-[11px] font-600 uppercase tracking-wide transition-colors",
                  isFavorited
                    ? "border-amber/50 bg-amber/10 text-amber shadow-glowAmber"
                    : "border-line bg-raised text-ink-muted hover:text-amber hover:border-amber/40",
                )}
              >
                {isFavorited ? (
                  <Star size={13} fill="currentColor" strokeWidth={2} />
                ) : (
                  <StarOff size={13} strokeWidth={2} />
                )}
                {isFavorited ? "已收藏" : "收藏"}
              </button>
              <span className="font-mono text-[10px] text-ink-faint">
                投注量 ¥{(betVolume / 1000).toFixed(1)}k
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="关闭详情"
              className="focus-ring absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-md text-ink-muted transition-colors hover:bg-raised hover:text-ink"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-5">
            <section className="mb-6">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-display text-[12px] font-700 uppercase tracking-wide text-ink">
                  投注资金分布
                </h2>
                <span className="font-mono text-[10px] text-ink-faint">悬停查看详情</span>
              </div>
              <DistributionBar distribution={distribution} sport={sport} />
            </section>

            <div className="space-y-5">
              {markets.map((mk) => (
                <MarketSection key={mk.key} matchId={id} market={mk} />
              ))}
            </div>
          </div>

          <footer className="shrink-0 border-t border-line bg-elevated/30 px-5 py-2 text-center">
            <span className="font-mono text-[10px] text-ink-faint">
              按 ESC 或点击遮罩关闭 · 数据实时更新中
            </span>
          </footer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
