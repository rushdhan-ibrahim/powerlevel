/**
 * Backfill the existing local FIT corpus into the Pilgrimage tables.
 *
 *   pnpm tsx scripts/import-fit-pilgrimage.ts [--folder=…]
 *
 * Default folder is the standalone-dashboard export. Idempotent on
 * file sha256 — running it twice does nothing extra. Logs one line
 * per file so a tail makes obvious what was new vs skipped.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { decodeFit, isRunningActivity } from "../lib/pilgrimage/fit-decoder";
import { ingestRun } from "../lib/pilgrimage/ingest";

const DEFAULT_FOLDER = "/Users/rush/Documents/Fit file extractor/fit_bulk_exporter_py_v2/Garmin_FIT_Export";

async function main() {
  const folderArg = process.argv.find(a => a.startsWith("--folder="));
  const folder = folderArg ? folderArg.split("=")[1] : DEFAULT_FOLDER;
  if (!fs.existsSync(folder)) {
    console.error(`Folder not found: ${folder}`);
    process.exit(1);
  }
  const files = fs.readdirSync(folder).filter(f => f.toLowerCase().endsWith(".fit")).sort();
  console.log(`Found ${files.length} FIT files in ${folder}`);
  let imported = 0, skipped = 0, ignored = 0, failed = 0;

  for (let i = 0; i < files.length; i++) {
    const name = files[i];
    const full = path.join(folder, name);
    const tag = `[${String(i + 1).padStart(3, " ")}/${files.length}] ${name}`;
    try {
      const buf = fs.readFileSync(full);
      const decoded = decodeFit(buf);
      if (!decoded) { console.log(`${tag}  ✘ undecodable`); failed += 1; continue; }
      if (!isRunningActivity(decoded)) {
        console.log(`${tag}  · ${decoded.sport} (not a run, skipped)`);
        ignored += 1; continue;
      }
      // Try to recover the Garmin activity id from the filename (e.g. "20046849285_…")
      const m = name.match(/^(\d{6,14})/);
      const garminActivityId = m ? m[1] : undefined;

      const res = await ingestRun(decoded, {
        source: "imported",
        garminActivityId,
        rawBytes: buf,
      });
      if (res.inserted) {
        console.log(`${tag}  ✔ imported  (${(decoded.distanceM / 1000).toFixed(2)} km / ${formatDuration(decoded.durationS)})`);
        imported += 1;
      } else {
        console.log(`${tag}  · already in db, skipped`);
        skipped += 1;
      }
    } catch (err) {
      console.error(`${tag}  ✘ error:`, (err as Error).message);
      failed += 1;
    }
  }

  console.log("");
  console.log(`Done. Imported ${imported}, already-present ${skipped}, non-run ${ignored}, failed ${failed}.`);
}

function formatDuration(s: number): string {
  s = Math.round(s);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
}

main().catch(e => { console.error(e); process.exit(1); });
