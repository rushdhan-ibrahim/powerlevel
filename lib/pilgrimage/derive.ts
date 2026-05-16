/**
 * Derived metrics for The Pilgrimage.
 *
 * Pure functions over the in-memory shape produced by the FIT decoder,
 * shared by:
 *   • the backfill script (`scripts/import-fit-pilgrimage.ts`)
 *   • the daily Garmin sync route (`app/api/cron/garmin-sync/route.ts`)
 *   • aggregate readers (`lib/pilgrimage/queries.ts`)
 *
 * All distance values are metres. All durations are seconds.
 * Pace values are sec/km. Heart-rate values are bpm.
 */
import { TISSUE_MODEL, decayFromHalfLife, runStimulus, type RunSummaryForStimulus } from "./tissues";

// ─────────────────────────────────────────────────────────────────────
//  Record-level derivatives (pause-aware dt, distance deltas)
// ─────────────────────────────────────────────────────────────────────
export const PAUSE_GAP_SECONDS = 30;

export interface RecordSample {
  tSec: number;                   // seconds from run start
  distanceM?: number | null;
  speedMps?: number | null;
  hr?: number | null;
  cadenceSpm?: number | null;
  altitudeM?: number | null;
  lat?: number | null;
  lon?: number | null;
  powerW?: number | null;
  tempC?: number | null;
  pauseBreak?: boolean;
}

/**
 * Adds `dt` (seconds since previous sample, null across auto-pause gaps),
 * `distDelta` (metres since previous, zero across pauses), and sets
 * `pauseBreak = true` on the first sample after a gap > PAUSE_GAP_SECONDS.
 * Mutates in place for cheapness.
 */
export function annotateSamples(samples: RecordSample[]): void {
  let prevT: number | null = null;
  let prevDist: number | null = null;
  for (const s of samples) {
    let dt: number | null = null;
    let pause = false;
    if (prevT !== null) {
      const raw = s.tSec - prevT;
      if (raw < 0) dt = null;
      else if (raw > PAUSE_GAP_SECONDS) pause = true;
      else dt = raw;
    }
    s.pauseBreak = pause;
    (s as any)._dt = dt;
    if (typeof s.distanceM === "number" && typeof prevDist === "number" && !pause) {
      (s as any)._distDelta = Math.max(0, s.distanceM - prevDist);
    } else {
      (s as any)._distDelta = null;
    }
    prevT = s.tSec;
    if (typeof s.distanceM === "number") prevDist = s.distanceM;
  }
}

/**
 * Downsamples to one sample every `stepSec` seconds while always
 * preserving the first, last, and any pause-resume samples. Matches the
 * Python `downsample_records` semantics exactly so backfill numbers
 * line up with the standalone dashboard.
 */
export function downsampleSamples(samples: RecordSample[], stepSec: number): RecordSample[] {
  if (stepSec <= 0 || samples.length <= 2) return samples.slice();
  const out: RecordSample[] = [];
  let lastT: number | null = null;
  samples.forEach((s, i) => {
    const isLast = i === samples.length - 1;
    if (i === 0 || isLast || s.pauseBreak) {
      out.push(s);
      lastT = s.tSec;
      return;
    }
    if (lastT === null || s.tSec - lastT >= stepSec) {
      out.push(s);
      lastT = s.tSec;
    }
  });
  return out;
}

// ─────────────────────────────────────────────────────────────────────
//  Aerobic decoupling — first-half vs second-half speed/HR ratio
// ─────────────────────────────────────────────────────────────────────
export interface DecouplingResult {
  method: "distance_halves_speed_per_hr" | "insufficient_data" | "too_few_records_per_half";
  firstHr?: number;
  secondHr?: number;
  firstSpeed?: number;
  secondSpeed?: number;
  hrDriftBpm?: number;
  decouplingPct?: number;
}

