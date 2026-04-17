import { differenceInCalendarDays, format, startOfWeek, subDays } from "date-fns";
import {
  bestE1RM,
  setTonnage,
  toKg,
  workoutTonnage,
  type SetRow,
  type WorkoutRow,
} from "./insights";

/* ═══════════════════════════════════════════════════════════════
   Evidence-based volume targets per muscle group (sets / week).
   Numbers drawn from the consensus around Israetel's MEV/MAV/MRV
   framework — approximate, not prescriptive. Individual response
   will vary with training age, recovery, sleep, nutrition.
   ═══════════════════════════════════════════════════════════════ */

export type VolumeTargets = { mev: number; mav: [number, number]; mrv: number };

export const MUSCLE_TARGETS: Record<string, VolumeTargets> = {
  chest:      { mev: 10, mav: [12, 20], mrv: 22 },
  back:       { mev: 10, mav: [14, 22], mrv: 25 },
  shoulders:  { mev:  8, mav: [16, 22], mrv: 26 },
  biceps:     { mev:  8, mav: [14, 20], mrv: 26 },
  triceps:    { mev:  6, mav: [10, 14], mrv: 18 },
  quads:      { mev:  8, mav: [12, 18], mrv: 20 },
  hamstrings: { mev:  6, mav: [10, 16], mrv: 20 },
  glutes:     { mev:  6, mav: [ 8, 16], mrv: 20 },
  calves:     { mev:  8, mav: [12, 16], mrv: 20 },
  core:       { mev:  6, mav: [16, 20], mrv: 25 },
};

export type VolumeStatus = "below" | "mev" | "mav" | "above";

export type MuscleVolumeRow = {
  group: string;
  label: string;
  lastWeek: number;
  fourWeekAvg: number;
  mev: number;
  mavLow: number;
  mavHigh: number;
  mrv: number;
  status: VolumeStatus;
};

const MUSCLE_LABEL: Record<string, string> = {
  chest: "Chest", back: "Back", shoulders: "Shoulders",
  biceps: "Biceps", triceps: "Triceps",
  quads: "Quads", hamstrings: "Hamstrings", glutes: "Glutes",
  calves: "Calves", core: "Core",
};

export function muscleVolumeLedger(workouts: WorkoutRow[]): MuscleVolumeRow[] {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const fourWeeksAgo = subDays(now, 28);

  const thisWeekByGroup = new Map<string, number>();
  const fourWeekByGroup = new Map<string, number>();

  for (const w of workouts) {
    if (w.date < fourWeeksAgo) continue;
    const isThisWeek = w.date >= weekStart;
    for (const ex of w.exercises) {
      const g = ex.muscleGroup ?? "other";
      const setsThis = ex.sets.filter((s) => !s.isWarmup).length;
      fourWeekByGroup.set(g, (fourWeekByGroup.get(g) ?? 0) + setsThis);
      if (isThisWeek) {
        thisWeekByGroup.set(g, (thisWeekByGroup.get(g) ?? 0) + setsThis);
      }
    }
  }

  return Object.keys(MUSCLE_TARGETS).map((g) => {
    const targets = MUSCLE_TARGETS[g];
    const lastWeek = thisWeekByGroup.get(g) ?? 0;
    const fourWeek = fourWeekByGroup.get(g) ?? 0;
    const fourWeekAvg = fourWeek / 4;
    return {
      group: g,
      label: MUSCLE_LABEL[g] ?? g,
      lastWeek,
      fourWeekAvg: Math.round(fourWeekAvg * 10) / 10,
      mev: targets.mev,
      mavLow: targets.mav[0],
      mavHigh: targets.mav[1],
      mrv: targets.mrv,
      status: classifyVolume(lastWeek, targets),
    };
  });
}

function classifyVolume(sets: number, t: VolumeTargets): VolumeStatus {
  if (sets < t.mev) return "below";
  if (sets < t.mav[0]) return "mev";
  if (sets <= t.mav[1]) return "mav";
  return "above";
}

/* ═══════════════════════════════════════════════════════════════
   Key lifts — the compounds most people track explicitly.
   Matching is loose so "BP", "flat bench", "bench press" all
   resolve to "bench".
   ═══════════════════════════════════════════════════════════════ */

type KeyLiftSpec = { key: string; label: string; match: RegExp; rubric?: boolean };

