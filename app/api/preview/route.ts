import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/preview
 *
 * Returns a browser-renderable JPEG for any uploaded image. HEIC and
 * HEIF inputs are decoded to JPEG; other formats pass through. Used by
 * the bulk uploader to show thumbnails in the staging chain — browsers
 * won't render HEIC natively.
 *
 * Quality is intentionally low (0.5) — these are thumbnails.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "no image" }, { status: 400 });
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    const isHeic =
      /heic|heif/i.test(file.type) ||
      ext === "heic" ||
      ext === "heif" ||
      looksHeic(bytes);

    if (isHeic) {
      const jpeg = await convertHeicToJpeg(bytes);
      return new NextResponse(new Uint8Array(jpeg) as BodyInit, {
        headers: { "Content-Type": "image/jpeg", "Cache-Control": "no-cache" },
      });
    }

    return new NextResponse(new Uint8Array(bytes) as BodyInit, {
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "preview failed" },
      { status: 500 },
    );
  }
}

function looksHeic(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  if (buf.toString("ascii", 4, 8) !== "ftyp") return false;
  const brand = buf.toString("ascii", 8, 12);
  return /heic|heix|mif1|msf1|hevc|hevx/.test(brand);
}

async function convertHeicToJpeg(bytes: Buffer): Promise<Buffer> {
  const mod: unknown = await import("heic-convert");
  const fn = (mod as { default?: unknown }).default ?? mod;
  const convert = fn as (opts: {
    buffer: Buffer;
    format: "JPEG" | "PNG";
    quality?: number;
  }) => Promise<ArrayBuffer>;
  const out = await convert({ buffer: bytes, format: "JPEG", quality: 0.5 });
  return Buffer.from(out);
}
