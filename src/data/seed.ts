import type { Match, Market, MarketKey, Sport, Status, Team } from "@/types";

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface TeamDef {
  name: string;
  short: string;
  color: string;
}

const LEAGUES: Record<
  Sport,
  { league: string; short: string; teams: TeamDef[] }[]
> = {
  football: [
    {
      league: "英超",
      short: "EPL",
      teams: [
        { name: "阿森纳", short: "ARS", color: "#EF0107" },
        { name: "切尔西", short: "CHE", color: "#034694" },
        { name: "利物浦", short: "LIV", color: "#C8102E" },
        { name: "曼城", short: "MCI", color: "#6CABDD" },
        { name: "热刺", short: "TOT", color: "#132257" },
        { name: "曼联", short: "MUN", color: "#DA291C" },
        { name: "纽卡斯尔", short: "NEW", color: "#241F20" },
        { name: "阿斯顿维拉", short: "AVL", color: "#95BFE5" },
      ],
    },
    {
      league: "西甲",
      short: "LAL",
      teams: [
        { name: "皇家马德里", short: "RMA", color: "#FEBE10" },
        { name: "巴塞罗那", short: "BAR", color: "#A50044" },
        { name: "马德里竞技", short: "ATM", color: "#CB3524" },
        { name: "塞维利亚", short: "SEV", color: "#D81920" },
        { name: "瓦伦西亚", short: "VAL", color: "#F18E00" },
        { name: "皇家社会", short: "RSO", color: "#0067B1" },
      ],
    },
    {
      league: "意甲",
      short: "SEA",
      teams: [
        { name: "国际米兰", short: "INT", color: "#0068A8" },
        { name: "AC米兰", short: "MIL", color: "#FB090B" },
        { name: "尤文图斯", short: "JUV", color: "#000000" },
        { name: "那不勒斯", short: "NAP", color: "#12A0D7" },
        { name: "罗马", short: "ROM", color: "#8E1F2F" },
        { name: "拉齐奥", short: "LAZ", color: "#87D8F7" },
      ],
    },
  ],
  basketball: [
    {
      league: "NBA",
      short: "NBA",
      teams: [
        { name: "湖人", short: "LAL", color: "#552583" },
        { name: "凯尔特人", short: "BOS", color: "#007A33" },
        { name: "勇士", short: "GSW", color: "#1D428A" },
        { name: "雄鹿", short: "MIL", color: "#00471B" },
        { name: "掘金", short: "DEN", color: "#0E2240" },
        { name: "太阳", short: "PHX", color: "#1D1160" },
        { name: "热火", short: "MIA", color: "#98002E" },
        { name: "76人", short: "PHI", color: "#006BB6" },
      ],
    },
  ],
  tennis: [
    {
      league: "ATP大师赛",
      short: "ATP",
      teams: [
        { name: "阿尔卡拉斯", short: "ALC", color: "#F5B614" },
        { name: "辛纳", short: "SIN", color: "#22D3EE" },
        { name: "德约科维奇", short: "DJO", color: "#00E676" },
        { name: "梅德韦杰夫", short: "MED", color: "#FF2D55" },
        { name: "卢布列夫", short: "RUB", color: "#A855F7" },
        { name: "兹维列夫", short: "ZVE", color: "#FB923C" },
        { name: "西西帕斯", short: "TSI", color: "#38BDF8" },
        { name: "鲁德", short: "RUD", color: "#F472B6" },
      ],
    },
  ],
};

function pick<T>(rnd: () => number, arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}

function jitter(rnd: () => number, base: number, spread: number): number {
  return +(base + (rnd() - 0.5) * spread).toFixed(2);
}

function makeTeam(def: TeamDef): Team {
  return { name: def.name, short: def.short, logo: def.short, color: def.color };
}

