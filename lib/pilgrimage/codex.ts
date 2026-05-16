/**
 * Data shapes for the Pilgrimage chapter on the Codex (home) page.
 * Page-specific aggregations live here so the page.tsx stays a
 * thin render layer.
 */
import { prisma } from "@/lib/db";
import { dailyKmSeries, allTimeBestEfforts } from "./queries";
import { acwrSeries } from "./derive";

export interface PilgrimageOverview {
  hasAny: boolean;
  totals: {
    runs: number;
    km: number;
    hours: number;
    firstRun: Date | null;
    lastRun: Date | null;
  };
  recent4w: {
    runs: number;
    km: number;
    hoursPerWeekAvg: number;
    avgPaceSecPerKm: number | null;
    avgHr: number | null;
    avgCadenceSpm: number | null;
  };
  raceGoal: {
    id: string;
    raceDate: Date;
    name: string;
    distanceM: number;
    daysToRace: number;
    phase: "build" | "taper" | "race day" | "past";
  } | null;
  acwr: {
    ratio: number | null;
    acute: number;
    chronic: number;
    status: "undertrained" | "sweet" | "caution" | "spike";
  };
  /** PR-progression chains, one per distance bucket. */
  bestProgression: Record<1000 | 3000 | 5000 | 10000, BestProgressionPoint[]>;
  /** Daily km series for the kalendar plate (last ~14 weeks). */
  dailyKm: { date: string; km: number; runs: number }[];
  /** Last six runs, newest first. */
  recentRuns: RecentRunRow[];
}

export interface BestProgressionPoint {
  date: Date;
  paceSecPerKm: number;
  runId: string;
}

export interface RecentRunRow {
  id: string;
  date: Date;
  title: string | null;
  distanceKm: number;
  durationS: number;
  avgPaceSecPerKm: number | null;
  avgHr: number | null;
}

const DAY_MS = 86_400_000;

export async function loadPilgrimageOverview(): Promise<PilgrimageOverview> {
  const [runs, raceGoal, dailyAll] = await Promise.all([
    prisma.run.findMany({
      orderBy: { startedAtLocal: "desc" },
      select: {
        id: true, startedAtLocal: true, distanceM: true, durationS: true,
        avgPaceSecPerKm: true, avgHr: true, avgCadenceSpm: true, title: true,
      },
    }),
    prisma.raceGoal.findFirst({ where: { status: "active" }, orderBy: { raceDate: "asc" } }),
    dailyKmSeries(),
  ]);

  if (runs.length === 0) {
    return {
      hasAny: false,
      totals: { runs: 0, km: 0, hours: 0, firstRun: null, lastRun: null },
      recent4w: { runs: 0, km: 0, hoursPerWeekAvg: 0, avgPaceSecPerKm: null, avgHr: null, avgCadenceSpm: null },
      raceGoal: raceGoal ? hydrateRaceGoal(raceGoal) : null,
      acwr: { ratio: null, acute: 0, chronic: 0, status: "undertrained" },
      bestProgression: { 1000: [], 3000: [], 5000: [], 10000: [] },
      dailyKm: [],
      recentRuns: [],
    };
  }

  // Totals
  const totalKm = runs.reduce((a, r) => a + r.distanceM, 0) / 1000;
  const totalHours = runs.reduce((a, r) => a + r.durationS, 0) / 3600;
  const lastRun = runs[0].startedAtLocal;
  const firstRun = runs[runs.length - 1].startedAtLocal;

  // Recent 4-week window
  const windowStart = new Date(lastRun.getTime() - 27 * DAY_MS);
  const recent = runs.filter((r) => r.startedAtLocal >= windowStart);
  const recentKm = recent.reduce((a, r) => a + r.distanceM, 0) / 1000;
  const recentHours = recent.reduce((a, r) => a + r.durationS, 0) / 3600;
  const recentPaces = recent.map((r) => r.avgPaceSecPerKm).filter((p): p is number => p != null);
  const recentHrs   = recent.map((r) => r.avgHr).filter((p): p is number => p != null);
  const recentCads  = recent.map((r) => r.avgCadenceSpm).filter((p): p is number => p != null);

  // ACWR snapshot at the last day in the daily series
  const acwrSeq = acwrSeries(dailyAll.map((d) => d.km));
  const tail = acwrSeq.length ? acwrSeq[acwrSeq.length - 1] : { acute: 0, chronic: 0, acwr: null as number | null };
  const status: PilgrimageOverview["acwr"]["status"] =
    tail.acwr == null ? "undertrained" :
    tail.acwr < 0.8  ? "undertrained" :
    tail.acwr <= 1.3 ? "sweet" :
    tail.acwr <= 1.5 ? "caution" : "spike";

  // Best-effort PR progression per distance — sweep ascending in time,
  // keep only points that improved on the running minimum.
  const allBests = await prisma.runBestEffort.findMany({
    include: { run: { select: { id: true, startedAtLocal: true } } },
    orderBy: { run: { startedAtLocal: "asc" } },
  });
  const targets = [1000, 3000, 5000, 10000] as const;
  const bestProgression: PilgrimageOverview["bestProgression"] = {
    1000: [], 3000: [], 5000: [], 10000: [],
  };
  for (const t of targets) {
    let best = Infinity;
    for (const b of allBests.filter((x) => x.distanceM === t)) {
      if (b.paceSecPerKm < best) {
        best = b.paceSecPerKm;
        bestProgression[t].push({
          date: b.run.startedAtLocal,
          paceSecPerKm: b.paceSecPerKm,
          runId: b.runId,
        });
      }
    }
  }

  // Kalendar: last 14 ISO weeks ending today (so the plate is always
  // anchored on the current cell, not on the last-run date).
  const today = new Date();
  const startK = new Date(today.getTime() - (14 * 7 - 1) * DAY_MS);
  const dailyForKal = dailyAll.filter((d) => new Date(d.date + "T00:00:00Z") >= startK);

  return {
    hasAny: true,
    totals: {
      runs: runs.length, km: totalKm, hours: totalHours, firstRun, lastRun,
    },
    recent4w: {
      runs: recent.length,
      km: recentKm,
      hoursPerWeekAvg: recentHours / 4,
      avgPaceSecPerKm: avg(recentPaces),
      avgHr: avg(recentHrs),
      avgCadenceSpm: avg(recentCads),
    },
    raceGoal: raceGoal ? hydrateRaceGoal(raceGoal) : null,
    acwr: { ratio: tail.acwr, acute: tail.acute, chronic: tail.chronic, status },
    bestProgression,
    dailyKm: dailyForKal,
    recentRuns: runs.slice(0, 6).map((r) => ({
      id: r.id,
      date: r.startedAtLocal,
      title: r.title,
      distanceKm: r.distanceM / 1000,
      durationS: r.durationS,
      avgPaceSecPerKm: r.avgPaceSecPerKm,
      avgHr: r.avgHr,
    })),
  };
}

function hydrateRaceGoal(g: { id: string; raceDate: Date; name: string; distanceM: number }): NonNullable<PilgrimageOverview["raceGoal"]> {
  const days = Math.ceil((g.raceDate.getTime() - Date.now()) / DAY_MS);
  let phase: NonNullable<PilgrimageOverview["raceGoal"]>["phase"];
  if (days < 0) phase = "past";
  else if (days === 0) phase = "race day";
  else if (days <= 10) phase = "taper";
  else phase = "build";
  return { ...g, daysToRace: days, phase };
}

function avg(xs: number[]): number | null {
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export { allTimeBestEfforts };
