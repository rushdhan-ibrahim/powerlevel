import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { STORAGE_BUCKET, supabaseAdmin } from "@/lib/supabase/admin";

/**
 * POST /api/admin/sweep-orphans
 *
 * Removes Storage objects that no longer belong to any workout —
 * leftovers from failed parses, cancelled uploads, or a save that
 * replaced an object but lost the race to delete the original.
 *
 * Builds the "wanted" set from Workout.imagePath + WorkoutPage.imagePath.
 * Anything else in the bucket is an orphan.
 *
 * Returns a summary — no hidden bulk destruction. Safe to re-run.
 */
export const runtime = "nodejs";
export const maxDuration = 120;

const PAGE_SIZE = 1000;

export async function POST() {
  const admin = supabaseAdmin();

  // 1) Build the wanted set from the DB
  const [workouts, pages] = await Promise.all([
    prisma.workout.findMany({
      select: { imagePath: true },
      where: { imagePath: { not: null } },
    }),
    prisma.workoutPage.findMany({ select: { imagePath: true } }),
  ]);

  const wanted = new Set<string>();
  for (const w of workouts) {
    if (w.imagePath) wanted.add(normaliseKey(w.imagePath));
  }
  for (const p of pages) {
    wanted.add(normaliseKey(p.imagePath));
  }

  // 2) Enumerate bucket
  const allKeys: string[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await admin.storage
      .from(STORAGE_BUCKET)
      .list("", { limit: PAGE_SIZE, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`list failed: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const obj of data) {
      if (obj.name) allKeys.push(obj.name);
    }
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  const orphans = allKeys.filter((k) => !wanted.has(k));

  if (orphans.length === 0) {
    return NextResponse.json({
      scanned: allKeys.length,
      wanted: wanted.size,
      orphans: 0,
      deleted: 0,
    });
  }

  // 3) Delete in chunks — supabase remove() accepts arrays but don't push too many
  let deleted = 0;
  const chunkSize = 100;
  for (let i = 0; i < orphans.length; i += chunkSize) {
    const chunk = orphans.slice(i, i + chunkSize);
    const { data, error } = await admin.storage.from(STORAGE_BUCKET).remove(chunk);
    if (error) {
      console.warn(`[sweep] chunk ${i} failed: ${error.message}`);
      continue;
    }
    deleted += data?.length ?? 0;
  }

  return NextResponse.json({
    scanned: allKeys.length,
    wanted: wanted.size,
    orphans: orphans.length,
    deleted,
    samples: orphans.slice(0, 10),
  });
}

export async function GET() {
  return NextResponse.json({
    hint:
      "POST this endpoint to delete every Storage object that no workout row references.",
  });
}

function normaliseKey(p: string): string {
  return p.replace(/^uploads\//, "");
}