export const KEY_LIFTS: KeyLiftSpec[] = [
  { key: "squat",    label: "Squat",          match: /\b(back squat|high bar squat|low bar squat|squat)\b/i, rubric: true },
  { key: "bench",    label: "Bench Press",    match: /\b(bench press|flat bench|barbell bench|bench)\b/i, rubric: true },
  { key: "deadlift", label: "Deadlift",       match: /\b(conventional deadlift|deadlift|sumo deadlift)\b/i, rubric: true },
  { key: "ohp",      label: "Overhead Press", match: /\b(overhead press|standing press|military press|ohp|strict press)\b/i },
  { key: "row",      label: "Barbell Row",    match: /\b(barbell row|pendlay row|bent over row|bb row)\b/i },
  { key: "pullup",   label: "Pull-up",        match: /\b(pull[- ]?up|chin[- ]?up|weighted pull[- ]?up)\b/i },
];

export type KeyLiftRow = {
  key: string;
  label: string;
  found: boolean;
  e1RM: number;
  peakE1RM: number;
  lastSessionDate: Date | null;
  sessions: number;
  trend: "up" | "flat" | "down" | "new" | "none";
  deltaPct: number | null;
  topSet: { weight: number; reps: number; unit: string } | null;
  rubric: boolean;
};

export function keyLifts(workouts: WorkoutRow[]): KeyLiftRow[] {
  return KEY_LIFTS.map((spec) => extractKeyLift(workouts, spec));
}

function extractKeyLift(workouts: WorkoutRow[], spec: KeyLiftSpec): KeyLiftRow {
  // collect all sessions whose normalized name OR raw name matches the spec
  type Session = { date: Date; sets: SetRow[]; displayName: string };
  const sessions: Session[] = [];
  for (const w of workouts) {
    for (const ex of w.exercises) {
      if (spec.match.test(ex.normalizedName) || spec.match.test(ex.name)) {
        sessions.push({ date: w.date, sets: ex.sets, displayName: ex.name });
      }
    }
  }

  if (sessions.length === 0) {
    return {
      key: spec.key,
      label: spec.label,
      found: false,
      e1RM: 0,
      peakE1RM: 0,
      lastSessionDate: null,
      sessions: 0,
      trend: "none",
      deltaPct: null,
      topSet: null,
      rubric: !!spec.rubric,
    };
  }

  sessions.sort((a, b) => a.date.getTime() - b.date.getTime());

  const latest = sessions[sessions.length - 1];
  const e1RMLatest = bestE1RM(latest.sets);

  // find top set across all sessions (heaviest working weight)
  let topSet: KeyLiftRow["topSet"] = null;
  let heaviest = 0;
  for (const s of sessions) {
    for (const set of s.sets) {
      if (set.isWarmup || set.weight == null || set.reps == null) continue;
      const w = toKg(set.weight, set.weightUnit);
      if (w > heaviest) {
        heaviest = w;
        topSet = { weight: Math.round(w), reps: set.reps, unit: "kg" };
      }
    }
  }

  const peak = Math.max(...sessions.map((s) => bestE1RM(s.sets)));

  const priorE1RMs = sessions
    .slice(Math.max(0, sessions.length - 5), sessions.length - 1)
    .map((s) => bestE1RM(s.sets))
    .filter((n) => n > 0);

  let trend: KeyLiftRow["trend"] = "flat";
  let deltaPct: number | null = null;
  if (priorE1RMs.length === 0) {
    trend = "new";
  } else {
    const priorBest = Math.max(...priorE1RMs);
    if (priorBest === 0) {
      trend = "new";
    } else {
      const delta = ((e1RMLatest - priorBest) / priorBest) * 100;
      deltaPct = Math.round(delta);
      if (delta > 1) trend = "up";
      else if (delta < -2) trend = "down";
      else trend = "flat";
    }
  }

  return {
    key: spec.key,
    label: spec.label,
    found: true,
    e1RM: e1RMLatest,
    peakE1RM: peak,
    lastSessionDate: latest.date,
    sessions: sessions.length,
    trend,
    deltaPct,
    topSet,
    rubric: !!spec.rubric,
  };
}

/* ═══════════════════════════════════════════════════════════════
   Rep range distribution — strength / hypertrophy / metabolic.
   ═══════════════════════════════════════════════════════════════ */

export type RepRangeDist = {
  strength: number;   // 1-5 reps
  hypertrophy: number; // 6-12 reps
  metabolic: number;   // 13+ reps
  total: number;       // working sets counted
  strengthPct: number;
  hypertrophyPct: number;
  metabolicPct: number;
};

