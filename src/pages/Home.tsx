import { useMemo, useState } from "react";
import type { Match, Status } from "@/types";
import { useOddsStream } from "@/hooks/useOddsStream";
import { useWindowSize } from "@/hooks/useClock";
import { useOddsStore } from "@/store/useOddsStore";
import { StatusBar } from "@/components/StatusBar";
import { FilterBar, type Filters } from "@/components/FilterBar";
import { MatchList } from "@/components/MatchList";
import { MatchDetail } from "@/components/MatchDetail";
import { ComparePanel } from "@/components/ComparePanel";
import { Skeleton } from "@/components/Skeleton";

const rank = (s: Status): number => (s === "live" ? 0 : s === "scheduled" ? 1 : 2);

export default function Home() {
  useOddsStream();
  const matches = useOddsStore((s) => s.matches);
  const connState = useOddsStore((s) => s.connState);
  const favorites = useOddsStore((s) => s.favorites);
  const { width } = useWindowSize();
  const itemHeight = width >= 1024 ? 168 : 340;

  const [filters, setFilters] = useState<Filters>({
    date: "today",
    sports: [],
    search: "",
    onlyHot: false,
    onlyAnomaly: false,
    onlyFavorites: false,
    league: null,
  });
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const selectedMatch = useMemo<Match | null>(
    () => (selectedMatchId ? matches.find((m) => m.id === selectedMatchId) ?? null : null),
    [selectedMatchId, matches],
  );

  const todayCount = useMemo(() => matches.filter((m) => m.date === "today").length, [matches]);
  const tomorrowCount = useMemo(() => matches.filter((m) => m.date === "tomorrow").length, [matches]);
  const favoritesCount = favorites.size;

  const filtered = useMemo(() => {
    let list = matches.filter((m) => m.date === filters.date);
    if (filters.sports.length) {
      list = list.filter((m) => filters.sports.includes(m.sport));
    }
    if (filters.league) {
      list = list.filter((m) => m.leagueShort === filters.league);
    }
    const q = filters.search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) =>
          m.home.name.toLowerCase().includes(q) ||
          m.away.name.toLowerCase().includes(q) ||
          m.league.toLowerCase().includes(q) ||
          m.leagueShort.toLowerCase().includes(q),
      );
    }
    if (filters.onlyHot) list = list.filter((m) => m.isHot);
    if (filters.onlyAnomaly) list = list.filter((m) => m.anomalyCount > 0);
    if (filters.onlyFavorites) list = list.filter((m) => favorites.has(m.id));

    return [...list].sort((a, b) => {
      const aFav = favorites.has(a.id);
      const bFav = favorites.has(b.id);
      if (aFav !== bFav) return aFav ? -1 : 1;
      if (a.isHot !== b.isHot) return a.isHot ? -1 : 1;
      if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status);
      return a.startTime - b.startTime;
    });
  }, [matches, filters, favorites]);

  const loading = matches.length === 0 && (connState === "connecting" || connState === "reconnecting");

  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <FilterBar
        filters={filters}
        onChange={setFilters}
        todayCount={todayCount}
        tomorrowCount={tomorrowCount}
        favoritesCount={favoritesCount}
        matches={matches}
      />
      {loading ? (
        <Skeleton />
      ) : (
        <MatchList matches={filtered} itemHeight={itemHeight} onOpenDetail={(m) => setSelectedMatchId(m.id)} />
      )}
      {selectedMatch && <MatchDetail match={selectedMatch} onClose={() => setSelectedMatchId(null)} />}
      <ComparePanel />
    </div>
  );
}
