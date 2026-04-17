import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ParsedWorkoutSchema } from "@/lib/schema";
import {
  findCanonical,
  normalizeForGrouping,
  cleanExerciseName,
} from "@/lib/exercise_library";

function invalidateAllWorkoutViews() {
  for (const p of ["/", "/workouts", "/insights", "/ledger", "/totals", "/profile"]) {
    revalidatePath(p);
  }
  revalidatePath("/exercises/[slug]", "page");
  revalidatePath("/workouts/[id]", "page");
}

const PatchBody = z.object({
  workout: ParsedWorkoutSchema,
  imagePaths: z.array(z.string()).optional(),
  imagePath: z.string().nullable().optional(),
});

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.workout.delete({ where: { id } });
  invalidateAllWorkoutViews();
  return NextResponse.json({ ok: true });
}

/**
 * Full-replacement update of a saved workout. Applies the same
 * library-driven name canonicalisation that /api/workouts POST does,
 * so edits stay consistent with freshly-saved workouts.
 *
 * Strategy: wipe the child exercises/sessionNotes/pages and re-create
 * them from the payload inside a transaction. Simpler than trying to
 * diff two trees and keeps ids predictable.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = PatchBody.parse(await req.json());
    const { workout, imagePaths, imagePath } = body;

    const allPaths =
      imagePaths && imagePaths.length > 0 ? imagePaths : imagePath ? [imagePath] : [];
    const primaryPath = allPaths[0] ?? null;

    await prisma.$transaction(async (tx) => {
      // wipe children; cascades handle their own grandchildren
      await tx.exercise.deleteMany({ where: { workoutId: id } });
      await tx.sessionNote.deleteMany({ where: { workoutId: id } });
      await tx.workoutPage.deleteMany({ where: { workoutId: id } });

      await tx.workout.update({
        where: { id },
        data: {
          date: new Date(workout.date),
          title: workout.title,
          notes: workout.notes,
          bodyweight: workout.bodyweight,
          durationMin: workout.durationMin,
          imagePath: primaryPath ?? undefined,
          rawParseJson: JSON.stringify(workout),
          pages: {
            create: allPaths.map((p, i) => ({ imagePath: p, order: i })),
          },
          sessionNotes: {
            create: (workout.sessionNotes ?? []).map((n, i) => ({
              body: n.body,
              kind: n.kind,
              order: i,
            })),
          },
          exercises: {
            create: workout.exercises.map((ex, i) => {
              const displayName = cleanExerciseName(ex.name);
              const fromLibrary =
                findCanonical(displayName) ?? findCanonical(ex.normalizedName);
              const finalName = fromLibrary?.display ?? displayName;
              const canonicalSlug =
                ex.canonicalSlug?.trim() ?? fromLibrary?.slug ?? null;
              const normalizedName = normalizeForGrouping(finalName);
              const muscleGroup = fromLibrary?.primaryMuscle ?? ex.muscleGroup;
              const category = fromLibrary?.category ?? ex.category;
              const pattern = fromLibrary?.pattern ?? ex.pattern;
              return {
                name: finalName,
                normalizedName,
                canonicalSlug,
                category,
                pattern,
                variation: ex.variation,
                muscleGroup,
                notes: ex.notes,
                order: i,
                sets: {
                  create: ex.sets.map((s, j) => ({
                    order: j,
                    weight: s.weight,
                    weightUnit: s.weightUnit ?? "kg",
                    reps: s.reps,
                    durationSec: s.durationSec,
                    distanceM: s.distanceM,
                    rpe: s.rpe,
                    isWarmup: s.isWarmup,
                    isFailure: s.isFailure,
                    notes: s.notes,
                  })),
                },
              };
            }),
          },
        },
      });
    });

    invalidateAllWorkoutViews();
    return NextResponse.json({ id });
  } catch (err) {
    console.error("Update workout error:", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Failed to update workout" },
      { status: 500 },
    );
  }
}
