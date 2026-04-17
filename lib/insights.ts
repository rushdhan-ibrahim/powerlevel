import { differenceInCalendarDays, format, startOfWeek, subDays, subWeeks } from "date-fns";
import { resolveLiftKey } from "./exercise_library";

export type SetRow = {
  weight: number | null;
  weightUnit: string | null;
  reps: number | null;
  rpe: number | null;
  isWarmup: boolean;
  durationSec?: number | null;
  distanceM?: number | null;
  notes?: string | null;
};

export type ExerciseRow = {
  id: string;
  name: string;
  normalizedName: string;
  canonicalSlug?: string | null;
  category?: string | null;
  variation?: string | null;
  muscleGroup: string | null;
  notes?: string | null;
  sets: SetRow[];
};

export type WorkoutRow = {
  id: string;
  date: Date;
  title: string | null;
  exercises: ExerciseRow[];
};

const LB_TO_KG = 0.453592;

/**
 * Convert whatever unit a set was entered in into the canonical kg.
 * Bodyweight sets (unit = "bw") have no recordable load and return 0.
 */
export function toKg(weight: number | null, unit: string | null): number {
  if (weight == null) return 0;
  if (unit === "lb") return weight * LB_TO_KG;
  if (unit === "bw") return 0;
  return weight; // kg default
}

/**
 * Stable lift identity for grouping across workouts. Walks several
 * fallbacks so that "Bench press", "Benchpress", "BENCH PRESS  ",
 * "Band pull aparts", and "Banded pull aparts" all resolve to the
 * same canonical key — preventing the same lift from showing up
 * twice in any analysis.
 */
export function liftKey(ex: {
  canonicalSlug?: string | null;
  normalizedName: string;
  name?: string;
}): string {
  return resolveLiftKey(ex.name ?? ex.normalizedName, ex.canonicalSlug);
}

/**
 * Categories whose sets contribute to weight×reps math (e1RM, tonnage).
 * Timed holds, carries, distance work, cardio are excluded from these.
 */
function contributesToWeightedMath(category: string | null | undefined): boolean {
  return category == null || category === "weighted_reps" || category === "bodyweight_reps";
}

/**
 * Estimated 1RM using the Epley formula: weight × (1 + reps / 30).
 */
export function epley(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function bestE1RM(sets: SetRow[], category?: string | null): number {
  if (!contributesToWeightedMath(category)) return 0;
  let best = 0;
  for (const s of sets) {
    if (s.isWarmup) continue;
    if (s.weight == null || s.reps == null) continue;
    if (s.reps > 12) continue;
    const e = epley(toKg(s.weight, s.weightUnit), s.reps);
    if (e > best) best = e;
  }
  return Math.round(best);
}

export function setTonnage(s: SetRow): number {
  if (s.isWarmup) return 0;
  if (s.weight == null || s.reps == null) return 0;
  return toKg(s.weight, s.weightUnit) * s.reps;
}

export function workoutTonnage(w: WorkoutRow): number {
  return w.exercises.reduce((sum, ex) => {
    if (!contributesToWeightedMath(ex.category)) return sum;
    return sum + ex.sets.reduce((s, set) => s + setTonnage(set), 0);
  }, 0);
}

export function workoutWorkingSets(w: WorkoutRow): number {
  return w.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => !s.isWarmup).length,
    0,
  );
}

/* ---------------- aggregate metrics ---------------- */

export function totalsAcross(workouts: WorkoutRow[]) {
  const totalTonnage = workouts.reduce((s, w) => s + workoutTonnage(w), 0);
  const totalSets = workouts.reduce((s, w) => s + workoutWorkingSets(w), 0);
  return {
    sessions: workouts.length,
    tonnage: Math.round(totalTonnage),
    sets: totalSets,
  };
}