function buildMarkets(rnd: () => number, sport: Sport): Market[] {
  const now = Date.now();
  const mk = (
    key: MarketKey,
    label: string,
    selections: { key: string; label: string; odds: number; line?: number }[],
    line?: number,
  ): Market => ({
    key,
    label,
    line,
    selections: selections.map((s) => ({
      ...s,
      prevOdds: s.odds,
      updatedAt: now,
      trend: "stable" as const,
    })),
  });

  const hasDraw = sport === "football";

  const home = jitter(rnd, 2.1, 1.6);
  const draw = jitter(rnd, 3.25, 0.6);
  const away = jitter(rnd, 3.0, 1.6);

  const oneXtwo = mk(
    "1x2",
    "胜平负",
    hasDraw
      ? [
          { key: "home", label: "主胜", odds: home },
          { key: "draw", label: "平局", odds: draw },
          { key: "away", label: "客胜", odds: away },
        ]
      : [
          { key: "home", label: "主胜", odds: home },
          { key: "away", label: "客胜", odds: away },
        ],
  );

  const hcap = sport === "football" ? 1.5 : sport === "basketball" ? 5.5 : 3.5;
  const handicap = mk(
    "handicap",
    "让球盘",
    [
      { key: "home", label: "主让", odds: jitter(rnd, 1.9, 0.4), line: -hcap },
      { key: "away", label: "客让", odds: jitter(rnd, 1.95, 0.4), line: hcap },
    ],
    hcap,
  );

  const ouLine = sport === "football" ? 2.5 : sport === "basketball" ? 215.5 : 22.5;
  const overUnder = mk(
    "overUnder",
    "大小球",
    [
      { key: "over", label: "大", odds: jitter(rnd, 1.88, 0.3), line: ouLine },
      { key: "under", label: "小", odds: jitter(rnd, 1.92, 0.3), line: ouLine },
    ],
    ouLine,
  );

  const correctScores =
    sport === "football"
      ? mk("cs", "波胆", [
          { key: "2-1", label: "2-1", odds: jitter(rnd, 8.5, 2) },
          { key: "1-1", label: "1-1", odds: jitter(rnd, 6.5, 1.5) },
          { key: "1-0", label: "1-0", odds: jitter(rnd, 7.5, 1.8) },
          { key: "0-0", label: "0-0", odds: jitter(rnd, 9.5, 2) },
          { key: "2-0", label: "2-0", odds: jitter(rnd, 10, 2.5) },
          { key: "0-1", label: "0-1", odds: jitter(rnd, 11, 3) },
        ])
      : mk("cs", "波胆", [
          { key: "2-0", label: "2-0", odds: jitter(rnd, 3.2, 0.8) },
          { key: "0-2", label: "0-2", odds: jitter(rnd, 3.6, 0.8) },
          { key: "2-1", label: "2-1", odds: jitter(rnd, 4.5, 1) },
          { key: "1-2", label: "1-2", odds: jitter(rnd, 4.8, 1) },
        ]);

  const goalsLine = sport === "football" ? undefined : undefined;
  const goals = mk("goals", "总进球", [
    { key: "0-1", label: "0-1", odds: jitter(rnd, 4.5, 1) },
    { key: "2-3", label: "2-3", odds: jitter(rnd, 2.2, 0.4) },
    { key: "4-6", label: "4-6", odds: jitter(rnd, 3.8, 0.8) },
    { key: "7+", label: "7+", odds: jitter(rnd, 12, 3) },
  ]);

  void goalsLine;
  return [oneXtwo, handicap, overUnder, correctScores, goals];
}

export function generateMatches(seed = 20260619): Match[] {
  const rnd = mulberry32(seed);
  const matches: Match[] = [];
  const sports: Sport[] = ["football", "basketball", "tennis"];
  const statuses: Status[] = ["live", "live", "scheduled", "scheduled", "scheduled", "finished"];
  const dayMs = 24 * 60 * 60 * 1000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.getTime();

  let id = 0;
  const total = 48;
  for (let i = 0; i < total; i++) {
    const sport = pick(rnd, sports);
    const leagueDef = pick(rnd, LEAGUES[sport]);
    const teams = [...leagueDef.teams];
    const aIdx = Math.floor(rnd() * teams.length);
    let bIdx = Math.floor(rnd() * teams.length);
    if (bIdx === aIdx) bIdx = (bIdx + 1) % teams.length;
    const homeDef = teams[aIdx];
    const awayDef = teams[bIdx];

    const date: "today" | "tomorrow" = rnd() > 0.45 ? "today" : "tomorrow";
    const rawStatus = pick(rnd, statuses);
    const status: Status = date === "tomorrow" ? "scheduled" : rawStatus;
    const hourOffset = Math.floor(rnd() * 24);
    const minuteOffset = Math.floor(rnd() * 60);
    const startTime =
      todayStart +
      (date === "tomorrow" ? dayMs : 0) +
      hourOffset * 60 * 60 * 1000 +
      minuteOffset * 60 * 1000;

    const liveScore = status === "live";
    const score = {
      home: liveScore ? Math.floor(rnd() * 4) : 0,
      away: liveScore ? Math.floor(rnd() * 4) : 0,
    };

    const homePct = 0.3 + rnd() * 0.45;
    const drawPct = sport === "football" ? rnd() * 0.3 : 0;
    const awayPct = 1 - homePct - drawPct;
    const dist = {
      home: +homePct.toFixed(3),
      draw: +drawPct.toFixed(3),
      away: +Math.max(0, awayPct).toFixed(3),
    };

    matches.push({
      id: `m${String(++id).padStart(3, "0")}`,
      sport,
      league: leagueDef.league,
      leagueShort: leagueDef.short,
      home: makeTeam(homeDef),
      away: makeTeam(awayDef),
      startTime,
      status,
      score,
      markets: buildMarkets(rnd, sport),
      distribution: dist,
      betVolume: Math.floor(rnd() * 100000) + 5000,
      oddsChangeRate: +(rnd() * 30).toFixed(1),
      anomalyCount: 0,
      isHot: false,
      date,
    });
  }

  return matches;
}
