import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  cleanExerciseName,
  findCanonical,
  normalizeForGrouping,
} from "@/lib/exercise_library";

/**
 * One-shot admin endpoint that cleans up stored exercise rows.
 *
 * For each Workout row we have a `rawParseJson` blob — the FULL Gemini
 * parse with the original exercise names as written. We re-derive the
 * canonical names from there so this cleanup stays idempotent even
 * after we improve the library or the matcher; if a previous bad run
 * collapsed two lifts together, this run can split them back apart by
 * looking at the original.
 *
 * Falls back to the current stored `name` if rawParseJson is missing.
 */
export async function POST() {
  const workouts = await prisma.workout.findMany({
    include: { exercises: { include: { sets: true }, orderBy: { order: "asc" } } },
  });

  let updated = 0;
  let unchanged = 0;
  const renamed: { from: string; to: string }[] = [];

  for (const w of workouts) {
    let originalNames: string[] | null = null;
    if (w.rawParseJson) {
      try {
        const parsed = JSON.parse(w.rawParseJson) as {
          exercises?: { name?: string }[];
        };
        if (Array.isArray(parsed.exercises)) {
          originalNames = parsed.exercises.map((e) => e.name ?? "");
        }
      } catch {
        // ignore parse errors
      }
    }

    for (let i = 0; i < w.exercises.length; i++) {
      const ex = w.exercises[i];
      const sourceName = originalNames?.[i] ?? ex.name;
      const displayName = cleanExerciseName(sourceName);
      const fromLib = findCanonical(displayName);
      const finalName = fromLib?.display ?? displayName;
      const newSlug = fromLib?.slug ?? null;
      const newNormalized = normalizeForGrouping(finalName);
      const newMuscle = fromLib?.primaryMuscle ?? ex.muscleGroup;
      const newCategory = fromLib?.category ?? ex.category;
      const newPattern = fromLib?.pattern ?? ex.pattern;

      if (
        finalName === ex.name &&
        newSlug === ex.canonicalSlug &&
        newNormalized === ex.normalizedName &&
        newMuscle === ex.muscleGroup &&
        newCategory === ex.category &&
        newPattern === ex.pattern
      ) {
        unchanged++;
        continue;
      }

      if (finalName !== ex.name) renamed.push({ from: ex.name, to: finalName });

      await prisma.exercise.update({
        where: { id: ex.id },
        data: {
          name: finalName,
          canonicalSlug: newSlug,
          normalizedName: newNormalized,
          muscleGroup: newMuscle,
          category: newCategory,
          pattern: newPattern,
        },
      });
      updated++;
    }
  }

  return NextResponse.json({
    scanned: workouts.reduce((n, w) => n + w.exercises.length, 0),
    workouts: workouts.length,
    updated,
    unchanged,
    renamed: renamed.slice(0, 80),
  });
}

export async function GET() {
  return NextResponse.json({
    hint: "POST this endpoint to clean and re-canonicalise stored exercise names.",
  });
}
