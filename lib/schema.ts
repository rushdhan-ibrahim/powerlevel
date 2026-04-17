import { z } from "zod";

/* ─── set ────────────────────────────────────────────────────── */

export const ParsedSetSchema = z.object({
  weight: z.number().nullable().describe("Numeric load. For weighted_reps: bar load. For bodyweight_reps: ADDED weight (null if pure bodyweight). For carry: load carried. For timed_hold: optional added load. Null if not applicable."),
  weightUnit: z.enum(["kg", "lb", "bw"]).nullable().describe("'kg', 'lb', or 'bw' (bodyweight). Default 'kg' unless 'lb' is written."),
  reps: z.number().int().nullable().describe("Number of reps. Null for timed/distance-only sets."),
  durationSec: z.number().int().nullable().describe("Set duration in seconds. Use for timed_hold (e.g. plank, dead hang) or carry-with-time. Convert mm:ss to seconds."),
  distanceM: z.number().nullable().describe("Set distance in metres. Use for carry, distance_time, cardio_distance. Convert km/miles to metres."),
  rpe: z.number().nullable().describe("Rate of Perceived Exertion (typically 1-10), if noted."),
  isWarmup: z.boolean().describe("True if explicitly marked warmup (WU, w, warmup)."),
  isFailure: z.boolean().describe("True if marked to failure (F, +, fail)."),
  notes: z.string().nullable().describe("Set-specific note (paused, belt, RPE notes, mood, body part feel)."),
});

/* ─── exercise ───────────────────────────────────────────────── */

export const ParsedExerciseSchema = z.object({
  name: z.string().describe("Exercise name as written, lightly cleaned. e.g. 'Bench Press', 'RDL', 'Pull-ups', 'Dead Hang'."),
  normalizedName: z.string().describe("Lowercase canonical phrase for grouping when no library match is available. e.g. 'bench press', 'romanian deadlift', 'dead hang'."),
  canonicalSlug: z.string().nullable().describe("If this exercise matches an entry in the provided library, use that exact slug (e.g. 'bench_press', 'romanian_deadlift', 'dead_hang'). Null if no clear library match."),
  category: z.enum([
    "weighted_reps",
    "bodyweight_reps",
    "timed_hold",
    "carry",
    "distance_time",
    "cardio_distance",
    "reps_only",
  ]).describe("Measurement category for this exercise. Drives how sets are interpreted."),
  pattern: z.enum([
    "horizontal_push", "vertical_push",
    "horizontal_pull", "vertical_pull",
    "squat", "hinge", "lunge", "single_leg",
    "carry", "rotation", "anti_rotation",
    "isolation", "core", "cardio",
  ]).nullable().describe("Movement pattern. Use library entry's pattern when matched."),
  variation: z.string().nullable().describe("A free-form qualifier that distinguishes this performance from the canonical lift, while still being part of the same lineage. e.g. 'paused', 'tempo 3-1-1', 'close-grip', 'deficit', 'pin'. Null if it's the standard lift."),
  muscleGroup: z.enum([
    "chest", "back", "shoulders", "biceps", "triceps", "forearms",
    "quads", "hamstrings", "glutes", "calves", "core", "full_body", "cardio", "other",
  ]).describe("Primary muscle group. Match the library entry when available."),
  notes: z.string().nullable().describe("Exercise-level note (e.g. 'tempo 3-1-1 throughout', 'with chains', 'belt on working sets')."),
  sets: z.array(ParsedSetSchema).describe("Ordered list of sets performed. May be empty for an exercise written but not actually performed."),
});

/* ─── session note ───────────────────────────────────────────── */

export const ParsedSessionNoteSchema = z.object({
  body: z.string().describe("The note text, lightly cleaned. Preserve the lifter's voice."),
  kind: z.enum(["feeling", "sleep", "injury", "nutrition", "general"]).describe("Best-guess category for the note."),
});

/* ─── workout ────────────────────────────────────────────────── */

export const ParsedWorkoutSchema = z.object({
  date: z.string().describe("Workout date in ISO 8601 format (YYYY-MM-DD). Read from any date written on the page (top, header, margin). If absent, omit and default to today's date will apply."),
  title: z.string().nullable().describe("Session label if written, e.g. 'Push Day', 'Legs A', 'Upper'. Null if none."),
  bodyweight: z.number().nullable().describe("Bodyweight if recorded on the page. Null otherwise. In kg unless lb noted."),
  durationMin: z.number().int().nullable().describe("Session duration in minutes if noted."),
  notes: z.string().nullable().describe("OPTIONAL legacy single-blob notes field. Prefer the structured 'sessionNotes' array below."),
  sessionNotes: z.array(ParsedSessionNoteSchema).describe("Free-form session-level notes that are NOT tied to a specific exercise — sleep quality, mood, environment, soreness, intent. Each note is one observation."),
  exercises: z.array(ParsedExerciseSchema).describe("Ordered list of exercises performed. If multiple pages were given, MERGE them into one ordered list, deduplicating any exercise that appears on more than one page (e.g., a continuation onto a second page)."),
  confidence: z.enum(["high", "medium", "low"]).describe("Overall confidence in the parse. Low if handwriting was very unclear or pages were illegible in places."),
  warnings: z.array(z.string()).describe("Specific things you were unsure about, e.g. 'Set 3 of squats - reps could be 5 or 8', 'date unclear, used today'. Be generous with these."),
});

export type ParsedSet = z.infer<typeof ParsedSetSchema>;
export type ParsedExercise = z.infer<typeof ParsedExerciseSchema>;
export type ParsedSessionNote = z.infer<typeof ParsedSessionNoteSchema>;
export type ParsedWorkout = z.infer<typeof ParsedWorkoutSchema>;
