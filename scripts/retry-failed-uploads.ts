/**
 * Retry the specific photos that failed during the SQLite → Supabase
 * migration with transient network errors. Idempotent: if the object
 * already exists it'll overwrite it.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const FAILED = [
  "1776380161490-8b71ff8c.jpg",
  "1776380503059-6bdf21b2.jpg",
  "1776380509882-34d7ae2f.jpg",
  "1776382571336-e0386496.jpg",
  "1776382602879-ef093ef2.jpg",
  "1776382603674-19db41ff.jpg",
  "1776382638372-25d57d18.jpg",
  "1776382638919-1ed09f67.jpg",
];
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "workout-photos";
const UPLOADS_DIR = join(process.cwd(), "uploads");

async function main() {
  const storage = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  for (const name of FAILED) {
    let attempt = 0;
    const maxAttempts = 4;
    while (attempt < maxAttempts) {
      attempt++;
      try {
        const bytes = await readFile(join(UPLOADS_DIR, name));
        const ext = name.split(".").pop()?.toLowerCase() ?? "";
        const contentType = ext === "png" ? "image/png" : "image/jpeg";
        const { error } = await storage.storage
          .from(BUCKET)
          .upload(name, bytes, { contentType, upsert: true });
        if (error) throw new Error(error.message);
        console.log(`  ✓ ${name}`);
        break;
      } catch (err) {
        if (attempt === maxAttempts) {
          console.warn(`  ✕ ${name} — ${(err as Error).message} (gave up after ${maxAttempts})`);
        } else {
          const backoff = 500 * attempt;
          console.log(`  ⟳ ${name} — ${(err as Error).message}, retrying in ${backoff}ms`);
          await new Promise((r) => setTimeout(r, backoff));
        }
      }
    }
  }
  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