export function repRangeDistribution(
  workouts: WorkoutRow[],
  daysBack: number = 28,
): RepRangeDist {
  const cutoff = subDays(new Date(), daysBack);
  let strength = 0, hypertrophy = 0, metabolic = 0;
  for (const w of workouts) {
    if (w.date < cutoff) continue;
    for (const ex of w.exercises) {
      for (const s of ex.sets) {
        if (s.isWarmup || s.reps == null || s.reps <= 0) continue;
        if (s.reps <= 5) strength++;
        else if (s.reps <= 12) hypertrophy++;
        else metabolic++;
      }
    }
  }
  const total = strength + hypertrophy + metabolic;
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));
  return {
    strength, hypertrophy, metabolic, total,
    strengthPct: pct(strength),
    hypertrophyPct: pct(hypertrophy),
    metabolicPct: pct(metabolic),
  };
}

/* ═══════════════════════════════════════════════════════════════
   Acute : Chronic workload ratio — a classic injury/overtraining
   proxy. Sweet spot ~0.8–1.3; >1.5 is a spike worth noting.
   ═══════════════════════════════════════════════════════════════ */

export type ACWR = {
  acute: number;   // last 7d tonnage
  chronic: number; // avg tonnage per 7d over last 28d
  ratio: number | null;
  status: "undertrained" | "sweet" | "caution" | "spike";
};

export function acwr(workouts: WorkoutRow[]): ACWR {
  const now = new Date();
  const cut7 = subDays(now, 7);
  const cut28 = subDays(now, 28);
  const acute = Math.round(
    workouts.filter((w) => w.date >= cut7).reduce((s, w) => s + workoutTonnage(w), 0),
  );
  const total28 = workouts
    .filter((w) => w.date >= cut28)
    .reduce((s, w) => s + workoutTonnage(w), 0);
  const chronic = Math.round(total28 / 4);

  if (chronic === 0) {
    return { acute, chronic, ratio: null, status: "undertrained" };
  }
  const ratio = acute / chronic;
  let status: ACWR["status"] = "sweet";
  if (ratio < 0.8) status = "undertrained";
  else if (ratio > 1.5) status = "spike";
  else if (ratio > 1.3) status = "caution";
  return { acute, chronic, ratio: Math.round(ratio * 100) / 100, status };
}

/* ═══════════════════════════════════════════════════════════════
   Progression signals — which frequent lifts are trending up,
   flat, or declining. Looks across the last ~6 sessions per lift.
   ═══════════════════════════════════════════════════════════════ */

export type ProgressionRow = {
  displayName: string;
  normalizedName: string;
  sessions: number;
  currentE1RM: number;
  peakE1RM: number;
  trend: "up" | "flat" | "down";
  deltaPct: number;
  lastDate: Date;
};

export function progressionSignals(
  workouts: WorkoutRow[],
  minSessions: number = 3,
): ProgressionRow[] {
  const byLift = new Map<
    string,
    { displayName: string; sessions: { date: Date; e1RM: number }[] }
  >();

  for (const w of workouts) {
    for (const ex of w.exercises) {
      const e = bestE1RM(ex.sets);
      if (e === 0) continue;
      const cur = byLift.get(ex.normalizedName) ?? {
        displayName: ex.name,
        sessions: [],
      };
      cur.sessions.push({ date: w.date, e1RM: e });
      cur.displayName = ex.name;
      byLift.set(ex.normalizedName, cur);
    }
  }

  const rows: ProgressionRow[] = [];
  for (const [norm, data] of byLift.entries()) {
    if (data.sessions.length < minSessions) continue;
    const sorted = data.sessions.sort((a, b) => a.date.getTime() - b.date.getTime());
    const currentE1RM = sorted[sorted.length - 1].e1RM;
    const peakE1RM = Math.max(...sorted.map((s) => s.e1RM));
    const priors = sorted
      .slice(Math.max(0, sorted.length - 6), sorted.length - 1)
      .map((s) => s.e1RM)
      .filter((n) => n > 0);
    if (priors.length === 0) continue;
    const priorAvg = priors.reduce((s, n) => s + n, 0) / priors.length;
    const delta = priorAvg === 0 ? 0 : ((currentE1RM - priorAvg) / priorAvg) * 100;
    const trend: ProgressionRow["trend"] =
      delta > 2 ? "up" : delta < -3 ? "down" : "flat";
    rows.push({
      displayName: data.displayName,
      normalizedName: norm,
      sessions: sorted.length,
      currentE1RM,
      peakE1RM,
      trend,
      deltaPct: Math.round(delta * 10) / 10,
      lastDate: sorted[sorted.length - 1].date,
    });
  }

  return rows.sort((a, b) => b.sessions - a.sessions);
}

