"use client";

import { WorkoutEditor } from "@/components/WorkoutEditor";
import { Ornament } from "@/components/manuscript/Ornament";
import type { ParsedWorkout } from "@/lib/schema";

export type ReviewItem = {
  id: string;
  status: "pending" | "parsing" | "ready" | "error" | "saved" | "cancelled" | "discarded";
  fileNames: string[];
  result?: {
    workout: ParsedWorkout;
    imagePaths: string[];
    meta?: { model?: string; tokensIn?: number; tokensOut?: number; pageCount?: number };
  };
  error?: string;
};

type Props = {
  items: ReviewItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onSaved: (queueId: string, savedWorkoutId: string) => void;
  onCancel: (queueId: string) => void;
  onDiscard: (queueId: string) => void;
};

export function ReviewQueue({ items, activeId, onSelect, onSaved, onCancel, onDiscard }: Props) {
  const active = items.find((it) => it.id === activeId);
  const totalCount = items.length;
  const savedCount = items.filter((i) => i.status === "saved").length;
  const allDone = items.every((i) => i.status === "saved" || i.status === "cancelled" || i.status === "error");

  return (
    <div>
      {/* QUEUE STRIP */}
      <div
        style={{
          display: "flex",
          gap: 0,
          padding: "14px 18px",
          background: "var(--paper-warm)",
          border: "1px solid var(--rule)",
          marginBottom: 18,
          alignItems: "stretch",
          overflowX: "auto",
        }}
      >
        {items.map((it, i) => {
          const isActive = it.id === activeId;
          const colorByStatus =
            it.status === "saved"
              ? "var(--ash)"
              : it.status === "ready"
                ? "var(--ink)"
                : it.status === "parsing"
                  ? "var(--rubric)"
                  : it.status === "error"
                    ? "var(--rubric)"
                    : it.status === "cancelled" || it.status === "discarded"
                      ? "var(--ash-light)"
                      : "var(--ash-light)";
          return (
            <button
              type="button"
              key={it.id}
              onClick={() => onSelect(it.id)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "0 14px",
                textAlign: "left",
                borderBottom: isActive ? "2px solid var(--rubric)" : "2px solid transparent",
                opacity: it.status === "saved" || it.status === "cancelled" || it.status === "discarded" ? 0.55 : 1,
                position: "relative",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--display)",
                  fontVariant: "small-caps",
                  fontSize: ".62rem",
                  fontWeight: 500,
                  letterSpacing: ".14em",
                  color: "var(--ink-light)",
                }}
              >
                workout {i + 1}
              </div>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: ".74rem",
                  color: colorByStatus,
                  marginTop: 2,
                  fontVariantNumeric: "oldstyle-nums",
                }}
              >
                {STATUS_GLYPH[it.status]} {STATUS_LABEL[it.status]}
              </div>
              <div
                style={{
                  fontFamily: "var(--italic)",
                  fontStyle: "italic",
                  fontSize: ".74rem",
                  color: "var(--ash-light)",
                  marginTop: 2,
                }}
              >
                {it.fileNames.length} page{it.fileNames.length === 1 ? "" : "s"}
              </div>
              {(it.status === "parsing" || it.status === "pending") && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel(it.id);
                  }}
                  title="cancel parsing this workout"
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 4,
                    background: "transparent",
                    border: "none",
                    color: "var(--ash)",
                    cursor: "pointer",
                    fontSize: ".8rem",
                    lineHeight: 1,
                    padding: 2,
                  }}
                  onMouseEnter={(ev) => (ev.currentTarget.style.color = "var(--rubric)")}
                  onMouseLeave={(ev) => (ev.currentTarget.style.color = "var(--ash)")}
                >
                  ×
                </button>
              )}
            </button>
          );
        })}

        {/* progress summary */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingLeft: 22,
            borderLeft: "1px solid var(--rule)",
            fontFamily: "var(--mono)",
            fontSize: ".68rem",
            color: "var(--ash)",
            letterSpacing: ".05em",
          }}
        >
          <span style={{ fontVariantNumeric: "oldstyle-nums" }}>
            <span style={{ color: "var(--rubric)" }}>{savedCount}</span> / {totalCount} saved
          </span>
          {allDone && (
            <span
              style={{
                fontFamily: "var(--italic)",
                fontStyle: "italic",
                color: "var(--rubric)",
                marginTop: 3,
              }}
            >
              all done
            </span>
          )}
        </div>
      </div>

      {/* ACTIVE PANEL */}
      {!active && (
        <div className="marginalia" style={{ textAlign: "center", padding: "60px 0" }}>
          select a workout above to review
        </div>
      )}

      {active && active.status === "pending" && (
        <div className="marginalia" style={{ textAlign: "center", padding: "60px 0" }}>
          waiting for the parser to begin&hellip;
          <div style={{ marginTop: 10 }}>
            <button
              type="button"
              onClick={() => onCancel(active.id)}
              className="btn btn-ghost"
            >
              cancel this workout
            </button>
          </div>
        </div>
      )}

      {active && active.status === "parsing" && (
        <div className="marginalia" style={{ textAlign: "center", padding: "60px 0" }}>
          gemini is reading this workout&hellip;
          <div style={{ marginTop: 10 }}>
            <button
              type="button"
              onClick={() => onCancel(active.id)}
              className="btn btn-ghost"
            >
              cancel this workout
            </button>
          </div>
        </div>
      )}

      {active && active.status === "cancelled" && (
        <div className="marginalia" style={{ textAlign: "center", padding: "60px 0" }}>
          this workout was cancelled — pick another above
        </div>
      )}

      {active && active.status === "error" && (
        <div
          className="principle"
          style={{
            borderLeftColor: "var(--rubric)",
            background: "rgba(139,45,35,.05)",
          }}
        >
          <div className="principle-l">parse failed</div>
          <div className="principle-t">{active.error}</div>
        </div>
      )}

      {active && active.status === "saved" && (
        <div className="marginalia" style={{ textAlign: "center", padding: "60px 0" }}>
          saved to your log &middot; pick the next workout above
        </div>
      )}

      {active && active.status === "ready" && active.result && (
        <>
          <Ornament variant="diamond" />
          {/* key={active.id} forces a fresh mount of the editor every time
              the user switches between queue items, so the editor's local
              state doesn't carry over from one workout to the next */}
          <WorkoutEditor
            key={active.id}
            initial={active.result.workout}
            imagePaths={active.result.imagePaths}
            meta={active.result.meta}
            onSaved={(savedWorkoutId) => onSaved(active.id, savedWorkoutId)}
            onDiscard={() => onDiscard(active.id)}
          />
        </>
      )}

      {active && active.status === "discarded" && (
        <div className="marginalia" style={{ textAlign: "center", padding: "60px 0" }}>
          this workout was discarded — pick another above
        </div>
      )}
    </div>
  );
}

const STATUS_LABEL: Record<ReviewItem["status"], string> = {
  pending: "queued",
  parsing: "parsing",
  ready: "ready to review",
  error: "error",
  saved: "saved",
  cancelled: "cancelled",
  discarded: "discarded",
};

const STATUS_GLYPH: Record<ReviewItem["status"], string> = {
  pending: "○",
  parsing: "◐",
  ready: "●",
  error: "◆",
  saved: "✓",
  cancelled: "✕",
  discarded: "—",
};