export function computeDecoupling(samples: RecordSample[], distanceM: number | null | undefined): DecouplingResult {
  if (!samples.length || !distanceM || distanceM <= 0) {
    return { method: "insufficient_data" };
  }
  const half = distanceM / 2;
  const valid = (s: RecordSample) =>
    typeof s.distanceM === "number" &&
    typeof s.speedMps === "number" && s.speedMps > 0.5 &&
    typeof s.hr === "number" && s.hr >= 25 && s.hr < 255;
  const first = samples.filter(s => valid(s) && (s.distanceM as number) <= half);
  const second = samples.filter(s => valid(s) && (s.distanceM as number) > half);
  if (first.length < 20 || second.length < 20) {
    return { method: "too_few_records_per_half" };
  }
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const f_speed = mean(first.map(s => s.speedMps as number));
  const s_speed = mean(second.map(s => s.speedMps as number));
  const f_hr    = mean(first.map(s => s.hr as number));
  const s_hr    = mean(second.map(s => s.hr as number));
  const f_eff   = f_speed / f_hr;
  const s_eff   = s_speed / s_hr;
  const change  = (s_eff / f_eff - 1) * 100;
  return {
    method: "distance_halves_speed_per_hr",
    firstHr: f_hr, secondHr: s_hr,
    firstSpeed: f_speed, secondSpeed: s_speed,
    hrDriftBpm: s_hr - f_hr,
    decouplingPct: -change, // positive = efficiency loss
  };
}

// ─────────────────────────────────────────────────────────────────────
//  Best-effort windows — sweep all contiguous sub-windows of target
//  distance, return the fastest pace for each target.
// ─────────────────────────────────────────────────────────────────────
export const BEST_EFFORT_TARGETS_M = [1000, 3000, 5000, 10000] as const;
export type BestEffortTarget = typeof BEST_EFFORT_TARGETS_M[number];

