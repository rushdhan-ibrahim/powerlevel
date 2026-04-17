// deno-lint-ignore-file no-explicit-any
/**
 * Supabase Edge Function — parse a workout photograph with Gemini.
 *
 * Why this lives on Supabase, not Vercel:
 *   - Gemini 3.1 Pro with thinking mode can take 30-90s on a busy page.
 *     Vercel Hobby caps route duration at 60s; Pro at 300s. Supabase
 *     Edge Functions allow up to 400s and are free-tier-generous.
 *   - Keeps the GEMINI_API_KEY server-side. The browser never sees it.
 *
 * Input (POST JSON):
 *   { storagePaths: string[], bucket?: string }
 *     — paths within the Supabase Storage bucket (produced by the
 *       browser after uploading the photos). Multiple paths are
 *       treated as continuation pages of ONE workout.
 *
 * Output:
 *   { workout: ParsedWorkout, model, tokensIn?, tokensOut? }
 *   (or { error } on failure.)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";
import { GoogleGenAI } from "npm:@google/genai@1.0.0";
import { EXERCISE_LIBRARY_SUMMARY } from "../_shared/exercise-library.ts";

const MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-3.1-pro-preview";
// Bucket env var can't start with SUPABASE_ (reserved by the Edge runtime),
// so we use a plain STORAGE_BUCKET name here.
const DEFAULT_BUCKET = Deno.env.get("STORAGE_BUCKET") ?? "workout-photos";

function buildSystemPrompt(): string {
  return `You are an expert at reading handwritten gym and workout logs.
You will receive ONE OR MORE photographs of a lifter's training journal. When more
than one image is provided, treat them as different pages of the SAME workout
session (continuation pages, or notes overflowing onto a second sheet) and merge
the exercises into a single ordered list. If you see clear duplication (the same
exercise listed on two pages), keep only one copy.

Return STRUCTURED JSON matching the provided schema. No prose, no markdown.

═══════════════════════════════════════════════════════════════
CATEGORIES — drive how each set is interpreted

  weighted_reps     bar load × reps              (bench, squat, curl)
  bodyweight_reps   reps; weight = ADDED load    (pull-up, dip, push-up)
  timed_hold        seconds; weight = added      (plank, dead hang, L-sit)
  carry             load × distance × time       (farmer's carry, prowler)
  distance_time     distance & time              (sled drag, sprints)
  cardio_distance   distance × time × pace       (run, row, bike)
  reps_only         reps only                    (burpee, box jump)

For TIMED holds, set durationSec (convert mm:ss). reps = null. weight = added load if any.
For CARRIES, set weight (load) AND distanceM AND optionally durationSec. reps = null.
For DISTANCE work, set distanceM AND durationSec.
For CARDIO, distanceM (metres — convert km×1000, miles×1609) AND durationSec.

═══════════════════════════════════════════════════════════════
THE EXERCISE LIBRARY

Match each exercise to a canonical entry below if you can. Use the slug exactly
in the canonicalSlug field. Inherit category, pattern, and primaryMuscle from
the library entry. The aliases shown after each name in [brackets] are common
alternative names — match liberally. If no match, leave canonicalSlug null but
still set category, pattern (best guess), and muscleGroup yourself.

PRESERVE VARIATIONS via the 'variation' field: e.g.
  - "paused bench press"      → canonicalSlug "bench_press", variation "paused"
  - "tempo 3-1-1 squat"       → canonicalSlug "back_squat",  variation "tempo 3-1-1"
  - "close-grip bench"        → canonicalSlug "close_grip_bench_press" (it's its own entry)
  - "deficit deadlift"        → canonicalSlug "deficit_deadlift"

slug :: display :: category :: primaryMuscle [aliases]
${EXERCISE_LIBRARY_SUMMARY}

═══════════════════════════════════════════════════════════════
HANDWRITING & SHORTHAND CONVENTIONS

Common notations:
  • "3x5 @ 225"        = 3 sets of 5 reps at 225
  • "5/5/5"            = three sets of 5 reps each
  • "225x5, 245x3"     = pyramid up, expand into separate sets
  • "BW" or "bw"       = pure bodyweight (weightUnit "bw")
  • "+20" or "BW+20"   = bodyweight with 20 added (weight = 20)
  • "RPE 8" or "@8"    = Rate of Perceived Exertion 8/10
  • "F" or "+" after reps = taken to failure
  • "WU" or "w"        = warmup set
  • Times: "0:30", "30s", "30 sec" → durationSec
  • Distance: "100m", "0.1km" → distanceM
Common abbreviations: BP, OHP, RDL, SLDL, DL, SQ, BB, DB, KB, EZ, T-bar, BSS, RFESS.

DEFAULT WEIGHT UNIT is kg unless 'lb' is written or the numbers are obvious lb plates.

═══════════════════════════════════════════════════════════════
DATES

Look at the top of each page, headers, margins for a date. ISO format YYYY-MM-DD.
If the year is missing, assume the current year. If no date at all, omit the
field — the app will default it to today and surface a warning.

═══════════════════════════════════════════════════════════════
NOTES — three kinds, please separate them carefully

  1. Session-level notes  → 'sessionNotes' array (one entry per observation)
     Tag with kind: feeling | sleep | injury | nutrition | general.

  2. Exercise-level notes → exercise.notes

  3. Set-level notes      → set.notes

═══════════════════════════════════════════════════════════════
EXPANSION & ORDER

If multiple sets share the same weight × reps (e.g. "3x5 @225"), expand them
into 3 separate set objects. Preserve page order. When pages differ, earlier
page's exercises come first.

═══════════════════════════════════════════════════════════════
HONESTY

If you can't read something, set it to null and add a SPECIFIC warning. Confidence
"low" is fine if the page is genuinely hard to read.`;
}

// Gemini response schema — mirrors ParsedWorkoutSchema in lib/schema.ts.
// We hand-write it here to avoid pulling zod into the Deno bundle.
const responseSchema = {
  type: "object",
  propertyOrdering: [
    "date", "title", "bodyweight", "durationMin", "notes",
    "sessionNotes", "exercises", "confidence", "warnings",
  ],
  properties: {
    date: { type: "string" },
    title: { type: "string", nullable: true },
    bodyweight: { type: "number", nullable: true },
    durationMin: { type: "integer", nullable: true },
    notes: { type: "string", nullable: true },
    sessionNotes: {
      type: "array",
      items: {
        type: "object",
        propertyOrdering: ["body", "kind"],
        properties: {
          body: { type: "string" },
          kind: {
            type: "string",
            enum: ["feeling", "sleep", "injury", "nutrition", "general"],
          },
        },
        required: ["body", "kind"],
      },
    },
    exercises: {
      type: "array",
      items: {
        type: "object",
        propertyOrdering: [
          "name", "normalizedName", "canonicalSlug", "category",
          "pattern", "variation", "muscleGroup", "notes", "sets",
        ],
        properties: {
          name: { type: "string" },
          normalizedName: { type: "string" },
          canonicalSlug: { type: "string", nullable: true },
          category: {
            type: "string",
            enum: [
              "weighted_reps", "bodyweight_reps", "timed_hold",
              "carry", "distance_time", "cardio_distance", "reps_only",
            ],
          },
          pattern: {
            type: "string",
            nullable: true,
            enum: [
              "horizontal_push", "vertical_push",
              "horizontal_pull", "vertical_pull",
              "squat", "hinge", "lunge", "single_leg",
              "carry", "rotation", "anti_rotation",
              "isolation", "core", "cardio",
            ],
          },
          variation: { type: "string", nullable: true },
          muscleGroup: {
            type: "string",
            enum: [
              "chest", "back", "shoulders", "biceps", "triceps", "forearms",
              "quads", "hamstrings", "glutes", "calves", "core",
              "full_body", "cardio", "other",
            ],
          },
          notes: { type: "string", nullable: true },
          sets: {
            type: "array",
            items: {
              type: "object",
              propertyOrdering: [
                "weight", "weightUnit", "reps", "durationSec", "distanceM",
                "rpe", "isWarmup", "isFailure", "notes",
              ],
              properties: {
                weight: { type: "number", nullable: true },
                weightUnit: {
                  type: "string",
                  nullable: true,
                  enum: ["kg", "lb", "bw"],
                },
                reps: { type: "integer", nullable: true },
                durationSec: { type: "integer", nullable: true },
                distanceM: { type: "number", nullable: true },
                rpe: { type: "number", nullable: true },
                isWarmup: { type: "boolean" },
                isFailure: { type: "boolean" },
                notes: { type: "string", nullable: true },
              },
              required: [
                "weight", "weightUnit", "reps", "durationSec", "distanceM",
                "rpe", "isWarmup", "isFailure", "notes",
              ],
            },
          },
        },
        required: [
          "name", "normalizedName", "canonicalSlug", "category",
          "pattern", "variation", "muscleGroup", "notes", "sets",
        ],
      },
    },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    warnings: { type: "array", items: { type: "string" } },
  },
  required: [
    "date", "title", "bodyweight", "durationMin", "notes",
    "sessionNotes", "exercises", "confidence", "warnings",
  ],
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "POST only" }, 405);
  }

  // Verify the caller is an authenticated user of this Supabase project.
  // The Authorization header is auto-populated by the browser client when
  // the user has a session. Missing/invalid = 401.
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return json({ error: "unauthorized" }, 401);
  }
  const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await callerClient.auth.getUser();
  if (userErr || !userData?.user) {
    return json({ error: "unauthorized" }, 401);
  }

  let body: { storagePaths?: string[]; bucket?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }
  const paths = body.storagePaths ?? [];
  const bucket = body.bucket ?? DEFAULT_BUCKET;
  if (!Array.isArray(paths) || paths.length === 0) {
    return json({ error: "storagePaths is required" }, 400);
  }
  if (paths.length > 6) {
    return json({ error: "max 6 pages per parse" }, 400);
  }

  // Service-role client to read from the private bucket.
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const parts: Array<
    | { inlineData: { mimeType: string; data: string } }
    | { text: string }
  > = [];
  for (const rawPath of paths) {
    // The DB shape uses "uploads/<filename>" but the Storage key is just
    // "<filename>". Accept either form from the caller.
    const key = rawPath.replace(/^uploads\//, "");
    const { data, error } = await admin.storage.from(bucket).download(key);
    if (error || !data) {
      return json({ error: `download ${rawPath}: ${error?.message ?? "unknown"}` }, 400);
    }
    const bytes = new Uint8Array(await data.arrayBuffer());
    const mimeType = mimeOf(key);
    parts.push({
      inlineData: { mimeType, data: base64Encode(bytes) },
    });
  }
  parts.push({
    text:
      paths.length === 1
        ? "Parse this handwritten workout log into the structured schema. Extract every exercise, every set, all notes."
        : `Parse these ${paths.length} pages as ONE workout session. They are continuation pages. Merge the exercises into a single ordered list, dedupe any duplicates, and combine notes.`,
  });

  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiKey) {
    return json({ error: "GEMINI_API_KEY not set on this function" }, 500);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: buildSystemPrompt(),
        responseMimeType: "application/json",
        responseJsonSchema: responseSchema,
        temperature: 0.1,
      },
    });

    const text = (response as any).text;
    if (!text) return json({ error: "empty Gemini response" }, 502);

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      return json(
        {
          error: `invalid JSON from Gemini: ${(err as Error).message}`,
          raw: text.slice(0, 500),
        },
        502,
      );
    }
    // same defaulting as the server-side lib/gemini.ts
    if (parsed && typeof parsed === "object" && !parsed.date) {
      parsed.date = new Date().toISOString().slice(0, 10);
      parsed.warnings = [
        "No date found on the page; defaulted to today.",
        ...(Array.isArray(parsed.warnings) ? parsed.warnings : []),
      ];
    }
    if (parsed && !parsed.sessionNotes) parsed.sessionNotes = [];

    const usage = (response as any).usageMetadata;
    return json({
      workout: parsed,
      model: MODEL,
      tokensIn: usage?.promptTokenCount,
      tokensOut: usage?.candidatesTokenCount,
    });
  } catch (err) {
    return json({ error: (err as Error).message ?? "parse failed" }, 500);
  }
});

function mimeOf(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "heic":
      return "image/heic";
    case "heif":
      return "image/heif";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

function base64Encode(bytes: Uint8Array): string {
  // Deno has `btoa` but it wants a binary string; build in 32KB chunks to
  // avoid blowing the call stack on large images.
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(s);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
