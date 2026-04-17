/**
 * Re-render the static Gemini system prompt into supabase/functions/_shared/
 * so the Edge Function can import it without reaching back into the Next.js
 * codebase (Supabase only deploys the supabase/functions/* tree).
 *
 * Run when lib/exercise_library.ts changes:
 *   npx tsx scripts/build-edge-prompt.ts
 */
import { writeFileSync } from "node:fs";
import { librarySummaryForPrompt } from "@/lib/exercise_library";

const summary = librarySummaryForPrompt();
const body = `// Auto-generated from lib/exercise_library.ts. Do not edit by hand.
// Re-run: npx tsx scripts/build-edge-prompt.ts
export const EXERCISE_LIBRARY_SUMMARY = ${JSON.stringify(summary)};
`;
writeFileSync("supabase/functions/_shared/exercise-library.ts", body);
console.log(`wrote supabase/functions/_shared/exercise-library.ts · ${summary.length} chars`);