/* ═══════════════════════════════════════════════════════════════
   Rest & recovery — consecutive training days, rest days per week.
   ═══════════════════════════════════════════════════════════════ */

export type RecoveryStats = {
  restDaysLast7: number;
  restDaysLast28: number;
  consecutiveTrainingDays: number;
  daysSinceLastRest: number;
  avgSessionsPerWeek: number;
};

export function recoveryStats(workouts: WorkoutRow[]): RecoveryStats {
  const today = new Date();
  const todayKey = format(today, "yyyy-MM-dd");
  const dayHasSession = new Set(workouts.map((w) => format(w.date, "yyyy-MM-dd")));

  let restDaysLast7 = 0;
  for (let i = 0; i < 7; i++) {
    const d = subDays(today, i);
    if (!dayHasSession.has(format(d, "yyyy-MM-dd"))) restDaysLast7++;
  }
  let restDaysLast28 = 0;
  for (let i = 0; i < 28; i++) {
    const d = subDays(today, i);
    if (!dayHasSession.has(format(d, "yyyy-MM-dd"))) restDaysLast28++;
  }

  // consecutive training days ending today (or yesterday)
  let consecutive = 0;
  let daysSinceLastRest = 0;
  let cursor = dayHasSession.has(todayKey) ? today : subDays(today, 1);
  while (cursor.getTime() > subDays(today, 60).getTime()) {
    if (dayHasSession.has(format(cursor, "yyyy-MM-dd"))) {
      consecutive++;
    } else {
      break;
    }
    cursor = subDays(cursor, 1);
  }
  daysSinceLastRest = consecutive;

  const last28Sessions = workouts.filter(
    (w) => w.date >= subDays(today, 28),
  ).length;
  const avgSessionsPerWeek = Math.round((last28Sessions / 4) * 10) / 10;

  return {
    restDaysLast7,
    restDaysLast28,
    consecutiveTrainingDays: consecutive,
    daysSinceLastRest,
    avgSessionsPerWeek,
  };
}

/* ═══════════════════════════════════════════════════════════════
   Strength ratios — the classic balance checks.
   ═══════════════════════════════════════════════════════════════ */

export type RatioRow = {
  label: string;
  numerator: string;
  denominator: string;
  ratio: number | null;
  ideal: string;
  idealRange: [number, number];
  status: "low" | "ideal" | "high" | "unknown";
  note: string;
};

export function strengthRatios(workouts: WorkoutRow[]): RatioRow[] {
  const lifts = keyLifts(workouts);
  const byKey = new Map(lifts.map((l) => [l.key, l]));

  const spec: Array<{
    label: string;
    numKey: string;
    denKey: string;
    ideal: string;
    idealRange: [number, number];
    note: string;
  }> = [
    {
      label: "Push : Pull",
      numKey: "bench",
      denKey: "row",
      ideal: "≈ 1.0",
      idealRange: [0.9, 1.1],
      note: "Bench press ≈ Barbell row 1RM keeps shoulder structures balanced.",
    },
    {
      label: "Squat : Deadlift",
      numKey: "squat",
      denKey: "deadlift",
      ideal: "0.80 – 0.95",
      idealRange: [0.8, 0.95],
      note: "Most lifters deadlift a little more than they squat. Very wide gaps suggest an underdeveloped lift.",
    },
    {
      label: "OHP : Bench",
      numKey: "ohp",
      denKey: "bench",
      ideal: "0.60 – 0.75",
      idealRange: [0.6, 0.75],
      note: "OHP should be 60–75% of bench. Low = weak shoulders; high = underdeveloped chest.",
    },
  ];

  return spec.map((s) => {
    const n = byKey.get(s.numKey);
    const d = byKey.get(s.denKey);
    if (!n?.found || !d?.found || n.e1RM === 0 || d.e1RM === 0) {
      return {
        label: s.label,
        numerator: n?.label ?? s.numKey,
        denominator: d?.label ?? s.denKey,
        ratio: null,
        ideal: s.ideal,
        idealRange: s.idealRange,
        status: "unknown",
        note: s.note,
      };
    }
    const r = n.e1RM / d.e1RM;
    const [lo, hi] = s.idealRange;
    const status: RatioRow["status"] = r < lo ? "low" : r > hi ? "high" : "ideal";
    return {
      label: s.label,
      numerator: n.label,
      denominator: d.label,
      ratio: Math.round(r * 100) / 100,
      ideal: s.ideal,
      idealRange: s.idealRange,
      status,
      note: s.note,
    };
  });
}

