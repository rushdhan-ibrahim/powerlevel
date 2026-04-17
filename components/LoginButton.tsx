"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export function LoginButton({ redirectTo }: { redirectTo: string }) {
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const sign = async () => {
    setPending(true);
    setErr(null);
    try {
      const supabase = supabaseBrowser();
      // After Google redirects back to /auth/callback, it in turn redirects
      // to `redirectTo` (which was ?next=… on the login page).
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", redirectTo);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callback.toString() },
      });
      if (error) throw error;
      // signInWithOAuth does a full-page redirect on success; if we're still
      // here we expect an explicit error object.
    } catch (e) {
      setErr((e as Error).message ?? "Sign-in failed");
      setPending(false);
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <button
        type="button"
        onClick={sign}
        disabled={pending}
        className="btn btn-rubric btn-quill"
      >
        {pending ? "redirecting to google…" : "sign in with google"}
      </button>
      {err && (
        <div
          style={{
            marginTop: 14,
            fontFamily: "var(--italic)",
            fontStyle: "italic",
            fontSize: ".88rem",
            color: "var(--rubric)",
          }}
        >
          {err}
        </div>
      )}
    </div>
  );
}
