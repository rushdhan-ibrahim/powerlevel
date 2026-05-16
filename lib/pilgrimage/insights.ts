/**
 * Data shapes for the /insights §VII Pilgrimage section. Page-specific
 * aggregations live here so the page.tsx stays a thin render layer.
 */
import { prisma } from "@/lib/db";
import { tissueSnapshots } from "./queries";
import type { TissueSnapshot } from "./derive";
import { TISSUE_MODEL } from "./tissues";

const DAY_MS = 86_400_000;

export type PhaseLabel = "build" | "maintain" | "detrain" | "ramp" | "off";

export interface PhaseBand {
  start: Date;
  end: Date;
  phase: PhaseLabel;
  weeks: number;
  totalKm: number;
}

export interface PathPoint {
  lat: number;
  lon: number;
}

export interface RunPath {
  runId: string;
  date: Date;
  points: PathPoint[];
}

export interface CadenceSample {
  runId: string;
  date: Date;
  cadenceSpm: number;
}

export interface HeartSummary {
  recentAvgHr: number | null;       // 28-day avg HR (weighted by km)
  recentMaxHr: number | null;       // peak in 28 days
  lifetimeMaxHr: number | null;     // peak ever
  // Snapshots of the four cardiovascular tissues
  plasmaSnapshot: TissueSnapshot;
  strokeVolumeSnapshot: TissueSnapshot;
  mitochondrialSnapshot: TissueSnapshot;
  capillarySnapshot: TissueSnapshot;
  // Pace at fixed effort (HR 165 ± 8) over last 4 weeks for the
  // satellite arc "aerobic gain at fixed effort"
  paceAtEffort: { secPerKm: number; date: Date }[];
}

export interface PilgrimageInsights {
  hasAny: boolean;
  tissues: Record<string, TissueSnapshot>;
  phaseBands: PhaseBand[];
  paths: RunPath[];
  cadences: CadenceSample[];
  heart: HeartSummary;
}

export async function loadPilgrimageInsights(): Promise<PilgrimageInsights> {
  const runs = await prisma.run.findMany({
    orderBy: { startedAtLocal: "asc" },
    select: {
      id: true, startedAtLocal: true, distanceM: true, durationS: true,
      avgHr: true, maxHr: true, avgCadenceSpm: true,
    },
  });
  if (runs.length === 0) {
    return {
      hasAny: false,
      tissues: Object.fromEntries(TISSUE_MODEL.map(t => [t.id, EMPTY_TISSUE])) as Record<string, TissueSnapshot>,
      phaseBands: [],
      paths: [],
      cadences: [],
      heart: EMPTY_HEART,
    };
  }

  const tissues = await tissueSnapshots();

  // Phase detection — weekly km → phase label, then merge contiguous bands
  const phaseBands = detectPhaseBands(runs);

  // GPS paths: downsampled record samples per run (every ~10 s suffices for map view)
  // We pull from RunRecord rather than the raw FIT bytes — already 5-s downsampled
  // by the ingest, so we just thin further to ~30-50 points per run.
  const paths = await loadAggregatedPaths();

  // Cadence — last ~30 runs with cadence
  const cadences: CadenceSample[] = runs
    .filter(r => r.avgCadenceSpm != null)
    .slice(-30)
    .map(r => ({
      runId: r.id,
      date: r.startedAtLocal,
      cadenceSpm: r.avgCadenceSpm as number,
    }));

  // Heart summary
  const today = runs[runs.length - 1].startedAtLocal;
  const cutoff28 = new Date(today.getTime() - 28 * DAY_MS);
  const recent = runs.filter(r => r.startedAtLocal >= cutoff28);
  const hrWeighted = recent.reduce(
    (acc, r) => {
      if (r.avgHr == null || r.distanceM == null) return acc;
      acc.num += r.avgHr * r.distanceM;
      acc.den += r.distanceM;
      return acc;
    },
    { num: 0, den: 0 },
  );
  const recentAvgHr = hrWeighted.den > 0 ? hrWeighted.num / hrWeighted.den : null;
  const recentMaxHr = recent.reduce<number | null>(
    (m, r) => (r.maxHr != null ? Math.max(m ?? 0, r.maxHr) : m),
    null,
  );
  const lifetimeMaxHr = runs.reduce<number | null>(
    (m, r) => (r.maxHr != null ? Math.max(m ?? 0, r.maxHr) : m),
    null,
  );

  const paceAtEffort = await loadPaceAtEffort(165, 8, 28);

  const heart: HeartSummary = {
    recentAvgHr,
    recentMaxHr,
    lifetimeMaxHr,
    plasmaSnapshot:        tissues.plasma_volume,
    strokeVolumeSnapshot:  tissues.stroke_volume,
    mitochondrialSnapshot: tissues.mitochondrial_density,
    capillarySnapshot:     tissues.capillary_density,
    paceAtEffort,
  };

  return { hasAny: true, tissues, phaseBands, paths, cadences, heart };
}

