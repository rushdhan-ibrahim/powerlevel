import { NextResponse } from "next/server";
import { saveUpload } from "@/lib/uploads";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/parse
 *
 * Uploads one or more images to Supabase Storage and returns their paths.
 * The browser then calls the `parse-workout` Supabase Edge Function with
 * those paths — that's where Gemini runs, off Vercel's 60s cap.
 *
 * The separation keeps every leg short: this endpoint only holds image
 * bytes long enough to stream them to Storage, and the Edge Function
 * never has to transport image bytes over HTTP (it pulls them from
 * Storage using the service role).
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("image").filter((v): v is File => v instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }
    for (const file of files) {
      if (!file.type.startsWith("image/") && !/heic|heif/i.test(file.name)) {
        return NextResponse.json(
          { error: `Unsupported file type: ${file.type || file.name}` },
          { status: 400 },
        );
      }
    }

    const saved: { relativePath: string; mimeType: string }[] = [];
    for (const file of files) {
      const bytes = Buffer.from(await file.arrayBuffer());
      const s = await saveUpload(bytes, file.type);
      saved.push({ relativePath: s.relativePath, mimeType: s.mimeType });
    }

    return NextResponse.json({
      imagePaths: saved.map((s) => s.relativePath),
      imagePath: saved[0]?.relativePath ?? null,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Failed to upload images" },
      { status: 500 },
    );
  }
}
