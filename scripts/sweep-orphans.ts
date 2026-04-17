/**
 * Standalone sweep — same logic as app/api/admin/sweep-orphans but
 * runnable without auth, for local cleanup + scheduled jobs.
 *
 *   set -a; source .env.local; set +a
 *   npx tsx scripts/sweep-orphans.ts
 */
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "workout-photos";

async function main() {
  const prisma = new PrismaClient();
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const [workouts, pages] = await Promise.all([
    prisma.workout.findMany({
      select: { imagePath: true },
      where: { imagePath: { not: null } },
    }),
    prisma.workoutPage.findMany({ select: { imagePath: true } }),
  ]);

  const wanted = new Set<string>();
  for (const w of workouts) if (w.imagePath) wanted.add(norm(w.imagePath));
  for (const p of pages) wanted.add(norm(p.imagePath));

  const allKeys: string[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await admin.storage
      .from(BUCKET)
      .list("", { limit: 1000, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    for (const o of data) if (o.name) allKeys.push(o.name);
    if (data.length < 1000) break;
    offset += 1000;
  }

  const orphans = allKeys.filter((k) => !wanted.has(k));
  console.log(`scanned=${allKeys.length} wanted=${wanted.size} orphans=${orphans.length}`);

  if (orphans.length === 0) {
    await prisma.$disconnect();
    return;
  }

  let deleted = 0;
  for (let i = 0; i < orphans.length; i += 100) {
    const chunk = orphans.slice(i, i + 100);
    const { data, error } = await admin.storage.from(BUCKET).remove(chunk);
    if (error) {
      console.warn(`chunk ${i} failed: ${error.message}`);
      continue;
    }
    deleted += data?.length ?? 0;
  }
  console.log(`deleted=${deleted}`);
  await prisma.$disconnect();
}

function norm(p: string): string {
  return p.replace(/^uploads\//, "");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