export function currentStreak(workouts: WorkoutRow[]): number {
  if (workouts.length === 0) return 0;
  const days = new Set(workouts.map((w) => format(w.date, "yyyy-MM-dd")));
  let streak = 0;
  let cursor = new Date();
  let gapAllowed = 1;
  while (true) {
    const key = format(cursor, "yyyy-MM-dd");
    if (days.has(key)) {
      streak++;
      gapAllowed = 1;
    } else if (gapAllowed > 0) {
      gapAllowed--;
    } else {
      break;
    }
    cursor = subDays(cursor, 1);
    if (streak > 365) break;
  }
  return streak;
}

export function sessionsInLastNDays(workouts: WorkoutRow[], n: number): number {
  const cutoff = subDays(new Date(), n);
  return workouts.filter((w) => w.date >= cutoff).length;
}

export function tonnageInLastNDays(workouts: WorkoutRow[], n: number): number {
  const cutoff = subDays(new Date(), n);
  return Math.round(
    workouts.filter((w) => w.date >= cutoff).reduce((s, w) => s + workoutTonnage(w), 0),
  );
}

/* ---------------- weekly tonnage ---------------- */

export function weeklyTonnage(
  workouts: WorkoutRow[],
  weeks: number = 12,
): { week: string; tonnage: number; sessions: number }[] {
  const now = new Date();
  const buckets = new Map<string, { tonnage: number; sessions: number }>();
  for (let i = weeks - 1; i >= 0; i--) {
    const d = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    buckets.set(format(d, "yyyy-MM-dd"), { tonnage: 0, sessions: 0 });
  }
  for (const w of workouts) {
    const k = format(startOfWeek(w.date, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const b = buckets.get(k);
    if (!b) continue;
    b.tonnage += workoutTonnage(w);
    b.sessions += 1;
  }
  return Array.from(buckets.entries()).map(([week, v]) => ({
    week,
    tonnage: Math.round(v.tonnage),
    sessions: v.sessions,
  }));
}

/* ---------------- muscle group volume ---------------- */

const MUSCLE_LABEL: Record<string, string> = {
  chest: "Chest", back: "Back", shoulders: "Shoulders",
  biceps: "Biceps", triceps: "Triceps", forearms: "Forearms",
  quads: "Quads", hamstrings: "Hamstrings", glutes: "Glutes",
  calves: "Calves", core: "Core",
  full_body: "Full Body", cardio: "Cardio", other: "Other",
};

export function muscleGroupVolume(
  workouts: WorkoutRow[],
  daysBack: number = 28,
): { group: string; sets: number; tonnage: number }[] {
  const cutoff = subDays(new Date(), daysBack);
  const tally = new Map<string, { sets: number; tonnage: number }>();

  for (const w of workouts) {
    if (w.date < cutoff) continue;
    for (const ex of w.exercises) {
      const g = ex.muscleGroup ?? "other";
      const cur = tally.get(g) ?? { sets: 0, tonnage: 0 };
      for (const s of ex.sets) {
        if (s.isWarmup) continue;
        cur.sets += 1;
        if (contributesToWeightedMath(ex.category)) {
          cur.tonnage += setTonnage(s);
        }
      }
      tally.set(g, cur);
    }
  }
  const majors = ["chest", "back", "shoulders", "quads", "hamstrings", "core", "biceps", "triceps"];
  return majors.map((g) => {
    const v = tally.get(g) ?? { sets: 0, tonnage: 0 };
    return {
      group: MUSCLE_LABEL[g] ?? g,
      sets: v.sets,
      tonnage: Math.round(v.tonnage),
    };
  });
}

/* ---------------- per-exercise progression ---------------- */

export type ExerciseSession = {
  date: Date;
  workoutId: string;
  e1RM: number;
  topSet: { weight: number; reps: number } | null;
  totalVolume: number;
  category?: string | null;
};

export function exerciseHistory(workouts: WorkoutRow[], lift: string): ExerciseSession[] {
  const result: ExerciseSession[] = [];
  for (const w of workouts) {
    const matches = w.exercises.filter((e) => liftKey(e) === lift);
    if (matches.length === 0) continue;
    const allSets = matches.flatMap((e) => e.sets);
    const cat = matches[0]?.category ?? null;
    const e1RM = bestE1RM(allSets, cat);
    let topSet: ExerciseSession["topSet"] = null;
    let topWeight = 0;
    for (const s of allSets) {
      if (s.isWarmup) continue;
      if (s.weight == null || s.reps == null) continue;
      const wkg = toKg(s.weight, s.weightUnit);
      if (wkg > topWeight) {
        topWeight = wkg;
        topSet = { weight: Math.round(wkg), reps: s.reps };
      }
    }
    const totalVolume = contributesToWeightedMath(cat)
      ? allSets.reduce((s, set) => s + setTonnage(set), 0)
      : 0;
    result.push({
      date: w.date,
      workoutId: w.id,
      e1RM,
      topSet,
      totalVolume: Math.round(totalVolume),
      category: cat,
    });
  }
  return result.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/* ---------------- PRs and stagnation ---------------- */

export type PR = {
  exerciseName: string;
  liftKey: string;
  /** @deprecated alias for liftKey kept so existing callers continue to work */
  normalizedName: string;
  date: Date;
  workoutId: string;
  e1RM: number;
  prevBest: number;
  improvement: number;
};

/**
 * Group every PR (across all lifts) by ISO month so we can chart how
 * frequently new ground was broken over time. Months with zero PRs are
 * filled in so the chart doesn't have visual gaps.
 */
export function prsByMonth(
  workouts: WorkoutRow[],
  monthsBack: number = 12,
): { x: string; y: number }[] {
  const sorted = [...workouts].sort((a, b) => a.date.getTime() - b.date.getTime());
  const seen = new Map<string, number>();
  const counts = new Map<string, number>();
  for (const w of sorted) {
    for (const ex of w.exercises) {
      const e = bestE1RM(ex.sets, ex.category);
      if (e === 0) continue;
      const key = liftKey(ex);
      const prev = seen.get(key) ?? 0;
      if (e > prev) {
        seen.set(key, e);
        if (prev > 0) {
          // ignore the first appearance (not really a "PR" — just a baseline)
          const k = format(w.date, "yyyy-MM");
          counts.set(k, (counts.get(k) ?? 0) + 1);
        }
      }
    }
  }
  // Build month range from `monthsBack` ago through this month, inclusive,
  // so the line is continuous and aligned to the calendar.
  const now = new Date();
  const out: { x: string; y: number }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const k = format(d, "yyyy-MM");
    out.push({ x: `${k}-15`, y: counts.get(k) ?? 0 });
  }
  return out;
}

export function recentPRs(workouts: WorkoutRow[], daysBack: number = 28): PR[] {
  const sorted = [...workouts].sort((a, b) => a.date.getTime() - b.date.getTime());
  const seen = new Map<string, { best: number; displayName: string }>();
  const prs: PR[] = [];
  const cutoff = subDays(new Date(), daysBack);

  for (const w of sorted) {
    for (const ex of w.exercises) {
      const e = bestE1RM(ex.sets, ex.category);
      if (e === 0) continue;
      const key = liftKey(ex);
      const prev = seen.get(key);
      if (!prev) {
        seen.set(key, { best: e, displayName: ex.name });
        if (w.date >= cutoff) {
          prs.push({
            exerciseName: ex.name,
            liftKey: key,
            normalizedName: key,
            date: w.date,
            workoutId: w.id,
            e1RM: e,
            prevBest: 0,
            improvement: 0,
          });
        }
      } else if (e > prev.best) {
        if (w.date >= cutoff) {
          prs.push({
            exerciseName: ex.name,
            liftKey: key,
            normalizedName: key,
            date: w.date,
            workoutId: w.id,
            e1RM: e,
            prevBest: prev.best,
            improvement: e - prev.best,
          });
        }
        seen.set(key, { best: e, displayName: ex.name });
      }
    }
  }
  return prs.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export type Stagnation = {
  exerciseName: string;
  liftKey: string;
  /** @deprecated alias for liftKey */
  normalizedName: string;
  daysSincePR: number;
  currentBest: number;
  sessionsSincePR: number;
  totalSessions: number;
};

export function stagnantLifts(
  workouts: WorkoutRow[],
  minSessions: number = 4,
  staleDays: number = 28,
): Stagnation[] {
  const sorted = [...workouts].sort((a, b) => a.date.getTime() - b.date.getTime());
  type State = {
    displayName: string;
    best: number;
    bestDate: Date;
    sessionsSinceBest: number;
    totalSessions: number;
  };
  const map = new Map<string, State>();

  for (const w of sorted) {
    for (const ex of w.exercises) {
      const e = bestE1RM(ex.sets, ex.category);
      if (e === 0) continue;
      const key = liftKey(ex);
      const cur = map.get(key) ?? {
        displayName: ex.name,
        best: 0,
        bestDate: w.date,
        sessionsSinceBest: 0,
        totalSessions: 0,
      };
      cur.totalSessions += 1;
      if (e > cur.best) {
        cur.best = e;
        cur.bestDate = w.date;
        cur.sessionsSinceBest = 0;
      } else {
        cur.sessionsSinceBest += 1;
      }
      cur.displayName = ex.name;
      map.set(key, cur);
    }
  }

  const today = new Date();
  return Array.from(map.entries())
    .map(([norm, s]) => ({
      exerciseName: s.displayName,
      liftKey: norm,
      normalizedName: norm,
      daysSincePR: differenceInCalendarDays(today, s.bestDate),
      currentBest: s.best,
      sessionsSincePR: s.sessionsSinceBest,
      totalSessions: s.totalSessions,
    }))
    .filter(
      (s) =>
        s.totalSessions >= minSessions &&
        s.daysSincePR >= staleDays &&
        s.sessionsSincePR >= 2,
    )
    .sort((a, b) => b.daysSincePR - a.daysSincePR)
    .slice(0, 6);
}

/* ─────────────────────────────────────────────────────────────────
   PR DETECTION FROM NOTES
   ─────────────────────────────────────────────────────────────────

   The lifter often writes their own PRs in the margin of a set or
   exercise: "NEW PR", "new 1rm max", "new personal record". We
   surface these explicitly so they don't depend on the e1RM heuristic.

   IMPORTANT: a bare "1rm max" without "new" does NOT qualify — it's
   just describing what the set was tested at, not claiming a record.
*/

/** Returns true if the note indicates a PR/personal-record claim. */
export function noteIndicatesPR(note: string | null | undefined): boolean {
  if (!note) return false;
  const n = note.toLowerCase().trim();
  // "new 1rm", "new 1rm max", "new pr", "new max", "new personal record"
  if (/\bnew\s+(?:1\s*r?\s*m(?:\s*max)?|max|p\.?\s*r\.?|personal\s*(?:best|record)|best)\b/i.test(n)) return true;
  // standalone "PR" or "P.R." (with word boundaries) — but require the WORD pr,
  // not part of "press" or other words; also exclude "no pr" / "not pr"
  if (/\b(?:pr|p\.r\.)\b/.test(n) && !/\bno\s*pr\b|\bnot\s*pr\b/.test(n)) return true;
  // "personal record" alone (without "new") is also a PR claim
  if (/personal\s*(?:record|best)/i.test(n)) return true;
  return false;
}

export type NotedPR = {
  date: Date;
  workoutId: string;
  exerciseName: string;
  liftKey: string;
  weight: number | null;
  weightUnit: string | null;
  reps: number | null;
  noteSource: "set" | "exercise" | "session";
  noteBody: string;
};

/**
 * Walk every set / exercise / session note across all workouts and
 * return the moments the lifter explicitly wrote down a PR claim.
 */
export function notedPRs(
  workouts: WorkoutRow[],
  sessionNotesByWorkoutId: Map<string, { body: string; kind?: string | null }[]> = new Map(),
): NotedPR[] {
  const out: NotedPR[] = [];
  for (const w of workouts) {
    for (const ex of w.exercises) {
      const lk = liftKey(ex);
      // exercise-level
      if (noteIndicatesPR(ex.notes ?? null)) {
        out.push({
          date: w.date,
          workoutId: w.id,
          exerciseName: ex.name,
          liftKey: lk,
          weight: null,
          weightUnit: null,
          reps: null,
          noteSource: "exercise",
          noteBody: (ex.notes ?? "").trim(),
        });
      }
      for (const s of ex.sets) {
        if (noteIndicatesPR(s.notes ?? null)) {
          out.push({
            date: w.date,
            workoutId: w.id,
            exerciseName: ex.name,
            liftKey: lk,
            weight: s.weight ?? null,
            weightUnit: s.weightUnit ?? null,
            reps: s.reps ?? null,
            noteSource: "set",
            noteBody: (s.notes ?? "").trim(),
          });
        }
      }
    }
    // session-level notes
    const sn = sessionNotesByWorkoutId.get(w.id) ?? [];
    for (const n of sn) {
      if (noteIndicatesPR(n.body)) {
        out.push({
          date: w.date,
          workoutId: w.id,
          exerciseName: "(session note)",
          liftKey: "session_note",
          weight: null,
          weightUnit: null,
          reps: null,
          noteSource: "session",
          noteBody: n.body.trim(),
        });
      }
    }
  }
  return out.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/** Set of yyyy-MM-dd strings on which the lifter noted a PR. */
export function notedPRDates(prs: NotedPR[]): Set<string> {
  const s = new Set<string>();
  for (const pr of prs) s.add(format(pr.date, "yyyy-MM-dd"));
  return s;
}

/* ---------------- consistency heatmap ---------------- */

export function consistencyGrid(workouts: WorkoutRow[], weeks: number = 14) {
  const today = new Date();
  const start = startOfWeek(subWeeks(today, weeks - 1), { weekStartsOn: 1 });
  const counts = new Map<string, number>();
  for (const w of workouts) {
    const k = format(w.date, "yyyy-MM-dd");
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const grid: { date: string; count: number }[] = [];
  for (let week = 0; week < weeks; week++) {
    for (let d = 0; d < 7; d++) {
      const dayDate = new Date(start);
      dayDate.setDate(start.getDate() + week * 7 + d);
      if (dayDate > today) {
        grid.push({ date: format(dayDate, "yyyy-MM-dd"), count: -1 });
      } else {
        const k = format(dayDate, "yyyy-MM-dd");
        grid.push({ date: k, count: counts.get(k) ?? 0 });
      }
    }
  }
  return grid;
}

/* ---------------- top exercises ---------------- */

export function topExercisesByFrequency(workouts: WorkoutRow[], limit: number = 8) {
  const map = new Map<
    string,
    { displayName: string; sessions: number; bestE1RM: number; lastDate: Date; category?: string | null }
  >();
  for (const w of workouts) {
    for (const ex of w.exercises) {
      const key = liftKey(ex);
      const e = bestE1RM(ex.sets, ex.category);
      const cur = map.get(key) ?? {
        displayName: ex.name,
        sessions: 0,
        bestE1RM: 0,
        lastDate: w.date,
        category: ex.category,
      };
      cur.sessions += 1;
      cur.bestE1RM = Math.max(cur.bestE1RM, e);
      cur.displayName = ex.name;
      cur.category = ex.category;
      if (w.date > cur.lastDate) cur.lastDate = w.date;
      map.set(key, cur);
    }
  }
  return Array.from(map.entries())
    .map(([norm, v]) => ({ liftKey: norm, normalizedName: norm, ...v }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, limit);
}
