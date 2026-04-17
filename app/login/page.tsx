import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { PageIncipit } from "@/components/manuscript/PageIncipit";
import { Ornament } from "@/components/manuscript/Ornament";
import { Initial } from "@/components/manuscript/Initial";
import { LoginButton } from "@/components/LoginButton";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect(next && next.startsWith("/") ? next : "/");

  return (
    <div>
      <PageIncipit
        eyebrow="Admission"
        title="Sign in"
        meta="powerlevel is a single-scribe codex — only the admitted may enter"
      />
      <p className="body-prose">
        <Initial letter="P" />
        owerlevel is not a public app; it is a personal training codex. Sign in with
        your Google account to unseal the pages. If you aren&rsquo;t the scribe of this
        codex, no amount of credential will open it — this is by design.
      </p>

      <Ornament variant="diamond" />

      <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
        <LoginButton redirectTo={next ?? "/"} />
      </div>

      {error === "not-authorised" && (
        <div
          className="principle"
          style={{
            borderLeftColor: "var(--rubric)",
            background: "rgba(139,45,35,.05)",
            marginTop: 18,
          }}
        >
          <div className="principle-l">admission denied</div>
          <div className="principle-t">
            That Google account is not on this codex&rsquo;s allow-list. If it
            should be, edit <code>ALLOWED_EMAIL</code> in the server environment.
          </div>
        </div>
      )}
    </div>
  );
}