export function computeBestEfforts(samples: RecordSample[]): Map<BestEffortTarget, number> {
  const out = new Map<BestEffortTarget, number>();
  const pts: { t: number; d: number }[] = samples
    .filter(s => typeof s.tSec === "number" && typeof s.distanceM === "number")
    .map(s => ({ t: s.tSec, d: s.distanceM as number }));
  if (pts.length < 2) return out;

  for (const target of BEST_EFFORT_TARGETS_M) {
    let best: number | null = null;
    let j = 0;
    for (let i = 0; i < pts.length; i++) {
      const d0 = pts[i].d;
      while (j < pts.length && pts[j].d - d0 < target) j += 1;
      if (j >= pts.length) break;
      const elapsed = pts[j].t - pts[i].t;
      const pace = elapsed / (target / 1000);
      if (pace > 0 && (best === null || pace < best)) best = pace;
    }
    if (best !== null) out.set(target, best);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────
//  HR-zone time
// ─────────────────────────────────────────────────────────────────────
export interface ZoneTime { Z1: number; Z2: number; Z3: number; Z4: number; Z5: number }

/**
 * Buckets per-sample dt into zones using manual upper boundaries
 * (default 120/140/160/180 — the user's known thresholds). Pause-gap
 * samples are excluded by virtue of dt being null on those rows.
 */
export function computeHrZoneSeconds(
  samples: RecordSample[],
  upperBoundaries: number[] = [120, 140, 160, 180],
): ZoneTime {
  const labels: (keyof ZoneTime)[] = ["Z1", "Z2", "Z3", "Z4", "Z5"];
  const totals: ZoneTime = { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 };
  for (const s of samples) {
    const hr = s.hr;
    const dt: number | null = (s as any)._dt;
    if (hr == null || hr < 25 || hr >= 255 || dt == null || dt <= 0) continue;
    let idx = 0;
    while (idx < upperBoundaries.length && hr > upperBoundaries[idx]) idx += 1;
    totals[labels[idx]] += dt;
  }
  return totals;
}

// ─────────────────────────────────────────────────────────────────────
//  CTL / ATL / TSB (Banister-style) — daily km as load proxy
// ─────────────────────────────────────────────────────────────────────
export interface FitnessSnapshot { ctl: number; atl: number; tsb: number }

/**
 * Walk the entire history day-by-day and return the snapshot AS OF
 * a target date. Caller provides the daily km series (already
 * aggregated). Used to stamp ctlAtEnd/atlAtEnd/tsbAtEnd on each Run
 * at import time.
 */
export function ctlAtlSeries(dailyKm: number[]): FitnessSnapshot[] {
  const ctlDecay = Math.exp(-1 / 42);
  const atlDecay = Math.exp(-1 / 7);
  let ctl = 0, atl = 0;
  return dailyKm.map((load) => {
    ctl = ctl * ctlDecay + load * (1 - ctlDecay);
    atl = atl * atlDecay + load * (1 - atlDecay);
    return { ctl, atl, tsb: ctl - atl };
  });
}

// ─────────────────────────────────────────────────────────────────────
//  ACWR — 7-day acute vs 28-day chronic (weekly-average)
// ─────────────────────────────────────────────────────────────────────
export interface AcwrSeriesPoint { acute: number; chronic: number; acwr: number | null }

export function acwrSeries(dailyKm: number[]): AcwrSeriesPoint[] {
  const out: AcwrSeriesPoint[] = [];
  let w7 = 0, w28 = 0;
  for (let i = 0; i < dailyKm.length; i++) {
    w7 += dailyKm[i];
    if (i >= 7) w7 -= dailyKm[i - 7];
    w28 += dailyKm[i];
    if (i >= 28) w28 -= dailyKm[i - 28];
    const chronic = w28 / 4;
    out.push({
      acute: w7,
      chronic,
      acwr: chronic > 0.5 ? w7 / chronic : null,
    });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────
//  Tissue adaptation timeseries
// ─────────────────────────────────────────────────────────────────────
export interface TissueSnapshot {
  current: number;
  peak: number;
  peakDateIndex: number;
  currentPctOfPeak: number;
  acuteLoad: number;            // mean raw stimulus over last 7 days
  chronicLoad: number;          // mean raw stimulus over last 28 days
  acuteChronicRatio: number | null;
}

/**
 * Compute the per-day EWMA stimulus for one tissue, plus the snapshot
 * at the end of the window. `runsByDayIndex[i]` is the array of runs
 * (RunSummaryForStimulus) that happened on day i.
 */
export function tissueSeries(
  runsByDayIndex: RunSummaryForStimulus[][],
  tissueId: string,
): { series: number[]; snapshot: TissueSnapshot } {
  const tissue = TISSUE_MODEL.find(t => t.id === tissueId);
  if (!tissue) throw new Error(`unknown tissue: ${tissueId}`);
  const decay = decayFromHalfLife(tissue.halfLifeDays);
  const series: number[] = [];
  const raw: number[] = [];
  let state = 0;
  for (const runs of runsByDayIndex) {
    const stim = runs.reduce((a, r) => a + runStimulus(r, tissueId), 0);
    state = state * decay + stim * (1 - decay);
    series.push(state);
    raw.push(stim);
  }
  const peak = series.length ? Math.max(...series) : 0;
  const peakIdx = series.indexOf(peak);
  const acute = raw.slice(-7).reduce((a, b) => a + b, 0) / 7;
  const chronic = raw.slice(-28).reduce((a, b) => a + b, 0) / 28;
  const snapshot: TissueSnapshot = {
    current: state,
    peak,
    peakDateIndex: peakIdx,
    currentPctOfPeak: peak > 0 ? (100 * state) / peak : 0,
    acuteLoad: acute,
    chronicLoad: chronic,
    acuteChronicRatio: chronic > 0.05 ? acute / chronic : null,
  };
  return { series, snapshot };
}
