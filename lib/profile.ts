import { prisma } from "./db";

export type LifterProfile = {
  displayName: string | null;
  heightCm: number | null;
  bodyweightKg: number | null;
  birthYear: number | null;
  sex: "male" | "female" | null;
  goal: "strength" | "hypertrophy" | "recovery" | "general" | null;
  units: string;
};

const DEFAULT: LifterProfile = {
  displayName: null,
  heightCm: null,
  bodyweightKg: null,
  birthYear: null,
  sex: null,
  goal: null,
  units: "kg",
};

/**
 * Singleton profile reader. If no row exists yet, returns the default;
 * if the user has not set bodyweight explicitly, we fall back to the
 * latest workout's recorded bodyweight so analyses don't start empty.
 */
export async function loadProfile(): Promise<LifterProfile> {
  const row = await prisma.profile.findUnique({ where: { id: "singleton" } });
  if (!row) return { ...DEFAULT };

  const fallbackBW =
    row.bodyweightKg ??
    (
      await prisma.workout.findFirst({
        where: { bodyweight: { not: null } },
        orderBy: { date: "desc" },
      })
    )?.bodyweight ??
    null;

  return {
    displayName: row.displayName,
    heightCm: row.heightCm,
    bodyweightKg: fallbackBW ?? row.bodyweightKg,
    birthYear: row.birthYear,
    sex: (row.sex as "male" | "female" | null) ?? null,
    goal:
      (row.goal as "strength" | "hypertrophy" | "recovery" | "general" | null) ??
      null,
    units: row.units ?? "kg",
  };
}

/** Derived metrics from a profile. */
export function profileDerived(p: LifterProfile) {
  const bmi =
    p.heightCm && p.bodyweightKg
      ? p.bodyweightKg / Math.pow(p.heightCm / 100, 2)
      : null;
  const age =
    p.birthYear ? new Date().getFullYear() - p.birthYear : null;
  return { bmi: bmi ? Math.round(bmi * 10) / 10 : null, age };
}

/**
 * Strength standards (approximate, drawn from common published tables
 * such as Symmetric Strength / StrengthLevel). Returns the classification
 * for a given lift at a given 1RM:value, given bodyweight and sex.
 * Classifications: "novice" < "beginner" < "intermediate" < "advanced" < "elite".
 */
export type StrengthClass = "novice" | "beginner" | "intermediate" | "advanced" | "elite";

const RATIOS: Record<string, Record<"male" | "female", [number, number, number, number]>> = {
  // [beginner, intermediate, advanced, elite] — multiples of bodyweight
  squat:    { male: [0.8, 1.25, 1.75, 2.25], female: [0.65, 0.95, 1.35, 1.75] },
  bench:    { male: [0.75, 1.0, 1.5, 2.0],   female: [0.4, 0.65, 0.9, 1.25] },
  deadlift: { male: [1.0, 1.5, 2.1, 2.75],   female: [0.8, 1.15, 1.6, 2.1] },
  ohp:      { male: [0.45, 0.7, 1.0, 1.35],  female: [0.25, 0.45, 0.65, 0.9] },
  row:      { male: [0.6, 0.85, 1.25, 1.65], female: [0.4, 0.6, 0.85, 1.15] },
  pullup:   { male: [0.0, 0.25, 0.55, 0.95], female: [0.0, 0.15, 0.35, 0.65] },
};

export function classifyLift(
  liftKey: keyof typeof RATIOS,
  e1RMKg: number,
  bodyweightKg: number,
  sex: "male" | "female" | null,
): { ratio: number; klass: StrengthClass; targets: [number, number, number, number] } | null {
  if (!sex || !bodyweightKg || bodyweightKg <= 0 || !e1RMKg) return null;
  const ratios = RATIOS[liftKey];
  if (!ratios) return null;
  const t = ratios[sex];
  const ratio = e1RMKg / bodyweightKg;
  let klass: StrengthClass = "novice";
  if (ratio >= t[3]) klass = "elite";
  else if (ratio >= t[2]) klass = "advanced";
  else if (ratio >= t[1]) klass = "intermediate";
  else if (ratio >= t[0]) klass = "beginner";
  return { ratio: Math.round(ratio * 100) / 100, klass, targets: t };
}

export { DEFAULT as DEFAULT_PROFILE };
