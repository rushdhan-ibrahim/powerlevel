/**
 * Totals — period-scoped counting of reps, tonnage, sessions,
 * heavy work above a fraction of the lifter's true 1RM.
 *
 * "True 1RM" here = heaviest single rep ever performed (a real
 * achievement, not the Epley estimate). Heavy-work counts the
 * reps performed at or above a threshold percentage of that.
 */

import { format } from "date-fns";
import {
  liftKey,
  setTonnage,
  toKg,
  type WorkoutRow,
  type ExerciseRow,
  type SetRow,
} from "./insights";

export type Period = { start: Date; end: Date };

/** All workouts in the period (inclusive on both ends). */
export function inPeriod(workouts: WorkoutRow[], p: Period): WorkoutRow[] {
  const startMs = p.start.getTime();
  const endMs = p.end.getTime();
  return workouts.filter((w) => {
    const t = w.date.getTime();
    return t >= startMs && t <= endMs;
  });
}

export type PeriodTotals = {
  sessions: number;
  workingSets: number;
  totalReps: number;
  tonnage: number;
};

function isWeighted(category: string | null | undefined): boolean {
  return category == null || category === "weighted_reps" || category === "bodyweight_reps";
}

export function periodTotals(workouts: WorkoutRow[]): PeriodTotals {
  let sessions = 0;
  let workingSets = 0;
  let totalReps = 0;
  let tonnage = 0;
  for (const w of workouts) {
    sessions += 1;
    for (const ex of w.exercises) {
      for (const s of ex.sets) {
        if (s.isWarmup) continue;
        workingSets += 1;
        if (s.reps != null) totalReps += s.reps;
        if (isWeighted(ex.category)) tonnage += setTonnage(s);
      }
    }
  }
  return {
    sessions,
    workingSets,
    totalReps,
    tonnage: Math.round(tonnage),
  };
}

