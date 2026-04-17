"use client";

import type { ParsedWorkout } from "@/lib/schema";
import { supabaseBrowser } from "@/lib/supabase/browser";

/**
 * Client-side orchestration of a Gemini parse:
 *   1. POST the image file(s) to /api/parse — fast (just uploads them to
 *      Supabase Storage) and returns the paths.
 *   2. Call the `parse-workout` Supabase Edge Function with those paths.
 *      The Edge Function runs on Deno (400s timeout) so the Gemini call
 *      never hits Vercel's 60s cap.
 *   3. On cancel/error, delete the uploaded paths via /api/storage/cleanup
 *      so we don't leave orphan photos in Storage.
 */

type Meta = {
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  pageCount?: number;
};

export type ParseResult = {
  workout: ParsedWorkout;
  imagePaths: string[];
  meta?: Meta;
};

export async function uploadForParse(
  files: File[],
  opts: { signal?: AbortSignal } = {},
): Promise<{ imagePaths: string[] }> {
  const fd = new FormData();
  for (const f of files) fd.append("image", f);
  const res = await fetch("/api/parse", {
    method: "POST",
    body: fd,
    signal: opts.signal,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Upload failed (${res.status})`);
  }
  const data = (await res.json()) as { imagePaths: string[] };
  return { imagePaths: data.imagePaths };
}

export async function parseViaEdgeFunction(
  imagePaths: string[],
  opts: { signal?: AbortSignal } = {},
): Promise<{ workout: ParsedWorkout; meta: Meta }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Supabase env vars missing on the client.");
  }

  // The Edge Function verifies the caller's Supabase session bearer; the
  // browser client has that token after Google sign-in.
  const supabase = supabaseBrowser();
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    throw new Error("Not signed in — can't call the parse function.");
  }

  const res = await fetch(`${url}/functions/v1/parse-workout`, {
    method: "POST",
    headers: {
      apikey: anon,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ storagePaths: imagePaths }),
    signal: opts.signal,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Parse failed (${res.status})`);
  }
  const data = await res.json();
  return {
    workout: data.workout,
    meta: {
      model: data.model,
      tokensIn: data.tokensIn,
      tokensOut: data.tokensOut,
      pageCount: imagePaths.length,
    },
  };
}

export async function parseWorkout(
  files: File[],
  opts: { signal?: AbortSignal } = {},
): Promise<ParseResult> {
  const { imagePaths } = await uploadForParse(files, opts);
  try {
    const { workout, meta } = await parseViaEdgeFunction(imagePaths, opts);
    return { workout, imagePaths, meta };
  } catch (err) {
    // Clean up the just-uploaded orphans on parse failure. Best-effort.
    cleanupStorage(imagePaths).catch(() => {});
    throw err;
  }
}

export async function cleanupStorage(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  try {
    await fetch("/api/storage/cleanup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paths }),
    });
  } catch {
    // Non-fatal — the orphan-sweeper endpoint can pick them up later.
  }
}
