import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { ParsedWorkoutSchema, type ParsedWorkout } from "./schema";
import { librarySummaryForPrompt } from "./exercise_library";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.1-pro-preview";

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
This way related work groups together for progression while still recording
what was actually performed.

slug :: display :: category :: primaryMuscle [aliases]
${librarySummaryForPrompt()}

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

DEFAULT WEIGHT UNIT is kg unless 'lb' is written or the numbers are obvious lb plates
(e.g. 135, 225, 315, 405 in a US context).

═══════════════════════════════════════════════════════════════
DATES

Look at the top of each page, headers, margins for a date. ISO format YYYY-MM-DD.
If the year is missing, assume the current year (we'll surface a warning). If no
date at all, omit the field — the app will default it to today and flag the
assumption in warnings.

═══════════════════════════════════════════════════════════════
NOTES — three kinds, please separate them carefully

  1. Session-level notes  → 'sessionNotes' array (one entry per observation)
     Examples: "slept 5h", "elbow tight", "felt strong", "rainy day, gym empty",
     "first heavy session post-flu", "experimented with paused reps today".
     Tag with kind: feeling | sleep | injury | nutrition | general.

  2. Exercise-level notes → exercise.notes (free-form string)
     Examples: "tempo 3-1-1 throughout", "with chains", "belt on working sets",
     "first time trying these".

  3. Set-level notes      → set.notes
     Examples: "left shoulder twinge", "barely cleaned", "easy", "form broke".

If a note is clearly about a specific exercise, attach it to that exercise.
If it's about a single set, attach it to that set. Otherwise it's session-level.

═══════════════════════════════════════════════════════════════
EXPANSION & ORDER

If multiple sets share the same weight × reps (e.g. "3x5 @225"), expand them
into 3 separate set objects in the sets array. Preserve the order exercises
appear on the page (top to bottom, left to right). When pages differ, the
chronologically earlier page's exercises come first.

═══════════════════════════════════════════════════════════════
HONESTY

If you cannot read something, set it to null and add a SPECIFIC warning. Be
generous — confidence "low" is fine if the page is genuinely hard to read.
The lifter will review your parse before saving.`;
}

/* ═══════════════════════════════════════════════════════════════
   Schema → Gemini JSON schema
   ═══════════════════════════════════════════════════════════════ */

let _client: GoogleGenAI | null = null;
function client() {
  if (_client) return _client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment");
  }
  _client = new GoogleGenAI({ apiKey });
  return _client;
}

function zodToGeminiSchema(schema: z.ZodTypeAny): unknown {
  const def = schema._def;

  if (schema instanceof z.ZodObject) {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    const shape = schema.shape;
    for (const key of Object.keys(shape)) {
      const child = shape[key] as z.ZodTypeAny;
      properties[key] = zodToGeminiSchema(child);
      if (!child.isOptional()) required.push(key);
    }
    return { type: "object", properties, required, propertyOrdering: Object.keys(shape) };
  }
  if (schema instanceof z.ZodArray) {
    return { type: "array", items: zodToGeminiSchema(def.type) };
  }
  if (schema instanceof z.ZodEnum) {
    return { type: "string", enum: def.values, description: schema.description };
  }
  if (schema instanceof z.ZodString) {
    return { type: "string", description: schema.description };
  }
  if (schema instanceof z.ZodNumber) {
    const isInt = (def.checks ?? []).some((c: { kind: string }) => c.kind === "int");
    return { type: isInt ? "integer" : "number", description: schema.description };
  }
  if (schema instanceof z.ZodBoolean) {
    return { type: "boolean", description: schema.description };
  }
  if (schema instanceof z.ZodNullable) {
    const inner = zodToGeminiSchema(def.innerType) as Record<string, unknown>;
    return { ...inner, nullable: true };
  }
  if (schema instanceof z.ZodOptional) {
    return zodToGeminiSchema(def.innerType);
  }
  throw new Error(`Unsupported zod type for Gemini schema: ${schema.constructor.name}`);
}

const responseSchema = zodToGeminiSchema(ParsedWorkoutSchema);

/* ═══════════════════════════════════════════════════════════════
   Public API
   ═══════════════════════════════════════════════════════════════ */

export type ImagePart = { bytes: Buffer; mimeType: string };

export type ParseResult = {
  workout: ParsedWorkout;
  raw: string;
  model: string;
  tokensIn?: number;
  tokensOut?: number;
};

/**
 * Parse one or more images of the SAME workout session.
 * Multiple images are treated as continuation pages.
 */
export async function parseWorkoutImages(images: ImagePart[]): Promise<ParseResult> {
  if (images.length === 0) {
    throw new Error("No images provided");
  }
  const ai = client();

  const parts: Array<
    | { inlineData: { mimeType: string; data: string } }
    | { text: string }
  > = images.map((img) => ({
    inlineData: { mimeType: img.mimeType, data: img.bytes.toString("base64") },
  }));
  parts.push({
    text:
      images.length === 1
        ? "Parse this handwritten workout log into the structured schema. Extract every exercise, every set, all notes."
        : `Parse these ${images.length} pages as ONE workout session. They are continuation pages. Merge the exercises into a single ordered list, dedupe any duplicates, and combine notes.`,
  });

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

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(text);
  } catch (err) {
    throw new Error(
      `Gemini returned invalid JSON: ${(err as Error).message}\n\nResponse: ${text.slice(0, 500)}`,
    );
  }

  // Coerce a missing 'date' to today (Gemini may omit it per the prompt).
  if (typeof parsedJson === "object" && parsedJson !== null) {
    const obj = parsedJson as Record<string, unknown>;
    if (!obj.date) {
      obj.date = new Date().toISOString().slice(0, 10);
      const warnings = Array.isArray(obj.warnings) ? (obj.warnings as string[]) : [];
      warnings.unshift("No date found on the page; defaulted to today.");
      obj.warnings = warnings;
    }
    if (!obj.sessionNotes) obj.sessionNotes = [];
  }

  const validated = ParsedWorkoutSchema.safeParse(parsedJson);
  if (!validated.success) {
    throw new Error(
      `Gemini response failed schema validation: ${validated.error.message}\n\nResponse: ${text.slice(0, 800)}`,
    );
  }

  const usage = response.usageMetadata;
  return {
    workout: validated.data,
    raw: text,
    model: MODEL,
    tokensIn: usage?.promptTokenCount,
    tokensOut: usage?.candidatesTokenCount,
  };
}

/** Backwards-compat single-image entry. */
export async function parseWorkoutImage(
  imageBytes: Buffer,
  mimeType: string,
): Promise<ParseResult> {
  return parseWorkoutImages([{ bytes: imageBytes, mimeType }]);
}
