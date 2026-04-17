import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. BYPASSES Row Level Security — only use
 * server-side, never in client bundles. Needed for:
 *   - writing to Storage after a successful upload parse
 *   - generating signed URLs for private bucket reads
 *   - one-off migrations / admin endpoints
 */
let _admin: ReturnType<typeof createClient> | null = null;

export function supabaseAdmin() {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the env.",
    );
  }
  _admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "workout-photos";
