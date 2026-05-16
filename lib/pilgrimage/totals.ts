/**
 * Running aggregates for the /totals page. Mirrors the shape of the
 * lifting `lib/totals.ts` so the page can render both halves with
 * the same period selector.
 */
import { prisma } from "@/lib/db";

export interface RunRow {
  id: string;
  date: Date;
  distanceM: number;
  durationS: number;
  avgPaceSecPerKm: number | null;
  avgHr: number | null;
  avgCadenceSpm: number | null;
}

export interface Period { start: Date; end: Date }

export interface RunTotals {
  // Volume
  runs: number;
  km: number;
  hours: number;

  // Pace (km-weighted, only on runs with avgPace)
  avgPaceSecPerKm: number | null;

  // HR (km-weighted)
  avgHr: number | null;

  // Cadence (km-weighted)
  avgCadenceSpm: number | null;

  // Distribution highlights
  longestRunKm: number;
  longestRunDurationS: number;
  longestRunDate: Date | null;
  biggestWeekKm: number;
  biggestWeekStart: Date | null;
  currentWeekKm: number;
}

export interface LifetimeRunTotals extends RunTotals {
  firstRun: Date;
  lastRun: Date;
}

const DAY_MS = 86_400_000;

export async function loadAllRuns(): Promise<RunRow[]> {
  const rs = await prisma.run.findMany({
    orderBy: { startedAtLocal: "asc" },
    select: {
      id: true, startedAtLocal: true,
      distanceM: true, durationS: true,
      avgPaceSecPerKm: true, avgHr: true, avgCadenceSpm: true,
    },
  });
  return rs.map(r => ({
    id: r.id,
    date: r.startedAtLocal,
    distanceM: r.distanceM,
    durationS: r.durationS,
    avgPaceSecPerKm: r.avgPaceSecPerKm,
    avgHr: r.avgHr,
    avgCadenceSpm: r.avgCadenceSpm,
  }));
}

export function inPeriod(runs: RunRow[], p: Period): RunRow[] {
  return runs.filter(r => r.date >= p.start && r.date <= p.end);
}

export function periodTotals(runs: RunRow[]): RunTotals {
  const totalKm = runs.reduce((a, r) => a + r.distanceM, 0) / 1000;
  const totalHours = runs.reduce((a, r) => a + r.durationS, 0) / 3600;

  // km-weighted means
  let paceNum = 0, paceDen = 0;
  let hrNum   = 0, hrDen   = 0;
  let cadNum  = 0, cadDen  = 0;
  for (const r of runs) {
    const km = r.distanceM / 1000;
    if (r.avgPaceSecPerKm != null && km > 0) { paceNum += r.avgPaceSecPerKm * km; paceDen += km; }
    if (r.avgHr           != null && km > 0) { hrNum   += r.avgHr * km;            hrDen += km; }
    if (r.avgCadenceSpm   != null && km > 0) { cadNum  += r.avgCadenceSpm * km;    cadDen += km; }
  }

  // Longest single run
  const longest = runs.reduce<RunRow | null>((m, r) => (m && m.distanceM >= r.distanceM ? m : r), null);

  // Biggest week (ISO week)
  const byWeek = new Map<string, { start: Date; km: number }>();
  for (const r of runs) {
    const m = mondayKey(r.date);
    const cur = byWeek.get(m) ?? { start: mondayOf(r.date), km: 0 };
    cur.km += r.distanceM / 1000;
    byWeek.set(m, cur);
  }
  let biggest: { start: Date; km: number } | null = null;
  for (const w of byWeek.values()) {
    if (!biggest || w.km > biggest.km) biggest = w;
  }

  // Current week
  const todayKey = mondayKey(new Date());
  const curWeek = byWeek.get(todayKey)?.km ?? 0;

  return {
    runs: runs.length,
    km: totalKm,
    hours: totalHours,
    avgPaceSecPerKm: paceDen > 0 ? paceNum / paceDen : null,
    avgHr:           hrDen   > 0 ? hrNum / hrDen     : null,
    avgCadenceSpm:   cadDen  > 0 ? cadNum / cadDen   : null,
    longestRunKm:    longest ? longest.distanceM / 1000 : 0,
    longestRunDurationS: longest ? longest.durationS : 0,
    longestRunDate:  longest?.date ?? null,
    biggestWeekKm:   biggest?.km ?? 0,
    biggestWeekStart: biggest?.start ?? null,
    currentWeekKm:   curWeek,
  };
}

export function lifetimeTotals(runs: RunRow[]): LifetimeRunTotals | null {
  if (!runs.length) return null;
  const t = periodTotals(runs);
  return { ...t, firstRun: runs[0].date, lastRun: runs[runs.length - 1].date };
}

function mondayOf(d: Date): Date {
  const out = new Date(d);
  out.setUTCHours(0, 0, 0, 0);
  const day = (out.getUTCDay() + 6) % 7;
  out.setUTCDate(out.getUTCDate() - day);
  return out;
}
function mondayKey(d: Date): string {
  return mondayOf(d).toISOString().slice(0, 10);
}
