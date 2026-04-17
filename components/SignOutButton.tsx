"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const signOut = async () => {
    setPending(true);
    try {
      const supabase = supabaseBrowser();
      await supabase.auth.signOut();
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={pending}
      style={{
        background: "transparent",
        border: "none",
        fontFamily: "var(--display)",
        fontVariant: "small-caps",
        fontSize: ".6rem",
        letterSpacing: ".18em",
        color: "var(--ash)",
        cursor: pending ? "wait" : "pointer",
        padding: 0,
      }}
    >
      {pending ? "signing out…" : "sign out"}
    </button>
  );
}
