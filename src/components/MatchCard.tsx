import { memo, useMemo } from "react";
import { Star, StarOff, GitCompare } from "lucide-react";
import type { Match, Team } from "@/types";
import { SPORT_META } from "@/types";
import { useOddsStore } from "@/store/useOddsStore";
import { formatTime } from "@/utils/format";
import { TeamLogo } from "@/components/TeamLogo";
import { OddsGrid } from "@/components/OddsGrid";
import { DistributionBar } from "@/components/DistributionBar";
import { HotBadge, AnomalyBadge, StatusBadge } from "@/components/Badges";
import { cn } from "@/lib/utils";

interface Props {
  match: Match;
  onOpenDetail?: () => void;
}

function TeamRow({
  team,
  score,
  showScore,
}: {
  team: Team;
  score: number;
  showScore: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <TeamLogo team={team} size={26} />
      <span className="truncate font-display text-[13px] font-500 text-ink">
        {team.name}
      </span>
      {showScore && (
        <span className="ml-auto font-mono text-[15px] font-600 tabular-nums text-amber">
          {score}
        </span>
      )}
    </div>
  );
}

function MatchCardBase({ match, onOpenDetail }: Props) {
  const { id, home, away, score, status, startTime, sport, leagueShort, markets, distribution, isHot, betVolume } =
    match;

  const anomalyKeysStr = useOddsStore((s) =>
    s.anomalies
      .filter((a) => a.matchId === match.id)
      .map((e) => `${e.market}:${e.selection}`)
      .join("|"),
  );
  const maxDrop = useOddsStore((s) => {
    const evs = s.anomalies.filter((a) => a.matchId === match.id);
    return evs.length ? Math.max(...evs.map((e) => e.dropPct)) : 0;
  });
  const isFavorited = useOddsStore((s) => s.favorites.has(id));
  const toggleFavorite = useOddsStore((s) => s.toggleFavorite);
  const isInComparison = useOddsStore((s) => s.comparisonIds.has(id));
  const toggleComparison = useOddsStore((s) => s.toggleComparison);

  const anomalyKeys = useMemo(() => {
    const set = new Set<string>();
    if (anomalyKeysStr) anomalyKeysStr.split("|").forEach((k) => set.add(k));
    return set;
  }, [anomalyKeysStr]);

  const showScore = status === "live" || status === "finished";
  const hasAnomaly = anomalyKeys.size > 0;
  const meta = SPORT_META[sport];

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border bg-surface/70 p-3 shadow-card transition-all duration-200",
        "hover:border-amber/40 hover:bg-surface",
        isHot ? "border-amber/45 shadow-glowAmber" : "border-line",
        hasAnomaly && "border-hot-anomaly/45",
        isFavorited && !isHot && !hasAnomaly && "border-amber/30",
        isInComparison && "border-cyan/50 shadow-[0_0_0_2px_rgba(34,211,238,0.15)]",
      )}
      aria-label={`${home.name} 对阵 ${away.name}，${leagueShort} ${formatTime(startTime)}`}
    >
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleComparison(id);
          }}
          aria-pressed={isInComparison}
          aria-label={isInComparison ? "移除对比" : "加入对比"}
          className={cn(
            "focus-ring grid h-6 w-6 place-items-center rounded-md border transition-all",
            isInComparison
              ? "border-cyan/60 bg-cyan/10 text-cyan"
              : "border-line bg-raised/60 text-ink-faint opacity-60 hover:opacity-100 hover:text-cyan hover:border-cyan/40",
          )}
          title={isInComparison ? "移除对比" : "加入对比"}
        >
          <GitCompare size={13} strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => toggleFavorite(id)}
          aria-pressed={isFavorited}
          aria-label={isFavorited ? "取消收藏" : "收藏比赛"}
          className={cn(
            "focus-ring grid h-6 w-6 place-items-center rounded-md border transition-all",
            isFavorited
              ? "border-amber/50 bg-amber/10 text-amber shadow-glowAmber"
              : "border-line bg-raised/60 text-ink-faint opacity-60 hover:opacity-100 hover:text-amber hover:border-amber/40",
          )}
          title={isFavorited ? "取消收藏（异常赔率会系统通知）" : "收藏（异常赔率会系统通知）"}
        >
          {isFavorited ? <Star size={13} fill="currentColor" strokeWidth={2} /> : <StarOff size={13} strokeWidth={2} />}
        </button>
        {isHot && <HotBadge />}
        {hasAnomaly && <AnomalyBadge dropPct={maxDrop} />}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        <button
          type="button"
          onClick={onOpenDetail}
          disabled={!onOpenDetail}
          aria-label="查看赛事详情"
          className={cn(
            "focus-ring w-full shrink-0 text-left transition-colors lg:w-[230px]",
            onOpenDetail && "rounded-lg hover:bg-raised/50",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="chip border border-line bg-raised text-ink-muted">
              <span aria-hidden="true">{meta.emoji}</span>
              {leagueShort}
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[13px] font-600 tabular-nums text-cyan">
                {formatTime(startTime)}
              </span>
            </div>
          </div>
          <div className="mt-2 flex flex-col gap-1.5">
            <TeamRow team={home} score={score.home} showScore={showScore} />
            <TeamRow team={away} score={score.away} showScore={showScore} />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <StatusBadge status={status} />
            <span className="font-mono text-[9px] text-ink-faint">
              ¥{(betVolume / 1000).toFixed(1)}k
            </span>
          </div>
        </button>

        <div className="flex-1 lg:border-l lg:border-line lg:pl-3">
          <OddsGrid markets={markets} anomalyKeys={anomalyKeys} />
        </div>

        <div className="w-full shrink-0 lg:w-[200px] lg:border-l lg:border-line lg:pl-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-display text-[10px] font-600 uppercase tracking-wide text-ink-muted">
              资金分布
            </span>
            <span className="font-mono text-[9px] text-ink-faint">悬停查看</span>
          </div>
          <DistributionBar distribution={distribution} sport={sport} />
        </div>
      </div>
    </article>
  );
}

export const MatchCard = memo(MatchCardBase);
