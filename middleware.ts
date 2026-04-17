import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Auth middleware — runs on every request, refreshes the Supabase
 * session cookies, and redirects unauthenticated visitors to /login
 * for any page that isn't publicly accessible.
 *
 * Single-user gate: if ALLOWED_EMAIL is set, only that address can hold
 * a session. Anyone else is signed out immediately.
 */

const PUBLIC_PATHS = [
  "/login",
  "/auth/callback",
];

const PUBLIC_PREFIXES = [
  "/_next",
  "/favicon",
  // Auth-related API routes used BY the login flow itself must be
  // reachable before a session exists.
  "/api/auth",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Bypass public paths early — middleware's own cookie refresh isn't
  // needed if the request was never going to hit the app anyway.
  if (
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  let res = NextResponse.next({
    request: { headers: req.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (all) => {
          for (const { name, value } of all) {
            req.cookies.set(name, value);
          }
          res = NextResponse.next({ request: { headers: req.headers } });
          for (const { name, value, options } of all) {
            res.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Single-user allowlist
  const allowed = (process.env.ALLOWED_EMAIL ?? "").toLowerCase().trim();
  if (allowed && user.email?.toLowerCase() !== allowed) {
    await supabase.auth.signOut();
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "not-authorised");
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  // Match everything except static assets (next/image, fonts, etc).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
