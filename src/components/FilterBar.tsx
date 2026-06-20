import { AlertTriangle, Flame, Search, Star } from "lucide-react";
import type { Sport, Match } from "@/types";
import { SPORT_META } from "@/types";
import { cn } from "@/lib/utils";

export interface Filters {
  date: "today" | "tomorrow";
  sports: Sport[];
  search: string;
  onlyHot: boolean;
  onlyAnomaly: boolean;
  onlyFavorites: boolean;
  league: string | null;
}

interface Props {
  filters: Filters;
  onChange: (next: Filters) => void;
  todayCount: number;
  tomorrowCount: number;
  favoritesCount: number;
  matches: Match[];
}

const SPORTS: Sport[] = ["football", "basketball", "tennis"];

export function FilterBar({ filters, onChange, todayCount, tomorrowCount, favoritesCount, matches }: Props) {
  const toggleSport = (s: Sport) => {
    const has = filters.sports.includes(s);
    const nextSports = has ? filters.sports.filter((x) => x !== s) : [...filters.sports, s];
    const nextLeagues = nextSports.length === 1
      ? [...new Set(matches.filter((m) => m.sport === nextSports[0]).map((m) => m.leagueShort))].sort()
      : [];
    const nextLeague = nextLeagues.includes(filters.league ?? "") ? filters.league : null;
    onChange({ ...filters, sports: nextSports, league: nextLeague });
  };

  const activeSport = filters.sports.length === 1 ? filters.sports[0] : null;

  const leagues = activeSport
    ? [...new Set(matches.filter((m) => m.sport === activeSport).map((m) => m.leagueShort))].sort()
    : [];

  return (
    <div className="flex flex-col gap-2 border-b border-line bg-surface/50 px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-lg border border-line bg-night/50 p-0.5">
        {(["today", "tomorrow"] as const).map((d) => {
          const active = filters.date === d;
          const count = d === "today" ? todayCount : tomorrowCount;
          return (
            <button
              key={d}
              type="button"
              onClick={() => onChange({ ...filters, date: d })}
              className={cn(
                "focus-ring rounded-md px-3 py-1.5 font-display text-[12px] font-600 uppercase tracking-wide transition-colors",
                active ? "bg-amber text-night shadow-glowAmber" : "text-ink-muted hover:text-ink",
              )}
              aria-pressed={active}
            >
              {d === "today" ? "今日" : "明日"}
              <span className={cn("ml-1.5 font-mono text-[10px]", active ? "text-night/70" : "text-ink-faint")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5">
        {SPORTS.map((s) => {
          const meta = SPORT_META[s];
          const active = filters.sports.includes(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggleSport(s)}
              className={cn(
                "focus-ring flex items-center gap-1 rounded-md border px-2.5 py-1.5 font-display text-[12px] font-600 uppercase tracking-wide transition-colors",
                active
                  ? "border-amber/50 bg-amber/10 text-amber"
                  : "border-line bg-raised text-ink-muted hover:text-ink",
              )}
              aria-pressed={active}
            >
              <span aria-hidden="true">{meta.emoji}</span>
              {meta.label}
            </button>
          );
        })}
      </div>

      <div className="relative ml-auto flex items-center">
        <Search size={14} className="pointer-events-none absolute left-2.5 text-ink-faint" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="搜索球队 / 联赛"
          className="focus-ring h-9 w-40 rounded-md border border-line bg-night/50 pl-8 pr-3 font-sans text-[12px] text-ink placeholder:text-ink-faint sm:w-56"
          aria-label="搜索赛事"
        />
      </div>

      <button
        type="button"
        onClick={() => onChange({ ...filters, onlyHot: !filters.onlyHot })}
        className={cn(
          "focus-ring flex items-center gap-1 rounded-md border px-2.5 py-1.5 font-display text-[12px] font-600 uppercase tracking-wide transition-colors",
          filters.onlyHot
            ? "border-amber/50 bg-amber/10 text-amber"
            : "border-line bg-raised text-ink-muted hover:text-ink",
        )}
        aria-pressed={filters.onlyHot}
      >
        <Flame size={13} />
        仅热门
      </button>

      <button
        type="button"
        onClick={() => onChange({ ...filters, onlyAnomaly: !filters.onlyAnomaly })}
        className={cn(
          "focus-ring flex items-center gap-1 rounded-md border px-2.5 py-1.5 font-display text-[12px] font-600 uppercase tracking-wide transition-colors",
          filters.onlyAnomaly
            ? "border-hot-anomaly/50 bg-hot-anomaly/10 text-hot-anomaly"
            : "border-line bg-raised text-ink-muted hover:text-ink",
        )}
        aria-pressed={filters.onlyAnomaly}
      >
        <AlertTriangle size={13} />
        仅异常
      </button>

      <button
        type="button"
        onClick={() => onChange({ ...filters, onlyFavorites: !filters.onlyFavorites })}
        className={cn(
          "focus-ring flex items-center gap-1 rounded-md border px-2.5 py-1.5 font-display text-[12px] font-600 uppercase tracking-wide transition-colors",
          filters.onlyFavorites
            ? "border-amber/50 bg-amber/10 text-amber shadow-glowAmber"
            : "border-line bg-raised text-ink-muted hover:text-ink",
        )}
        aria-pressed={filters.onlyFavorites}
      >
        <Star size={13} fill={filters.onlyFavorites ? "currentColor" : "none"} />
        仅收藏
        <span
          className={cn(
            "ml-1 font-mono text-[10px]",
            filters.onlyFavorites ? "text-amber/80" : "text-ink-faint",
          )}
        >
          {favoritesCount}
        </span>
      </button>
      </div>

      {leagues.length > 0 && (
        <div
          data-testid="league-tabs"
          className="flex items-center gap-1 overflow-x-auto scrollbar-thin pb-0.5"
        >
          <button
            type="button"
            onClick={() => onChange({ ...filters, league: null })}
            className={cn(
              "focus-ring shrink-0 rounded-md px-2.5 py-1 font-display text-[11px] font-600 uppercase tracking-wide transition-colors whitespace-nowrap",
              filters.league === null
                ? "bg-cyan/15 text-cyan border border-cyan/40"
                : "text-ink-muted hover:text-ink border border-transparent",
            )}
            aria-pressed={filters.league === null}
          >
            全部
            <span className="ml-1.5 font-mono text-[10px] text-ink-faint">
              {matches.filter((m) => m.sport === activeSport).length}
            </span>
          </button>
          {leagues.map((league) => {
            const count = matches.filter((m) => m.sport === activeSport && m.leagueShort === league).length;
            return (
              <button
                key={league}
                type="button"
                onClick={() => onChange({ ...filters, league })}
                className={cn(
                  "focus-ring shrink-0 rounded-md px-2.5 py-1 font-display text-[11px] font-600 uppercase tracking-wide transition-colors whitespace-nowrap",
                  filters.league === league
                    ? "bg-cyan/15 text-cyan border border-cyan/40"
                    : "text-ink-muted hover:text-ink border border-transparent",
                )}
                aria-pressed={filters.league === league}
              >
                {league}
                <span className="ml-1.5 font-mono text-[10px] text-ink-faint">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