/* ═══════════════════════════════════════════════════════════════
   Frequency per muscle group — how many sessions per week touch
   this muscle. 2x/week is the evidence-based minimum for growth.
   ═══════════════════════════════════════════════════════════════ */

export type FrequencyRow = {
  group: string;
  label: string;
  sessionsLast7: number;
  sessionsLast28: number;
  weeklyFrequency: number;
  status: "low" | "adequate" | "ample";
};

export function muscleFrequency(workouts: WorkoutRow[]): FrequencyRow[] {
  const cut7 = subDays(new Date(), 7);
  const cut28 = subDays(new Date(), 28);

  const last7 = new Map<string, Set<string>>();
  const last28 = new Map<string, Set<string>>();

  for (const w of workouts) {
    const key = format(w.date, "yyyy-MM-dd");
    if (w.date >= cut28) {
      for (const ex of w.exercises) {
        if (!ex.muscleGroup) continue;
        const workingSets = ex.sets.filter((s) => !s.isWarmup).length;
        if (workingSets === 0) continue;
        const g = ex.muscleGroup;
        if (!last28.has(g)) last28.set(g, new Set());
        last28.get(g)!.add(key);
        if (w.date >= cut7) {
          if (!last7.has(g)) last7.set(g, new Set());
          last7.get(g)!.add(key);
        }
      }
    }
  }

  return Object.keys(MUSCLE_TARGETS).map((g) => {
    const s7 = last7.get(g)?.size ?? 0;
    const s28 = last28.get(g)?.size ?? 0;
    const weekly = Math.round((s28 / 4) * 10) / 10;
    const status: FrequencyRow["status"] =
      weekly < 1.5 ? "low" : weekly <= 3 ? "adequate" : "ample";
    return {
      group: g,
      label: MUSCLE_LABEL[g] ?? g,
      sessionsLast7: s7,
      sessionsLast28: s28,
      weeklyFrequency: weekly,
      status,
    };
  });
}

/* ═══════════════════════════════════════════════════════════════
   Rep-range by week — for the StackedBand chart.
   ═══════════════════════════════════════════════════════════════ */

export type RepRangeByWeek = {
  week: string;     // ISO date of week start
  strength: number;
  hypertrophy: number;
  metabolic: number;
};

export function repRangeByWeek(workouts: WorkoutRow[], weeks: number = 12): RepRangeByWeek[] {
  const now = new Date();
  const buckets = new Map<string, { strength: number; hypertrophy: number; metabolic: number }>();
  for (let i = weeks - 1; i >= 0; i--) {
    const d = startOfWeek(subDays(now, i * 7), { weekStartsOn: 1 });
    buckets.set(format(d, "yyyy-MM-dd"), { strength: 0, hypertrophy: 0, metabolic: 0 });
  }

  const earliestBucket = subDays(now, weeks * 7);
  for (const w of workouts) {
    if (w.date < earliestBucket) continue;
    const k = format(startOfWeek(w.date, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const b = buckets.get(k);
    if (!b) continue;
    for (const ex of w.exercises) {
      for (const s of ex.sets) {
        if (s.isWarmup || s.reps == null || s.reps <= 0) continue;
        if (s.reps <= 5) b.strength++;
        else if (s.reps <= 12) b.hypertrophy++;
        else b.metabolic++;
      }
    }
  }
  return Array.from(buckets.entries()).map(([week, v]) => ({ week, ...v }));
}

/* ═══════════════════════════════════════════════════════════════
   Top lift formatting — SBD total.
   ═══════════════════════════════════════════════════════════════ */

export function powerliftingTotal(lifts: KeyLiftRow[]): number {
  const s = lifts.find((l) => l.key === "squat")?.e1RM ?? 0;
  const b = lifts.find((l) => l.key === "bench")?.e1RM ?? 0;
  const d = lifts.find((l) => l.key === "deadlift")?.e1RM ?? 0;
  return s + b + d;
}

/* helper for external use */
export { setTonnage, toKg, differenceInCalendarDays };
