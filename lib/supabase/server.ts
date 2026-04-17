import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client bound to the incoming request's cookies.
 * Use this inside Server Components, Route Handlers, and Server Actions
 * when you need to know who's currently signed in. Carries the user's
 * JWT on every request so Row Level Security policies apply.
 */
export async function supabaseServer() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (all) => {
          try {
            for (const { name, value, options } of all) {
              jar.set(name, value, options);
            }
          } catch {
            // setAll is called from Server Components that cannot mutate
            // cookies — the middleware will refresh the session later.
          }
        },
      },
    },
  );
}
