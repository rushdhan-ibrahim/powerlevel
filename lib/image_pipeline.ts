import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { STORAGE_BUCKET, supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Image hygiene pipeline for Powerlevel.
 *
 * When a workout is SAVED, every source image is:
 *   1. downloaded from Storage at its current path
 *   2. decoded (HEIC → RGB via heic-convert, everything else via sharp)
 *   3. resized so the long edge is ≤ MAX_LONG_EDGE (default 2000px)
 *   4. re-encoded to JPEG at TARGET_QUALITY (default 0.82)
 *   5. uploaded as a NEW .jpg object
 *   6. the ORIGINAL object is then deleted
 *
 * The returned `newPath` is the "uploads/<filename>" shape that the DB
 * stores — keeps the existing URL shape (`/api/uploads/<filename>`)
 * intact, so nothing downstream has to care about the swap.
 *
 * A raw HEIC at 3024×4032 (~3 MB) shrinks to about 300–500 kB after
 * this pass, which is plenty for reviewing the facsimile later.
 */

const MAX_LONG_EDGE = 2000;
const TARGET_QUALITY = 82;

type ReprocessResult = {
  oldStorageKey: string;
  newStorageKey: string;
  newRelativePath: string; // "uploads/<filename>"
  oldBytes: number;
  newBytes: number;
};

export async function reprocessStoredImage(
  storagePath: string, // either "uploads/<name>" or bare "<name>"
): Promise<ReprocessResult> {
  const oldKey = storagePath.replace(/^uploads\//, "");
  const admin = supabaseAdmin();

  // 1) download original
  const { data: dl, error: dlErr } = await admin.storage
    .from(STORAGE_BUCKET)
    .download(oldKey);
  if (dlErr || !dl) {
    throw new Error(`download failed: ${dlErr?.message ?? "no data"}`);
  }
  const srcBytes = Buffer.from(await dl.arrayBuffer());
  const oldBytes = srcBytes.length;

  // 2) HEIC → JPEG pre-step if needed (sharp's macOS build doesn't
  //    always include libheif; rely on heic-convert for that leg)
  const ext = oldKey.split(".").pop()?.toLowerCase() ?? "";
  const looksHeic = ext === "heic" || ext === "heif" || isHeicBuffer(srcBytes);

  let decoded: Buffer;
  if (looksHeic) {
    decoded = await heicToJpegBuffer(srcBytes);
  } else {
    decoded = srcBytes;
  }

  // 3) resize + re-encode via sharp
  const processed = await sharp(decoded, { failOn: "none" })
    .rotate() // respect EXIF orientation (iPhone photos commonly need this)
    .resize({
      width: MAX_LONG_EDGE,
      height: MAX_LONG_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: TARGET_QUALITY, mozjpeg: true })
    .toBuffer();

  // 4) upload fresh object under a .jpg name. We DO NOT delete the
  //    original here: the caller is responsible for committing the DB
  //    swap first and only then removing the now-orphaned original. A
  //    crash between "upload new" and "delete old" only leaves a new
  //    orphan (reaped by the orphan sweeper), never a broken DB ref.
  const newKey = `${Date.now()}-${randomUUID().slice(0, 8)}.jpg`;
  const { error: upErr } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(newKey, processed, {
      contentType: "image/jpeg",
      upsert: false,
    });
  if (upErr) {
    throw new Error(`reupload failed: ${upErr.message}`);
  }

  return {
    oldStorageKey: oldKey,
    newStorageKey: newKey,
    newRelativePath: `uploads/${newKey}`,
    oldBytes,
    newBytes: processed.length,
  };
}

/**
 * Delete a set of storage objects (called on cancel/discard). Safe to
 * call with bogus keys — the underlying remove() just returns them in
 * the error channel and we drop those on the floor.
 */
export async function deleteStorageObjects(
  relativePaths: string[],
): Promise<{ deleted: number; failed: string[] }> {
  if (relativePaths.length === 0) return { deleted: 0, failed: [] };
  const keys = relativePaths.map((p) => p.replace(/^uploads\//, ""));
  const admin = supabaseAdmin();
  const { data, error } = await admin.storage
    .from(STORAGE_BUCKET)
    .remove(keys);
  if (error) {
    return { deleted: 0, failed: keys };
  }
  return { deleted: data?.length ?? 0, failed: [] };
}

function isHeicBuffer(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  if (buf.toString("ascii", 4, 8) !== "ftyp") return false;
  const brand = buf.toString("ascii", 8, 12);
  return /heic|heix|mif1|msf1|hevc|hevx/.test(brand);
}

async function heicToJpegBuffer(bytes: Buffer): Promise<Buffer> {
  // heic-convert is CJS; dynamic-import to behave under Next's ESM runtime.
  const mod: unknown = await import("heic-convert");
  const fn = (mod as { default?: unknown }).default ?? mod;
  const convert = fn as (opts: {
    buffer: Buffer;
    format: "JPEG" | "PNG";
    quality?: number;
  }) => Promise<ArrayBuffer>;
  const out = await convert({ buffer: bytes, format: "JPEG", quality: 0.95 });
  return Buffer.from(out);
}
