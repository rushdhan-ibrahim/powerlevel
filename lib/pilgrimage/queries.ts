/**
 * Database reads for The Pilgrimage. Thin wrappers around Prisma —
 * all aggregation logic lives in `derive.ts` to keep this file boring.
 */
import { prisma } from "@/lib/db";
import { acwrSeries, ctlAtlSeries, tissueSeries, type FitnessSnapshot, type TissueSnapshot } from "./derive";
import { TISSUE_MODEL, type RunSummaryForStimulus } from "./tissues";

const DAY_MS = 86_400_000;

/** Convenience: list runs ordered by start time. */
export async function listRuns(limit = 200) {
  return prisma.run.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
  });
}

/** Single run with laps + best efforts (records loaded separately). */
export async function getRun(id: string) {
  return prisma.run.findUnique({
    where: { id },
    include: { laps: { orderBy: { lapIndex: "asc" } }, bestEfforts: true },
  });
}

/** Returns one row per calendar day from `first` to `last` (inclusive). */
export interface DailyKmRow { date: string; km: number; runs: number }

export async function dailyKmSeries(): Promise<DailyKmRow[]> {
  const runs = await prisma.run.findMany({
    orderBy: { startedAt: "asc" },
    select: {
      startedAtLocal: true, distanceM: true, durationS: true,
      avgHr: true, avgCadenceSpm: true,
    },
  });
  if (!runs.length) return [];
  const byDate = new Map<string, { km: number; runs: number }>();
  for (const r of runs) {
    const iso = r.startedAtLocal.toISOString().slice(0, 10);
    const acc = byDate.get(iso) ?? { km: 0, runs: 0 };
    acc.km += r.distanceM / 1000;
    acc.runs += 1;
    byDate.set(iso, acc);
  }
  const first = new Date(runs[0].startedAtLocal.toISOString().slice(0, 10) + "T00:00:00Z");
  const last  = new Date(runs[runs.length - 1].startedAtLocal.toISOString().slice(0, 10) + "T00:00:00Z");
  const out: DailyKmRow[] = [];
  for (let t = first.getTime(); t <= last.getTime(); t += DAY_MS) {
    const iso = new Date(t).toISOString().slice(0, 10);
    const cell = byDate.get(iso);
    out.push({ date: iso, km: cell?.km ?? 0, runs: cell?.runs ?? 0 });
  }
  return out;
}

/** Snapshot of every tissue's adaptation state as of today. */
export async function tissueSnapshots(): Promise<Record<string, TissueSnapshot>> {
  const runs = await prisma.run.findMany({
    orderBy: { startedAt: "asc" },
    select: { startedAtLocal: true, distanceM: true, durationS: true, avgHr: true, avgCadenceSpm: true },
  });
  if (!runs.length) {
    return Object.fromEntries(TISSUE_MODEL.map(t => [t.id, emptySnapshot()]));
  }
  const first = new Date(runs[0].startedAtLocal.toISOString().slice(0, 10) + "T00:00:00Z");
  const last  = new Date(runs[runs.length - 1].startedAtLocal.toISOString().slice(0, 10) + "T00:00:00Z");
  const days = Math.round((last.getTime() - first.getTime()) / DAY_MS) + 1;
  const runsByDay: RunSummaryForStimulus[][] = Array.from({ length: days }, () => []);
  for (const r of runs) {
    const iso = r.startedAtLocal.toISOString().slice(0, 10);
    const idx = Math.round((new Date(iso + "T00:00:00Z").getTime() - first.getTime()) / DAY_MS);
    runsByDay[idx].push({
      distanceKm: r.distanceM / 1000,
      durationS: r.durationS,
      avgHr: r.avgHr,
      avgCadenceSpm: r.avgCadenceSpm,
    });
  }
  const out: Record<string, TissueSnapshot> = {};
  for (const t of TISSUE_MODEL) {
    out[t.id] = tissueSeries(runsByDay, t.id).snapshot;
  }
  return out;
}

/** Today's CTL/ATL/TSB (Banister) snapshot. */
export async function fitnessNow(): Promise<FitnessSnapshot> {
  const rows = await dailyKmSeries();
  if (!rows.length) return { ctl: 0, atl: 0, tsb: 0 };
  const series = ctlAtlSeries(rows.map(r => r.km));
  return series[series.length - 1];
}

/** ACWR snapshot at the most recent day. */
export async function acwrNow(): Promise<{ acute: number; chronic: number; acwr: number | null }> {
  const rows = await dailyKmSeries();
  if (!rows.length) return { acute: 0, chronic: 0, acwr: null };
  const series = acwrSeries(rows.map(r => r.km));
  return series[series.length - 1];
}

/** All-time best-effort PRs per target distance. */
export async function allTimeBestEfforts(): Promise<{ distanceM: number; paceSecPerKm: number; runId: string; date: Date }[]> {
  const bests = await prisma.runBestEffort.findMany({
    include: { run: { select: { id: true, startedAtLocal: true } } },
  });
  const byDist = new Map<number, typeof bests[number]>();
  for (const b of bests) {
    const prev = byDist.get(b.distanceM);
    if (!prev || b.paceSecPerKm < prev.paceSecPerKm) byDist.set(b.distanceM, b);
  }
  return Array.from(byDist.values())
    .map(b => ({ distanceM: b.distanceM, paceSecPerKm: b.paceSecPerKm, runId: b.runId, date: b.run.startedAtLocal }))
    .sort((a, b) => a.distanceM - b.distanceM);
}

function emptySnapshot(): TissueSnapshot {
  return { current: 0, peak: 0, peakDateIndex: 0, currentPctOfPeak: 0, acuteLoad: 0, chronicLoad: 0, acuteChronicRatio: null };
}
