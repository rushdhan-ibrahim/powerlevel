import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * OAuth callback — Supabase sends the authenticated user back here
 * with a ?code that we exchange for a session, then redirect on to
 * whatever page the login flow was originally heading to.
 *
 * Single-user enforcement also lives in middleware.ts, but duplicating
 * it here catches the brief window after OAuth completes but before
 * middleware runs on the next request.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  const origin = url.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing-code`);
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  // Enforce the single-user allow-list immediately so a rejected user
  // doesn't even briefly hold a session cookie pointing at the app.
  const allowed = (process.env.ALLOWED_EMAIL ?? "").toLowerCase().trim();
  if (allowed) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.email?.toLowerCase() !== allowed) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?error=not-authorised`);
    }
  }

  const safeNext = next.startsWith("/") ? next : "/";
  return NextResponse.redirect(`${origin}${safeNext}`);
}