/** Tonnage day-by-day in the period — used for the brush sparkline. */
export function dailyTonnage(workouts: WorkoutRow[]): { date: string; tonnage: number; sessions: number }[] {
  const map = new Map<string, { tonnage: number; sessions: number }>();
  for (const w of workouts) {
    const k = format(w.date, "yyyy-MM-dd");
    const cur = map.get(k) ?? { tonnage: 0, sessions: 0 };
    cur.sessions += 1;
    for (const ex of w.exercises) {
      if (!isWeighted(ex.category)) continue;
      for (const s of ex.sets) {
        if (s.isWarmup) continue;
        cur.tonnage += setTonnage(s);
      }
    }
    map.set(k, cur);
  }
  return Array.from(map.entries())
    .map(([date, v]) => ({ date, tonnage: Math.round(v.tonnage), sessions: v.sessions }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/* ─── per-exercise totals + heavy-work ───────────────────── */

export type ExerciseTotals = {
  liftKey: string;
  displayName: string;
  category: string | null | undefined;
  sessions: number;
  workingSets: number;
  totalReps: number;
  tonnage: number;
  trueMax: number; // heaviest single rep, in kg, in the WHOLE history
  heavyWork: HeavyBand[];
};

export type HeavyBand = {
  threshold: number; // 0.50, 0.70, 0.80, 0.90 …
  reps: number;       // working reps at weight >= threshold * trueMax
};

const HEAVY_BANDS = [0.5, 0.7, 0.8, 0.9, 0.95];

/**
 * For each lift the user has performed in the period, count how many
 * working reps in the period landed at or above each percentage of
 * the lifter's all-time true 1RM (heaviest single rep ever).
 */
export function exerciseTotalsInPeriod(
  allWorkouts: WorkoutRow[],
  period: Period,
): ExerciseTotals[] {
  // 1. Compute true max across ALL HISTORY for each lift
  const trueMaxByLift = new Map<string, number>();
  const displayByLift = new Map<string, string>();
  const categoryByLift = new Map<string, string | null | undefined>();

  for (const w of allWorkouts) {
    for (const ex of w.exercises) {
      const key = liftKey(ex);
      displayByLift.set(key, ex.name);
      categoryByLift.set(key, ex.category);
      for (const s of ex.sets) {
        if (s.isWarmup) continue;
        if (s.weight == null || s.reps == null) continue;
        const wkg = toKg(s.weight, s.weightUnit);
        if (wkg <= 0) continue;
        const cur = trueMaxByLift.get(key) ?? 0;
        if (wkg > cur) trueMaxByLift.set(key, wkg);
      }
    }
  }

  // 2. Walk the period and accumulate per-lift totals
  type Acc = {
    sessions: Set<string>;
    workingSets: number;
    totalReps: number;
    tonnage: number;
    repsByBand: number[]; // length = HEAVY_BANDS.length
  };
  const acc = new Map<string, Acc>();

  const inP = inPeriod(allWorkouts, period);
  for (const w of inP) {
    const wKey = format(w.date, "yyyy-MM-dd");
    for (const ex of w.exercises) {
      const key = liftKey(ex);
      const bucket = acc.get(key) ?? {
        sessions: new Set<string>(),
        workingSets: 0,
        totalReps: 0,
        tonnage: 0,
        repsByBand: HEAVY_BANDS.map(() => 0),
      };
      bucket.sessions.add(wKey);
      const tMax = trueMaxByLift.get(key) ?? 0;
      for (const s of ex.sets) {
        if (s.isWarmup) continue;
        bucket.workingSets += 1;
        if (s.reps != null) bucket.totalReps += s.reps;
        if (isWeighted(ex.category)) {
          bucket.tonnage += setTonnage(s);
          if (s.weight != null && s.reps != null && tMax > 0) {
            const wkg = toKg(s.weight, s.weightUnit);
            for (let b = 0; b < HEAVY_BANDS.length; b++) {
              if (wkg >= HEAVY_BANDS[b] * tMax) {
                bucket.repsByBand[b] += s.reps;
              }
            }
          }
        }
      }
      acc.set(key, bucket);
    }
  }

  return Array.from(acc.entries())
    .map(([key, a]) => ({
      liftKey: key,
      displayName: displayByLift.get(key) ?? key,
      category: categoryByLift.get(key),
      sessions: a.sessions.size,
      workingSets: a.workingSets,
      totalReps: a.totalReps,
      tonnage: Math.round(a.tonnage),
      trueMax: Math.round(trueMaxByLift.get(key) ?? 0),
      heavyWork: HEAVY_BANDS.map((th, i) => ({ threshold: th, reps: a.repsByBand[i] })),
    }))
    .sort((a, b) => b.tonnage - a.tonnage || b.totalReps - a.totalReps);
}

export const HEAVY_THRESHOLDS = HEAVY_BANDS;

/* ─── presets ───────────────────────────────────────────── */

export type PresetKey = "7d" | "30d" | "90d" | "365d" | "all";

export function presetPeriod(key: PresetKey, allWorkouts: WorkoutRow[]): Period {
  const today = new Date();
  const earliest = allWorkouts.reduce<Date>(
    (d, w) => (w.date < d ? w.date : d),
    today,
  );
  switch (key) {
    case "7d":
      return { start: addDays(today, -6), end: today };
    case "30d":
      return { start: addDays(today, -29), end: today };
    case "90d":
      return { start: addDays(today, -89), end: today };
    case "365d":
      return { start: addDays(today, -364), end: today };
    case "all":
      return { start: earliest, end: today };
  }
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Re-export, used by callers that work in raw set arrays. */
export { setTonnage } from "./insights";

/** Helper: compute tonnage of a set list (handy for one-off slices). */
export function tonnageOf(sets: SetRow[], category?: string | null | undefined): number {
  if (!isWeighted(category)) return 0;
  return Math.round(sets.reduce((s, set) => s + setTonnage(set), 0));
}

/** Helper: total working reps in a set list. */
export function repsOf(sets: SetRow[]): number {
  return sets.filter((s) => !s.isWarmup && s.reps != null).reduce((n, s) => n + (s.reps ?? 0), 0);
}

/** Helper exported for typing convenience. */
export type { ExerciseRow, SetRow };