// ─── Phase detection ────────────────────────────────────────────────
function detectPhaseBands(runs: { startedAtLocal: Date; distanceM: number }[]): PhaseBand[] {
  if (!runs.length) return [];
  // Build week-buckets
  const first = runs[0].startedAtLocal;
  const last  = runs[runs.length - 1].startedAtLocal;
  const monday = mondayOf(first);
  const lastMonday = mondayOf(last);
  const weeks: { start: Date; km: number }[] = [];
  for (let t = monday.getTime(); t <= lastMonday.getTime(); t += 7 * DAY_MS) {
    weeks.push({ start: new Date(t), km: 0 });
  }
  for (const r of runs) {
    const m = mondayOf(r.startedAtLocal);
    const idx = Math.floor((m.getTime() - monday.getTime()) / (7 * DAY_MS));
    if (idx >= 0 && idx < weeks.length) {
      weeks[idx].km += r.distanceM / 1000;
    }
  }
  // Per-week phase using rolling-4 vs prior-4 mean
  const phases: PhaseLabel[] = weeks.map((w, i) => {
    const recent = weeks.slice(Math.max(0, i - 3), i + 1).map(x => x.km);
    const prior  = weeks.slice(Math.max(0, i - 7), Math.max(0, i - 3)).map(x => x.km);
    const r = mean(recent), p = mean(prior);
    if (w.km < 1) return "off";
    if (p === 0)  return "ramp";
    if (r > p * 1.15) return "build";
    if (r < p * 0.7)  return "detrain";
    return "maintain";
  });
  // Merge contiguous same-phase weeks into bands
  const bands: PhaseBand[] = [];
  let bandStart = 0;
  for (let i = 1; i <= phases.length; i++) {
    if (i === phases.length || phases[i] !== phases[bandStart]) {
      const startWeek = weeks[bandStart];
      const endWeek   = weeks[i - 1];
      bands.push({
        start: startWeek.start,
        end:   new Date(endWeek.start.getTime() + 6 * DAY_MS),
        phase: phases[bandStart],
        weeks: i - bandStart,
        totalKm: weeks.slice(bandStart, i).reduce((a, b) => a + b.km, 0),
      });
      bandStart = i;
    }
  }
  return bands;
}

function mondayOf(d: Date): Date {
  const out = new Date(d);
  out.setUTCHours(0, 0, 0, 0);
  const day = (out.getUTCDay() + 6) % 7; // Mon = 0
  out.setUTCDate(out.getUTCDate() - day);
  return out;
}

function mean(xs: number[]): number {
  if (!xs.length) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

// ─── GPS paths ──────────────────────────────────────────────────────
async function loadAggregatedPaths(): Promise<RunPath[]> {
  // Pull lat/lon-bearing records, downsampled at the DB level by taking
  // every Nth row to keep this cheap. 5-second cadence already, so taking
  // every 6th sample gives 30s spacing — plenty for a composite map view.
  const records = await prisma.runRecord.findMany({
    where: { lat: { not: null }, lon: { not: null } },
    select: { runId: true, lat: true, lon: true, tSec: true },
    orderBy: [{ runId: "asc" }, { tSec: "asc" }],
  });
  const runMeta = await prisma.run.findMany({
    select: { id: true, startedAtLocal: true },
    orderBy: { startedAtLocal: "asc" },
  });
  const metaMap = new Map(runMeta.map(r => [r.id, r.startedAtLocal]));
  const byRun = new Map<string, PathPoint[]>();
  let lastRunId = "";
  let counter = 0;
  for (const r of records) {
    if (r.runId !== lastRunId) {
      lastRunId = r.runId;
      counter = 0;
    }
    if (counter % 6 === 0) {
      const arr = byRun.get(r.runId) ?? [];
      arr.push({ lat: r.lat as number, lon: r.lon as number });
      byRun.set(r.runId, arr);
    }
    counter += 1;
  }
  return Array.from(byRun.entries()).map(([runId, points]) => ({
    runId,
    date: metaMap.get(runId) ?? new Date(0),
    points,
  }));
}

// ─── Pace at fixed effort (recent window) ───────────────────────────
async function loadPaceAtEffort(
  hrTarget: number, tol: number, days: number,
): Promise<{ secPerKm: number; date: Date }[]> {
  const today = new Date();
  const cutoff = new Date(today.getTime() - days * DAY_MS);
  const runs = await prisma.run.findMany({
    where: {
      startedAtLocal: { gte: cutoff },
      avgHr: { gte: hrTarget - tol, lte: hrTarget + tol },
      avgPaceSecPerKm: { not: null },
    },
    select: { startedAtLocal: true, avgPaceSecPerKm: true },
    orderBy: { startedAtLocal: "asc" },
  });
  return runs.map(r => ({
    secPerKm: r.avgPaceSecPerKm as number,
    date: r.startedAtLocal,
  }));
}

// ─── Empty/zero shapes ──────────────────────────────────────────────
const EMPTY_TISSUE: TissueSnapshot = {
  current: 0, peak: 0, peakDateIndex: 0, currentPctOfPeak: 0,
  acuteLoad: 0, chronicLoad: 0, acuteChronicRatio: null,
};
const EMPTY_HEART: HeartSummary = {
  recentAvgHr: null, recentMaxHr: null, lifetimeMaxHr: null,
  plasmaSnapshot: EMPTY_TISSUE,
  strokeVolumeSnapshot: EMPTY_TISSUE,
  mitochondrialSnapshot: EMPTY_TISSUE,
  capillarySnapshot: EMPTY_TISSUE,
  paceAtEffort: [],
};
