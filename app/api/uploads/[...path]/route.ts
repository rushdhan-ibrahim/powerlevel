import { NextResponse } from "next/server";
import { STORAGE_BUCKET, supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// module-level cache for converted HEIC payloads so we don't re-decode
// the same file on every refresh
const heicCache = new Map<string, Uint8Array>();

/**
 * GET /api/uploads/<filename>
 *
 * Serves workout photos from the private Supabase Storage bucket.
 * HEIC/HEIF are decoded to JPEG on the fly (browsers can't render
 * them natively); everything else is proxied with the original bytes.
 *
 * The bucket is private — the service-role download used here is
 * gated by the Next.js route, which after 2e will require an
 * authenticated session.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const safe = path
    .filter((seg) => !seg.includes("..") && !seg.startsWith("/"))
    .join("/");

  try {
    const admin = supabaseAdmin();
    const ext = safe.split(".").pop()?.toLowerCase() ?? "";
    const isHeic = ext === "heic" || ext === "heif";

    // HEIC browser fallback — convert to JPEG on first request, cache in
    // memory. Bytes have to flow through this function because the
    // client browser can't decode heif natively.
    if (isHeic) {
      const cached = heicCache.get(safe);
      if (cached) {
        return new NextResponse(cached as BodyInit, {
          headers: {
            "Content-Type": "image/jpeg",
            "Cache-Control": "private, max-age=86400",
          },
        });
      }
      const { data, error } = await admin.storage
        .from(STORAGE_BUCKET)
        .download(safe);
      if (error || !data) throw new Error(error?.message ?? "Not found");
      const source = Buffer.from(await data.arrayBuffer());
      const jpeg = await convertHeicToJpeg(source);
      const bytes = new Uint8Array(jpeg);
      heicCache.set(safe, bytes);
      return new NextResponse(bytes as BodyInit, {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "private, max-age=86400",
        },
      });
    }

    // Non-HEIC — let the browser fetch the bytes DIRECTLY from Supabase
    // Storage's edge CDN. We only mint a short-lived signed URL and
    // redirect. This removes the "pull bytes through Vercel" hop that
    // was bottlenecking pages with multiple photos.
    const { data: signed, error: signErr } = await admin.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(safe, 60 * 60); // 1h — browser caches + follows the redirect
    if (signErr || !signed?.signedUrl) {
      throw new Error(signErr?.message ?? "sign failed");
    }
    return NextResponse.redirect(signed.signedUrl, {
      status: 302,
      headers: {
        // Let the browser remember this redirect for the signed URL's
        // entire validity window rather than hitting us for every image.
        "Cache-Control": "private, max-age=3300",
      },
    });
  } catch (err) {
    // Log the real failure so it shows up in vercel logs — silent 404s
    // made the recent missing-image issue hard to debug.
    console.error(
      `[uploads] failed for "${safe}": ${(err as Error).message ?? err}`,
    );
    return new NextResponse("Not found", {
      status: 404,
      headers: { "x-powerlevel-error": (err as Error).message ?? "unknown" },
    });
  }
}

async function convertHeicToJpeg(bytes: Buffer): Promise<Buffer> {
  const mod: unknown = await import("heic-convert");
  const fn = (mod as { default?: unknown }).default ?? mod;
  const convert = fn as (opts: {
    buffer: Buffer;
    format: "JPEG" | "PNG";
    quality?: number;
  }) => Promise<ArrayBuffer>;
  const out = await convert({ buffer: bytes, format: "JPEG", quality: 0.9 });
  return Buffer.from(out);
}
