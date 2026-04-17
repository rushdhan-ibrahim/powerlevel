/**
 * One-shot migration: pulls every workout row and every photo file from
 * the old SQLite DB + local uploads/ folder, and replays them into the
 * new Supabase Postgres + Storage bucket.
 *
 * Safe to re-run: before inserting, it wipes any existing rows from the
 * Supabase Postgres schema and deletes every object in the bucket.
 *
 * Run with:
 *   set -a; source .env.local; set +a
 *   npx tsx scripts/migrate-sqlite-to-supabase.ts
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { PrismaClient as PgPrisma } from "@prisma/client";
import Database from "better-sqlite3";
import { createClient } from "@supabase/supabase-js";

const SQLITE_PATH = join(process.cwd(), "prisma/dev.db");
const UPLOADS_DIR = join(process.cwd(), "uploads");
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "workout-photos";

type Row = Record<string, unknown>;

async function main() {
  const sqlite = new Database(SQLITE_PATH, { readonly: true });
  const pg = new PgPrisma();
  const storage = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  // 1) Wipe destination so the migration is idempotent
  console.log("• wiping destination …");
  await pg.exerciseSet.deleteMany();
  await pg.exercise.deleteMany();
  await pg.sessionNote.deleteMany();
  await pg.workoutPage.deleteMany();
  await pg.workout.deleteMany();
  await pg.profile.deleteMany();

  // Storage wipe: list → bulk-remove
  const { data: existing } = await storage.storage.from(BUCKET).list("", {
    limit: 1000,
  });
  if (existing && existing.length > 0) {
    const names = existing.map((o) => o.name);
    const { error: rmErr } = await storage.storage.from(BUCKET).remove(names);
    if (rmErr) console.warn(`  storage wipe warning: ${rmErr.message}`);
    else console.log(`  removed ${names.length} objects from storage`);
  }

  // 2) Copy local photos → Supabase Storage
  console.log("• uploading photos …");
  let uploadedCount = 0;
  let skippedCount = 0;
  try {
    const files = await readdir(UPLOADS_DIR);
    for (const f of files) {
      if (f.startsWith(".")) continue;
      const bytes = await readFile(join(UPLOADS_DIR, f));
      const ext = f.split(".").pop()?.toLowerCase() ?? "";
      const contentType =
        ext === "heic" || ext === "heif"
          ? "image/heic"
          : ext === "png"
            ? "image/png"
            : ext === "webp"
              ? "image/webp"
              : "image/jpeg";
      const { error } = await storage.storage
        .from(BUCKET)
        .upload(f, bytes, { contentType, upsert: true });
      if (error) {
        console.warn(`  ✕ ${f} — ${error.message}`);
        skippedCount++;
      } else {
        uploadedCount++;
      }
    }
  } catch (err) {
    console.warn(`  uploads dir missing or unreadable: ${(err as Error).message}`);
  }
  console.log(`  uploaded ${uploadedCount} photos (${skippedCount} skipped)`);

  // 3) Replay SQLite rows → Postgres, preserving ids and ordering
  console.log("• copying rows …");
  const workouts = sqlite.prepare("SELECT * FROM Workout ORDER BY date ASC").all() as Row[];
  const exercises = sqlite.prepare("SELECT * FROM Exercise").all() as Row[];
  const sets = sqlite.prepare("SELECT * FROM ExerciseSet").all() as Row[];
  const pages = sqlite.prepare("SELECT * FROM WorkoutPage").all() as Row[];
  const notes = sqlite.prepare("SELECT * FROM SessionNote").all() as Row[];
  const profiles = sqlite.prepare("SELECT * FROM Profile").all() as Row[];

  console.log(
    `  rows: workouts=${workouts.length} exercises=${exercises.length} sets=${sets.length} pages=${pages.length} notes=${notes.length} profiles=${profiles.length}`,
  );

  for (const p of profiles) {
    await pg.profile.create({
      data: {
        id: String(p.id),
        displayName: toStrOrNull(p.displayName),
        heightCm: toNumOrNull(p.heightCm),
        bodyweightKg: toNumOrNull(p.bodyweightKg),
        birthYear: toIntOrNull(p.birthYear),
        sex: toStrOrNull(p.sex),
        goal: toStrOrNull(p.goal),
        units: toStrOrNull(p.units) ?? "kg",
        createdAt: toDate(p.createdAt),
        updatedAt: toDate(p.updatedAt),
      },
    });
  }

  // Workouts first (parents of everything else)
  for (const w of workouts) {
    await pg.workout.create({
      data: {
        id: String(w.id),
        date: toDate(w.date),
        title: toStrOrNull(w.title),
        notes: toStrOrNull(w.notes),
        bodyweight: toNumOrNull(w.bodyweight),
        durationMin: toIntOrNull(w.durationMin),
        imagePath: toStrOrNull(w.imagePath),
        rawParseJson: toStrOrNull(w.rawParseJson),
        parseModel: toStrOrNull(w.parseModel),
        parseTokensIn: toIntOrNull(w.parseTokensIn),
        parseTokensOut: toIntOrNull(w.parseTokensOut),
        createdAt: toDate(w.createdAt),
        updatedAt: toDate(w.updatedAt),
      },
    });
  }

  for (const p of pages) {
    await pg.workoutPage.create({
      data: {
        id: String(p.id),
        workoutId: String(p.workoutId),
        imagePath: String(p.imagePath),
        order: toIntOrNull(p.order) ?? 0,
      },
    });
  }

  for (const n of notes) {
    await pg.sessionNote.create({
      data: {
        id: String(n.id),
        workoutId: String(n.workoutId),
        body: String(n.body),
        kind: toStrOrNull(n.kind),
        order: toIntOrNull(n.order) ?? 0,
      },
    });
  }

  for (const e of exercises) {
    await pg.exercise.create({
      data: {
        id: String(e.id),
        workoutId: String(e.workoutId),
        name: String(e.name),
        normalizedName: String(e.normalizedName),
        canonicalSlug: toStrOrNull(e.canonicalSlug),
        category: toStrOrNull(e.category),
        pattern: toStrOrNull(e.pattern),
        variation: toStrOrNull(e.variation),
        muscleGroup: toStrOrNull(e.muscleGroup),
        notes: toStrOrNull(e.notes),
        order: toIntOrNull(e.order) ?? 0,
      },
    });
  }

  // Sets in batches — 1500 rows is enough to be noticeable one-at-a-time
  const chunkSize = 200;
  for (let i = 0; i < sets.length; i += chunkSize) {
    const chunk = sets.slice(i, i + chunkSize);
    await pg.exerciseSet.createMany({
      data: chunk.map((s) => ({
        id: String(s.id),
        exerciseId: String(s.exerciseId),
        order: toIntOrNull(s.order) ?? 0,
        weight: toNumOrNull(s.weight),
        weightUnit: toStrOrNull(s.weightUnit),
        reps: toIntOrNull(s.reps),
        durationSec: toIntOrNull(s.durationSec),
        distanceM: toNumOrNull(s.distanceM),
        rpe: toNumOrNull(s.rpe),
        isWarmup: toBool(s.isWarmup),
        isFailure: toBool(s.isFailure),
        notes: toStrOrNull(s.notes),
      })),
    });
  }

  console.log("✓ done");
  await pg.$disconnect();
  sqlite.close();
}

function toStrOrNull(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v);
  return s.length === 0 ? null : s;
}
function toIntOrNull(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}
function toNumOrNull(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function toBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") return v === "1" || v.toLowerCase() === "true";
  return false;
}
function toDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (typeof v === "number") return new Date(v);
  if (typeof v === "string") {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
