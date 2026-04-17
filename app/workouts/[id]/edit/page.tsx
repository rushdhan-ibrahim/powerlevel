import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { WorkoutEditor } from "@/components/WorkoutEditor";
import { PageIncipit } from "@/components/manuscript/PageIncipit";
import { Ornament } from "@/components/manuscript/Ornament";
import type { ParsedWorkout } from "@/lib/schema";

export const dynamic = "force-dynamic";

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workout = await prisma.workout.findUnique({
    where: { id },
    include: {
      exercises: { include: { sets: true }, orderBy: { order: "asc" } },
      pages: { orderBy: { order: "asc" } },
      sessionNotes: { orderBy: { order: "asc" } },
    },
  });
  if (!workout) notFound();

  const imagePaths =
    workout.pages.length > 0
      ? workout.pages.map((p) => p.imagePath)
      : workout.imagePath
        ? [workout.imagePath]
        : [];

  // Re-hydrate a ParsedWorkout shape from the database record so the
  // editor has all the fields it expects. Prefer rawParseJson when present
  // so we preserve any fields we store but don't split into child tables
  // (e.g., confidence, warnings).
  let initial: ParsedWorkout | null = null;
  if (workout.rawParseJson) {
    try {
      const parsed = JSON.parse(workout.rawParseJson) as ParsedWorkout;
      // Re-lay the structured parts from the DB so the user's prior
      // edits are reflected (rawParseJson is the original parse).
      initial = {
        ...parsed,
        date: format(workout.date, "yyyy-MM-dd"),
        title: workout.title,
        bodyweight: workout.bodyweight,
        durationMin: workout.durationMin,
        notes: workout.notes,
        sessionNotes: workout.sessionNotes.map((n) => ({
          body: n.body,
          kind: (n.kind as ParsedWorkout["sessionNotes"][number]["kind"]) ?? "general",
        })),
        exercises: workout.exercises.map((ex) => ({
          name: ex.name,
          normalizedName: ex.normalizedName,
          canonicalSlug: ex.canonicalSlug,
          category:
            (ex.category as ParsedWorkout["exercises"][number]["category"]) ??
            "weighted_reps",
          pattern:
            (ex.pattern as ParsedWorkout["exercises"][number]["pattern"]) ?? null,
          variation: ex.variation,
          muscleGroup:
            (ex.muscleGroup as ParsedWorkout["exercises"][number]["muscleGroup"]) ??
            "other",
          notes: ex.notes,
          sets: ex.sets.map((s) => ({
            weight: s.weight,
            weightUnit:
              (s.weightUnit as ParsedWorkout["exercises"][number]["sets"][number]["weightUnit"]) ??
              "kg",
            reps: s.reps,
            durationSec: s.durationSec,
            distanceM: s.distanceM,
            rpe: s.rpe,
            isWarmup: s.isWarmup,
            isFailure: s.isFailure,
            notes: s.notes,
          })),
        })),
      };
    } catch {
      initial = null;
    }
  }

  if (!initial) {
    initial = {
      date: format(workout.date, "yyyy-MM-dd"),
      title: workout.title,
      bodyweight: workout.bodyweight,
      durationMin: workout.durationMin,
      notes: workout.notes,
      sessionNotes: workout.sessionNotes.map((n) => ({
        body: n.body,
        kind: (n.kind as ParsedWorkout["sessionNotes"][number]["kind"]) ?? "general",
      })),
      exercises: workout.exercises.map((ex) => ({
        name: ex.name,
        normalizedName: ex.normalizedName,
        canonicalSlug: ex.canonicalSlug,
        category:
          (ex.category as ParsedWorkout["exercises"][number]["category"]) ??
          "weighted_reps",
        pattern:
          (ex.pattern as ParsedWorkout["exercises"][number]["pattern"]) ?? null,
        variation: ex.variation,
        muscleGroup:
          (ex.muscleGroup as ParsedWorkout["exercises"][number]["muscleGroup"]) ??
          "other",
        notes: ex.notes,
        sets: ex.sets.map((s) => ({
          weight: s.weight,
          weightUnit:
            (s.weightUnit as ParsedWorkout["exercises"][number]["sets"][number]["weightUnit"]) ??
            "kg",
          reps: s.reps,
          durationSec: s.durationSec,
          distanceM: s.distanceM,
          rpe: s.rpe,
          isWarmup: s.isWarmup,
          isFailure: s.isFailure,
          notes: s.notes,
        })),
      })),
      confidence: "high",
      warnings: [],
    };
  }

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <Link
          href={`/workouts/${id}`}
          style={{
            fontFamily: "var(--display)",
            fontVariant: "small-caps",
            fontSize: ".68rem",
            fontWeight: 500,
            letterSpacing: ".16em",
            color: "var(--ash)",
            textDecoration: "none",
          }}
        >
          ← back to the folio
        </Link>
      </div>

      <PageIncipit
        eyebrow="Editing"
        title={workout.title ?? "Untitled workout"}
        meta={`saved ${format(workout.date, "MMM d, yyyy")} · changes replace the stored version`}
      />

      <Ornament variant="diamond" />

      <WorkoutEditor initial={initial} imagePaths={imagePaths} editingId={id} />
    </div>
  );
}
