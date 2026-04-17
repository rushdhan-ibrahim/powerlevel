import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

/**
 * Export endpoint. `GET /api/export?fmt=json` returns the entire log
 * (workouts → exercises → sets) as JSON. `GET /api/export?fmt=csv`
 * returns one CSV row per set, denormalised so a spreadsheet can read
 * it without further wrangling.
 *
 * Filenames are dated so re-exports don't clobber each other.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const fmt = url.searchParams.get("fmt") === "csv" ? "csv" : "json";
  const dateStamp = format(new Date(), "yyyy-MM-dd");

  const workouts = await prisma.workout.findMany({
    orderBy: { date: "asc" },
    include: {
      exercises: { include: { sets: true }, orderBy: { order: "asc" } },
      sessionNotes: { orderBy: { order: "asc" } },
    },
  });

  if (fmt === "csv") {
    const header = [
      "workout_id",
      "date",
      "title",
      "bodyweight_kg",
      "exercise_order",
      "exercise_name",
      "muscle_group",
      "set_order",
      "weight",
      "weight_unit",
      "reps",
      "rpe",
      "is_warmup",
      "is_failure",
      "set_notes",
    ];
    const rows: string[] = [header.join(",")];
    for (const w of workouts) {
      for (const ex of w.exercises) {
        if (ex.sets.length === 0) {
          rows.push(
            csvRow([
              w.id,
              format(w.date, "yyyy-MM-dd"),
              w.title,
              w.bodyweight,
              ex.order,
              ex.name,
              ex.muscleGroup,
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
            ]),
          );
          continue;
        }
        for (const s of ex.sets) {
          rows.push(
            csvRow([
              w.id,
              format(w.date, "yyyy-MM-dd"),
              w.title,
              w.bodyweight,
              ex.order,
              ex.name,
              ex.muscleGroup,
              s.order,
              s.weight,
              s.weightUnit,
              s.reps,
              s.rpe,
              s.isWarmup ? 1 : 0,
              s.isFailure ? 1 : 0,
              s.notes,
            ]),
          );
        }
      }
    }
    return new NextResponse(rows.join("\n") + "\n", {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="powerlevel-${dateStamp}.csv"`,
      },
    });
  }

  // JSON: trim Prisma noise and return a tidy nested shape.
  const out = workouts.map((w) => ({
    id: w.id,
    date: w.date.toISOString(),
    title: w.title,
    notes: w.notes,
    bodyweightKg: w.bodyweight,
    durationMin: w.durationMin,
    sessionNotes: w.sessionNotes.map((n) => ({ kind: n.kind, body: n.body })),
    exercises: w.exercises.map((ex) => ({
      name: ex.name,
      canonicalSlug: ex.canonicalSlug,
      muscleGroup: ex.muscleGroup,
      category: ex.category,
      pattern: ex.pattern,
      variation: ex.variation,
      notes: ex.notes,
      sets: ex.sets.map((s) => ({
        weight: s.weight,
        weightUnit: s.weightUnit,
        reps: s.reps,
        durationSec: s.durationSec,
        distanceM: s.distanceM,
        rpe: s.rpe,
        isWarmup: s.isWarmup,
        isFailure: s.isFailure,
        notes: s.notes,
      })),
    })),
  }));
  return new NextResponse(JSON.stringify(out, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="powerlevel-${dateStamp}.json"`,
    },
  });
}

function csvRow(cells: (string | number | boolean | Date | null | undefined)[]): string {
  return cells
    .map((c) => {
      if (c == null) return "";
      const s = String(c);
      // Quote if contains comma, newline, or quote
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    })
    .join(",");
}
