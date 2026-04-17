/**
 * Retroactively run the image hygiene pipeline over every photo that
 * existed before compression shipped. For each workout row + workout
 * page, reprocess the Storage object (HEIC→JPEG, resize, compress),
 * swap the path in the DB, and orphan the original. The orphan sweeper
 * (app/api/admin/sweep-orphans) reaps those later.
 *
 * Idempotent-ish: running twice is harmless — the second pass just
 * produces a newer .jpg and orphans the first. If you want a clean
 * result, run this once then hit /api/admin/sweep-orphans.
 *
 *   set -a; source .env.local; set +a
 *   npx tsx scripts/backfill-compress-images.ts
 */
import { PrismaClient } from "@prisma/client";
import { reprocessStoredImage } from "@/lib/image_pipeline";

async function main() {
  const prisma = new PrismaClient();
  const workouts = await prisma.workout.findMany({
    select: { id: true, imagePath: true },
    where: { imagePath: { not: null } },
  });
  const pages = await prisma.workoutPage.findMany({
    select: { id: true, imagePath: true },
  });

  console.log(`• ${workouts.length} workout cover images`);
  console.log(`• ${pages.length} workout pages`);

  let savedBytes = 0;
  let failed = 0;

  // Any given path might appear as both a Workout.imagePath AND a
  // WorkoutPage.imagePath (the cover is usually page 0). Process each
  // unique path once, then update every row that referenced it.
  const uniquePaths = new Set<string>();
  for (const w of workouts) if (w.imagePath) uniquePaths.add(w.imagePath);
  for (const p of pages) uniquePaths.add(p.imagePath);

  console.log(`• ${uniquePaths.size} unique source objects to process\n`);

  const rewrite = new Map<string, string>(); // oldPath → newPath
  let n = 0;
  for (const oldPath of uniquePaths) {
    n++;
    try {
      const res = await reprocessStoredImage(oldPath);
      rewrite.set(oldPath, res.newRelativePath);
      savedBytes += res.oldBytes - res.newBytes;
      console.log(
        `  [${n}/${uniquePaths.size}] ${formatKB(res.oldBytes)} → ${formatKB(res.newBytes)}  (${oldPath.slice(-20)})`,
      );
    } catch (e) {
      failed++;
      console.warn(`  [${n}/${uniquePaths.size}] FAILED ${oldPath}: ${(e as Error).message}`);
    }
  }

  console.log("\n• updating DB references …");
  // Update Workout.imagePath in batches
  for (const w of workouts) {
    if (w.imagePath && rewrite.has(w.imagePath)) {
      await prisma.workout.update({
        where: { id: w.id },
        data: { imagePath: rewrite.get(w.imagePath)! },
      });
    }
  }
  for (const p of pages) {
    if (rewrite.has(p.imagePath)) {
      await prisma.workoutPage.update({
        where: { id: p.id },
        data: { imagePath: rewrite.get(p.imagePath)! },
      });
    }
  }

  console.log(
    `\n✓ reprocessed ${rewrite.size}/${uniquePaths.size}, saved ${formatKB(savedBytes)}, failed ${failed}`,
  );
  console.log(
    "  Run /api/admin/sweep-orphans (POST) to delete the now-unreferenced originals.",
  );
  await prisma.$disconnect();
}

function formatKB(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
