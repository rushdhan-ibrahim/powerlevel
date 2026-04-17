import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ParsedWorkoutSchema } from "@/lib/schema";
import { findCanonical, normalizeForGrouping, cleanExerciseName } from "@/lib/exercise_library";
import { reprocessStoredImage } from "@/lib/image_pipeline";

export const runtime = "nodejs";
// Image re-processing (HEIC decode + JPEG resize) can take a moment per
// page. Let the save route breathe on Vercel Pro; Hobby still caps at 60s.
export const maxDuration = 120;

const SaveWorkoutBody = z.object({
  workout: ParsedWorkoutSchema,
  imagePaths: z.array(z.string()).optional(),
  imagePath: z.string().nullable().optional(),
  meta: z
    .object({
      model: z.string().optional(),
      tokensIn: z.number().optional(),
      tokensOut: z.number().optional(),
      pageCount: z.number().optional(),
    })
    .optional(),
});

export async function GET() {
  const workouts = await prisma.workout.findMany({
    orderBy: { date: "desc" },
    include: {
      exercises: { include: { sets: true }, orderBy: { order: "asc" } },
      pages: { orderBy: { order: "asc" } },
      sessionNotes: { orderBy: { order: "asc" } },
    },
  });
  return NextResponse.json(workouts);
}

export async function POST(req: Request) {
  try {
    const body = SaveWorkoutBody.parse(await req.json());
    const { workout, imagePaths, imagePath, meta } = body;

    const rawPaths = imagePaths && imagePaths.length > 0
      ? imagePaths
      : imagePath
        ? [imagePath]
        : [];

    // Hygiene pass: for every source image the review stage was looking
    // at, produce a compressed JPEG and swap the paths to the new objects
    // BEFORE writing the row. That way the DB never references an object
    // that will soon be deleted, and a failure here rolls back cleanly
    // (we haven't created the workout yet).
    const processedPaths: string[] = [];
    for (const p of rawPaths) {
      try {
        const r = await reprocessStoredImage(p);
        processedPaths.push(r.newRelativePath);
      } catch (e) {
        console.warn(`[save] image pipeline failed for ${p}: ${(e as Error).message} — keeping original`);
        processedPaths.push(p);
      }
    }
    const allPaths = processedPaths;
    const primaryPath = allPaths[0] ?? null;

    const created = await prisma.workout.create({
      data: {
        date: new Date(workout.date),
        title: workout.title,
        notes: workout.notes,
        bodyweight: workout.bodyweight,
        durationMin: workout.durationMin,
        imagePath: primaryPath,
        rawParseJson: JSON.stringify(workout),
        parseModel: meta?.model,
        parseTokensIn: meta?.tokensIn,
        parseTokensOut: meta?.tokensOut,
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
            // Clean the user-visible name (strip "?", fix punctuation),
            // then re-canonicalize against the library.
            const displayName = cleanExerciseName(ex.name);
            const fromLibrary =
              findCanonical(displayName) ?? findCanonical(ex.normalizedName);
            // If the library matched, use its CANONICAL DISPLAY for the
            // stored name — so "benchpress" and "Bench press" both render
            // as "Bench Press" in lists, totals, charts, etc.
            const finalName = fromLibrary?.display ?? displayName;
            const canonicalSlug =
              ex.canonicalSlug?.trim() ?? fromLibrary?.slug ?? null;
            const normalizedName = normalizeForGrouping(finalName);
            // If library matched, prefer its primaryMuscle/category over what
            // Gemini guessed (library is the authority for matched lifts).
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

    return NextResponse.json({ id: created.id });
  } catch (err) {
    console.error("Save workout error:", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Failed to save workout" },
      { status: 500 },
    );
  }
}
