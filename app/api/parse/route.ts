import { NextResponse } from "next/server";
import { parseWorkoutImages, type ImagePart } from "@/lib/gemini";
import { saveUpload } from "@/lib/uploads";

export const runtime = "nodejs";
export const maxDuration = 180;

/**
 * POST /api/parse
 *
 * Accepts FormData with one or more image files under the "image" key.
 * Multiple images are treated as continuation pages of ONE workout —
 * Gemini merges them into a single session with one ordered exercise
 * list. To upload N independent workouts, the client makes N separate
 * POST calls (the bulk uploader does this client-side).
 *
 * Returns the parsed workout JSON (not yet saved) plus the relative
 * paths of the saved source images for the facsimile column.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("image").filter((v): v is File => v instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: `Unsupported file type: ${file.type}` },
          { status: 400 },
        );
      }
    }

    const saved: { relativePath: string; mimeType: string }[] = [];
    const parts: ImagePart[] = [];
    for (const file of files) {
      const bytes = Buffer.from(await file.arrayBuffer());
      const s = await saveUpload(bytes, file.type);
      saved.push({ relativePath: s.relativePath, mimeType: s.mimeType });
      parts.push({ bytes, mimeType: file.type });
    }

    const result = await parseWorkoutImages(parts);

    return NextResponse.json({
      workout: result.workout,
      imagePaths: saved.map((s) => s.relativePath),
      // legacy field for the single-image preview
      imagePath: saved[0]?.relativePath ?? null,
      meta: {
        model: result.model,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        pageCount: parts.length,
      },
    });
  } catch (err) {
    console.error("Parse error:", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Failed to parse images" },
      { status: 500 },
    );
  }
}
