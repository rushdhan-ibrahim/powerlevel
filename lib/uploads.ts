import { randomUUID } from "node:crypto";
import { STORAGE_BUCKET, supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Save an uploaded workout photo to Supabase Storage.
 *
 * HEIC files are stored as-is: Gemini reads image/heic natively, and
 * the browser display path runs them through a converter route so it
 * doesn't matter to the reader. Storing originals also means we never
 * lose resolution to a JPEG re-encode.
 *
 * Storage key: the bare filename (e.g. "1776384593123-ab12cd.heic")
 * DB `imagePath`: "uploads/<filename>" — matches the existing URL shape
 *   (`/api/uploads/<filename>`) so older rows keep working.
 */
export async function saveUpload(
  bytes: Buffer,
  mimeType: string,
): Promise<{ relativePath: string; storageKey: string; mimeType: string }> {
  const isHeic =
    /heic|heif/i.test(mimeType) ||
    // iPhone picks sometimes arrive with a generic mime — sniff magic bytes
    looksHeic(bytes);

  const storedMime = isHeic
    ? mimeType === "image/heif" ? "image/heif" : "image/heic"
    : mimeType || "application/octet-stream";

  const ext = isHeic ? "heic" : guessExt(mimeType);
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;

  const admin = supabaseAdmin();
  const { error } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(filename, bytes, {
      contentType: storedMime,
      upsert: false,
    });
  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  return {
    relativePath: `uploads/${filename}`,
    storageKey: filename,
    mimeType: storedMime,
  };
}

function guessExt(mime: string): string {
  const raw = mime.split("/")[1]?.split(";")[0]?.toLowerCase() ?? "bin";
  if (raw === "jpeg") return "jpg";
  return raw;
}

function looksHeic(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  if (buf.toString("ascii", 4, 8) !== "ftyp") return false;
  const brand = buf.toString("ascii", 8, 12);
  return /heic|heix|mif1|msf1|hevc|hevx/.test(brand);
}
