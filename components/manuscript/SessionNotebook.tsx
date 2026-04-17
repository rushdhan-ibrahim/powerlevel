/**
 * SESSION NOTEBOOK — a stack of cards showing session-level notes
 * extracted by Gemini. Each note has a kind (feeling, sleep, injury,
 * nutrition, general) which we render as a tiny rubric tag.
 *
 * Falls back gracefully to the legacy single-blob `Workout.notes`
 * when no structured notes are present.
 */

type SessionNote = {
  id?: string;
  body: string;
  kind?: string | null;
};

const KIND_LABEL: Record<string, string> = {
  feeling: "feeling",
  sleep: "sleep",
  injury: "injury",
  nutrition: "nutrition",
  general: "note",
};

export function SessionNotebook({
  notes,
  fallback,
}: {
  notes: SessionNote[];
  fallback?: string | null;
}) {
  const hasNotes = notes.length > 0;
  if (!hasNotes && !fallback) return null;

  return (
    <div className="plate" style={{ padding: 18, marginBottom: 14 }}>
      <span className="plate-n">notes</span>
      <span className="plate-t">session notebook</span>
      <div style={{ marginTop: 22 }}>
        {hasNotes ? (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {notes.map((n, i) => (
              <li
                key={n.id ?? i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 1fr",
                  gap: 14,
                  alignItems: "baseline",
                  padding: "10px 0",
                  borderBottom:
                    i < notes.length - 1 ? "1px solid var(--rule-soft)" : "none",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--display)",
                    fontVariant: "small-caps",
                    fontSize: ".55rem",
                    letterSpacing: ".14em",
                    color: "var(--rubric)",
                    textAlign: "right",
                  }}
                >
                  {KIND_LABEL[n.kind ?? "general"] ?? n.kind ?? "note"}
                </span>
                <span
                  style={{
                    fontFamily: "var(--italic)",
                    fontStyle: "italic",
                    fontSize: ".92rem",
                    color: "var(--ink-light)",
                    lineHeight: 1.55,
                  }}
                >
                  {n.body}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p
            style={{
              fontFamily: "var(--italic)",
              fontStyle: "italic",
              fontSize: ".92rem",
              color: "var(--ink-light)",
              lineHeight: 1.6,
            }}
          >
            {fallback}
          </p>
        )}
      </div>
    </div>
  );
}
