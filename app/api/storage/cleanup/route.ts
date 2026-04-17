import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteStorageObjects } from "@/lib/image_pipeline";

/**
 * POST /api/storage/cleanup
 *
 * Delete a batch of storage objects. Called by the upload page when the
 * user cancels parsing or discards a parsed workout — the photos were
 * already uploaded (because the parse needs them), but without the
 * subsequent /api/workouts save they become orphans.
 *
 * Body: { paths: string[] }  // each path is "uploads/<filename>"
 */
const Body = z.object({
  paths: z.array(z.string()).max(24),
});

export async function POST(req: Request) {
  try {
    const { paths } = Body.parse(await req.json());
    const result = await deleteStorageObjects(paths);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "cleanup failed" },
      { status: 400 },
    );
  }
}
