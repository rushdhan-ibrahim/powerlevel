"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ParsedWorkout, ParsedExercise, ParsedSet } from "@/lib/schema";
import { Headpiece } from "@/components/manuscript/Headpiece";
import { Ornament } from "@/components/manuscript/Ornament";

type Props = {
  initial: ParsedWorkout;
  imagePaths: string[];
  meta?: { model?: string; tokensIn?: number; tokensOut?: number; pageCount?: number };
  /** Optional callback fired after a successful save with the new workout's id.
   * When provided, the editor does NOT navigate away — the caller decides what
   * to do (e.g., advance to the next item in a review queue). When omitted, the
   * editor navigates to the saved workout's detail page. */
  onSaved?: (id: string) => void;
  /** Optional discard callback. When provided, a "discard" button appears next
   * to "save workout" — used in the bulk review flow to skip a workout without
   * saving it. */
  onDiscard?: () => void;
  /** When provided, the editor PATCHes this workout id rather than POSTing a
   * new one. Used for editing an already-saved workout. */
  editingId?: string;
};

export function WorkoutEditor({ initial, imagePaths, meta, onSaved, onDiscard, editingId }: Props) {
  const router = useRouter();
  const [workout, setWorkout] = useState<ParsedWorkout>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateExercise = (i: number, patch: Partial<ParsedExercise>) =>
    setWorkout((w) => ({
      ...w,
      exercises: w.exercises.map((ex, idx) => (idx === i ? { ...ex, ...patch } : ex)),
    }));

  const updateSet = (exI: number, setI: number, patch: Partial<ParsedSet>) =>
    setWorkout((w) => ({
      ...w,
      exercises: w.exercises.map((ex, ei) =>
        ei === exI
          ? { ...ex, sets: ex.sets.map((s, si) => (si === setI ? { ...s, ...patch } : s)) }
          : ex,
      ),
    }));

  const removeExercise = (i: number) =>
    setWorkout((w) => ({ ...w, exercises: w.exercises.filter((_, idx) => idx !== i) }));

  const removeSet = (exI: number, setI: number) =>
    setWorkout((w) => ({
      ...w,
      exercises: w.exercises.map((ex, ei) =>
        ei === exI ? { ...ex, sets: ex.sets.filter((_, si) => si !== setI) } : ex,
      ),
    }));

  const addExercise = () =>
    setWorkout((w) => ({
      ...w,
      exercises: [
        ...w.exercises,
        {
          name: "",
          normalizedName: "",
          canonicalSlug: null,
          category: "weighted_reps",
          pattern: null,
          variation: null,
          muscleGroup: "other",
          notes: null,
          sets: [
            {
              weight: null,
              weightUnit: "kg",
              reps: null,
              durationSec: null,
              distanceM: null,
              rpe: null,
              isWarmup: false,
              isFailure: false,
              notes: null,
            },
          ],
        },
      ],
    }));

  const addSet = (exI: number) =>
    setWorkout((w) => ({
      ...w,
      exercises: w.exercises.map((ex, ei) =>
        ei === exI
          ? {
              ...ex,
              sets: [
                ...ex.sets,
                {
                  weight: null,
                  weightUnit: "kg",
                  reps: null,
                  durationSec: null,
                  distanceM: null,
                  rpe: null,
                  isWarmup: false,
                  isFailure: false,
                  notes: null,
                },
              ],
            }
          : ex,
      ),
    }));

  const updateSessionNote = (i: number, body: string) =>
    setWorkout((w) => ({
      ...w,
      sessionNotes: w.sessionNotes.map((n, idx) => (idx === i ? { ...n, body } : n)),
    }));

  const updateSessionNoteKind = (i: number, kind: string) =>
    setWorkout((w) => ({
      ...w,
      sessionNotes: w.sessionNotes.map((n, idx) =>
        idx === i ? { ...n, kind: kind as typeof n.kind } : n,
      ),
    }));

  const addSessionNote = () =>
    setWorkout((w) => ({
      ...w,
      sessionNotes: [...w.sessionNotes, { body: "", kind: "general" }],
    }));

  const removeSessionNote = (i: number) =>
    setWorkout((w) => ({ ...w, sessionNotes: w.sessionNotes.filter((_, idx) => idx !== i) }));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const url = editingId ? `/api/workouts/${editingId}` : "/api/workouts";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workout, imagePaths, imagePath: imagePaths[0] ?? null, meta }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save");
      }
      const { id } = await res.json();
      // Reset the saving flag immediately so the button stops spinning even
      // if the soft navigation that follows takes a moment to render the
      // destination route. Without this, the form sat on "saving…" until
      // the new page was fully ready.
      setSaving(false);
      if (onSaved) {
        onSaved(id);
        // do NOT navigate; the parent decides what's next (e.g. queue advance)
      } else {
        // refresh first so the destination route fetches the new data
        // (Server Components cache the prior response otherwise).
        router.refresh();
        router.push(`/workouts/${id ?? editingId}`);
      }
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  const hasImages = imagePaths.length > 0;

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: hasImages
            ? "minmax(0, 1fr) minmax(0, 1.1fr)"
            : "minmax(0, 1fr)",
          gap: 32,
        }}
      >
        {/* FACSIMILE COLUMN — only when there's a source image */}
        {hasImages && (
          <div>
            <div className="plate" style={{ padding: 14, position: "sticky", top: 16 }}>
              <span className="plate-n">{imagePaths.length > 1 ? `${imagePaths.length} pp.` : "src."}</span>
              <span className="plate-t">{imagePaths.length > 1 ? "source pages" : "source page"}</span>
              <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 12 }}>
                {imagePaths.map((p, i) => (
                  <div key={i} className="facsimile" style={{ width: "100%" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/${p}`} alt={`Source page ${i + 1}`} />
                  </div>
                ))}
              </div>
              <div className="facsimile-caption">read by gemini-3.1-pro · thinking on</div>
            </div>

            {workout.warnings.length > 0 && (
              <div className="principle" style={{ marginTop: 20 }}>
                <div className="principle-l">
                  parser flagged · {workout.confidence} confidence
                </div>
                <ul
                  style={{
                    marginTop: 6,
                    paddingLeft: 18,
                    listStyle: "circle",
                    fontFamily: "var(--italic)",
                    fontStyle: "italic",
                    fontSize: ".84rem",
                    color: "var(--ink-light)",
                    lineHeight: 1.55,
                  }}
                >
                  {workout.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* CATALOG COLUMN */}
        <div>
          <div className="plate" style={{ padding: 18 }}>
            <span className="plate-n">meta</span>
            <span className="plate-t">workout details</span>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
                marginTop: 22,
              }}
            >
              <Field label="date">
                <input
                  type="date"
                  value={workout.date}
                  onChange={(e) => setWorkout({ ...workout, date: e.target.value })}
                  className="input numerals"
                />
              </Field>
              <Field label="session">
                <input
                  value={workout.title ?? ""}
                  onChange={(e) =>
                    setWorkout({ ...workout, title: e.target.value || null })
                  }
                  placeholder="—"
                  className="input"
                />
              </Field>
              <Field label="bodyweight (kg)">
                <input
                  type="number"
                  step="0.1"
                  value={workout.bodyweight ?? ""}
                  onChange={(e) =>
                    setWorkout({
                      ...workout,
                      bodyweight: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  placeholder="—"
                  className="input numerals"
                />
              </Field>
              <Field label="duration · min">
                <input
                  type="number"
                  value={workout.durationMin ?? ""}
                  onChange={(e) =>
                    setWorkout({
                      ...workout,
                      durationMin: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  placeholder="—"
                  className="input numerals"
                />
              </Field>
            </div>
          </div>

          {/* SESSION NOTES — always shown, with empty state and add button */}
          <div className="plate" style={{ padding: 18, marginTop: 14 }}>
            <span className="plate-n">notes</span>
            <span className="plate-t">session notebook</span>
            <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
              {workout.sessionNotes.length === 0 && (
                <div
                  style={{
                    fontFamily: "var(--italic)",
                    fontStyle: "italic",
                    fontSize: ".88rem",
                    color: "var(--ash)",
                    padding: "8px 0",
                  }}
                >
                  no session-level notes were extracted. add one below if you'd like.
                </div>
              )}
              {workout.sessionNotes.map((n, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "100px 1fr 24px",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <select
                    value={n.kind ?? "general"}
                    onChange={(e) => updateSessionNoteKind(i, e.target.value)}
                    className="input"
                    style={{
                      fontFamily: "var(--display)",
                      fontVariant: "small-caps",
                      fontSize: ".68rem",
                      letterSpacing: ".12em",
                      color: "var(--rubric)",
                      padding: "5px 8px",
                    }}
                  >
                    <option value="general">general</option>
                    <option value="feeling">feeling</option>
                    <option value="sleep">sleep</option>
                    <option value="injury">injury</option>
                    <option value="nutrition">nutrition</option>
                  </select>
                  <input
                    value={n.body}
                    onChange={(e) => updateSessionNote(i, e.target.value)}
                    className="input"
                    placeholder="—"
                    style={{
                      fontFamily: "var(--italic)",
                      fontStyle: "italic",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeSessionNote(i)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--ash-light)",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--rubric)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ash-light)")}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addSessionNote}
                style={{
                  display: "block",
                  marginTop: 4,
                  width: "100%",
                  padding: "7px 0",
                  fontFamily: "var(--display)",
                  fontVariant: "small-caps",
                  fontSize: ".62rem",
                  letterSpacing: ".14em",
                  color: "var(--ash)",
                  background: "transparent",
                  border: "1px dashed var(--rule)",
                  cursor: "pointer",
                  transition: "color .15s, border-color .15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--ink)";
                  e.currentTarget.style.borderColor = "var(--ink)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--ash)";
                  e.currentTarget.style.borderColor = "var(--rule)";
                }}
              >
                + add a session note
              </button>
            </div>
          </div>

          <Ornament variant="hollow" />

          {workout.exercises.map((ex, i) => (
            <ExerciseEditor
              key={i}
              i={i}
              exercise={ex}
              onUpdate={(patch) => updateExercise(i, patch)}
              onRemove={() => removeExercise(i)}
              onAddSet={() => addSet(i)}
              onUpdateSet={(setI, patch) => updateSet(i, setI, patch)}
              onRemoveSet={(setI) => removeSet(i, setI)}
            />
          ))}

          <button
            type="button"
            onClick={addExercise}
            style={{
              display: "block",
              marginTop: 14,
              width: "100%",
              padding: "12px 0",
              fontFamily: "var(--display)",
              fontVariant: "small-caps",
              fontSize: ".7rem",
              letterSpacing: ".16em",
              color: "var(--ash)",
              background: "transparent",
              border: "1px dashed var(--rule)",
              cursor: "pointer",
              transition: "color .15s, border-color .15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--rubric)";
              e.currentTarget.style.borderColor = "var(--rubric)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--ash)";
              e.currentTarget.style.borderColor = "var(--rule)";
            }}
          >
            + add an exercise
          </button>
        </div>
      </div>

      {error && (
        <div
          className="principle"
          style={{
            borderLeftColor: "var(--rubric)",
            background: "rgba(139,45,35,.05)",
            marginTop: 18,
          }}
        >
          <div className="principle-l">save failed</div>
          <div className="principle-t">{error}</div>
        </div>
      )}

      <Headpiece />

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
          padding: "14px 0",
          borderTop: "1px solid var(--rule-soft)",
          position: "sticky",
          bottom: 0,
          background: "linear-gradient(to top, var(--paper) 80%, transparent)",
        }}
      >
        <div className="marginalia">
          {workout.exercises.length} exercises ·{" "}
          <span className="numerals">
            {workout.exercises.reduce((n, e) => n + e.sets.length, 0)}
          </span>{" "}
          sets · ready to save
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          {onDiscard && (
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "Discard this workout? It won't be saved to your log.",
                  )
                ) {
                  onDiscard();
                }
              }}
              disabled={saving}
              className="btn btn-ghost"
            >
              discard
            </button>
          )}
          <button onClick={save} disabled={saving} className="btn btn-rubric btn-quill">
            {saving ? "saving…" : "save workout"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span className="input-label">{label}</span>
      {children}
    </label>
  );
}

/* ─── per-exercise editor ───────────────────────────────────── */

type ExerciseEditorProps = {
  i: number;
  exercise: ParsedExercise;
  onUpdate: (patch: Partial<ParsedExercise>) => void;
  onRemove: () => void;
  onAddSet: () => void;
  onUpdateSet: (setI: number, patch: Partial<ParsedSet>) => void;
  onRemoveSet: (setI: number) => void;
};

function ExerciseEditor({
  i,
  exercise: ex,
  onUpdate,
  onRemove,
  onAddSet,
  onUpdateSet,
  onRemoveSet,
}: ExerciseEditorProps) {
  const cat = ex.category;
  return (
    <div className="plate" style={{ padding: 18, marginBottom: 14 }}>
      <span className="plate-n">{(i + 1).toString().padStart(2, "0")}</span>
      <span className="plate-t">{ex.muscleGroup}</span>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginTop: 18,
          gap: 8,
        }}
      >
        <input
          value={ex.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          style={{
            background: "transparent",
            border: "none",
            fontFamily: "var(--serif)",
            fontSize: "1rem",
            fontWeight: 500,
            color: "var(--ink)",
            flex: 1,
            outline: "none",
            padding: "2px 0",
            borderBottom: "1px solid transparent",
          }}
          onFocus={(e) => (e.target.style.borderBottom = "1px solid var(--rule)")}
          onBlur={(e) => (e.target.style.borderBottom = "1px solid transparent")}
        />
        <button
          type="button"
          onClick={onRemove}
          style={{
            fontFamily: "var(--display)",
            fontVariant: "small-caps",
            fontSize: ".5rem",
            letterSpacing: ".14em",
            color: "var(--ash)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 4,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--rubric)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ash)")}
        >
          remove
        </button>
      </div>

      {(ex.canonicalSlug || ex.variation || cat) && (
        <div
          style={{
            marginTop: 4,
            display: "flex",
            gap: 12,
            alignItems: "baseline",
            fontFamily: "var(--italic)",
            fontStyle: "italic",
            fontSize: ".72rem",
            color: "var(--ash)",
          }}
        >
          {cat && <span style={{ fontFamily: "var(--mono)", fontStyle: "normal", color: "var(--ash-light)" }}>{cat.replace(/_/g, " ")}</span>}
          {ex.variation && <span style={{ color: "var(--rubric)" }}>— {ex.variation}</span>}
        </div>
      )}

      <table className="set-table" style={{ marginTop: 10 }}>
        <thead>
          <tr>
            <th style={{ width: 24 }}>#</th>
            {COLUMN_LABELS[cat ?? "weighted_reps"].map((l) => (
              <th key={l}>{l}</th>
            ))}
            <th>note</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {ex.sets.map((s, j) => {
            const display = !s.isWarmup
              ? ex.sets.filter((x, xi) => !x.isWarmup && xi <= j).length
              : null;
            return (
              <tr key={j} className={s.isWarmup ? "warmup" : ""}>
                <td className="col-num">{s.isWarmup ? "w" : display}</td>
                <SetEditCells
                  set={s}
                  category={cat ?? "weighted_reps"}
                  onChange={(patch) => onUpdateSet(j, patch)}
                />
                <td>
                  <input
                    type="text"
                    value={s.notes ?? ""}
                    onChange={(e) => onUpdateSet(j, { notes: e.target.value || null })}
                    placeholder="—"
                    style={{
                      background: "transparent",
                      border: "none",
                      fontFamily: "var(--italic)",
                      fontStyle: "italic",
                      fontSize: ".74rem",
                      color: "var(--ash)",
                      padding: "1px 2px",
                      width: "100%",
                      borderBottom: "1px solid transparent",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderBottom = "1px solid var(--rule)")}
                    onBlur={(e) => (e.target.style.borderBottom = "1px solid transparent")}
                  />
                </td>
                <td style={{ width: 12, textAlign: "right" }}>
                  <button
                    type="button"
                    onClick={() => onRemoveSet(j)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--ash-light)",
                      cursor: "pointer",
                      fontSize: 11,
                      padding: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--rubric)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ash-light)")}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* exercise-level note line */}
      <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 8 }}>
        <span
          style={{
            fontFamily: "var(--display)",
            fontVariant: "small-caps",
            fontSize: ".58rem",
            letterSpacing: ".14em",
            color: "var(--ash)",
            flexShrink: 0,
          }}
        >
          exercise note
        </span>
        <input
          type="text"
          value={ex.notes ?? ""}
          onChange={(e) => onUpdate({ notes: e.target.value || null })}
          placeholder={ex.notes === null ? "tempo, form cue, equipment, etc." : "—"}
          style={{
            background: "transparent",
            border: "none",
            fontFamily: "var(--italic)",
            fontStyle: "italic",
            fontSize: ".82rem",
            color: ex.notes ? "var(--ink-light)" : "var(--ash-light)",
            padding: "2px 0",
            flex: 1,
            borderBottom: "1px solid var(--rule-soft)",
            outline: "none",
          }}
          onFocus={(e) => (e.target.style.borderBottom = "1px solid var(--rule)")}
          onBlur={(e) => (e.target.style.borderBottom = "1px solid var(--rule-soft)")}
        />
      </div>

      <button
        type="button"
        onClick={onAddSet}
        style={{
          display: "block",
          marginTop: 8,
          width: "100%",
          padding: "5px 0",
          fontFamily: "var(--display)",
          fontVariant: "small-caps",
          fontSize: ".55rem",
          letterSpacing: ".14em",
          color: "var(--ash)",
          background: "transparent",
          border: "1px dashed var(--rule)",
          cursor: "pointer",
          transition: "color .15s, border-color .15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--ink)";
          e.currentTarget.style.borderColor = "var(--ink)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--ash)";
          e.currentTarget.style.borderColor = "var(--rule)";
        }}
      >
        + record another set
      </button>
    </div>
  );
}

const COLUMN_LABELS: Record<string, string[]> = {
  weighted_reps: ["weight", "reps", "rpe"],
  bodyweight_reps: ["added", "reps", "rpe"],
  timed_hold: ["duration", "added", "rpe"],
  carry: ["load", "distance", "time"],
  distance_time: ["distance", "time", "rpe"],
  cardio_distance: ["distance", "time", "pace"],
  reps_only: ["reps", "rpe", ""],
};

/* ─── per-set inputs (category-aware) ───────────────────────── */

function SetEditCells({
  set,
  category,
  onChange,
}: {
  set: ParsedSet;
  category: string;
  onChange: (patch: Partial<ParsedSet>) => void;
}) {
  switch (category) {
    case "bodyweight_reps":
      return (
        <>
          <td>
            <NumCell
              value={set.weight}
              onChange={(v) => onChange({ weight: v })}
              suffix={set.weightUnit === "lb" ? "lb" : "kg"}
              placeholder="bw"
              step="0.5"
            />
          </td>
          <td>
            <NumCell value={set.reps} onChange={(v) => onChange({ reps: v ? Math.round(v) : null })} />
          </td>
          <td>
            <NumCell value={set.rpe} onChange={(v) => onChange({ rpe: v })} step="0.5" />
          </td>
        </>
      );
    case "timed_hold":
      return (
        <>
          <td>
            <DurCell
              value={set.durationSec ?? null}
              onChange={(v) => onChange({ durationSec: v })}
            />
          </td>
          <td>
            <NumCell
              value={set.weight}
              onChange={(v) => onChange({ weight: v })}
              suffix={set.weightUnit === "lb" ? "lb" : "kg"}
              placeholder="bw"
              step="0.5"
            />
          </td>
          <td>
            <NumCell value={set.rpe} onChange={(v) => onChange({ rpe: v })} step="0.5" />
          </td>
        </>
      );
    case "carry":
      return (
        <>
          <td>
            <NumCell
              value={set.weight}
              onChange={(v) => onChange({ weight: v })}
              suffix={set.weightUnit === "lb" ? "lb" : "kg"}
              step="0.5"
            />
          </td>
          <td>
            <NumCell
              value={set.distanceM}
              onChange={(v) => onChange({ distanceM: v })}
              suffix="m"
              step="1"
            />
          </td>
          <td>
            <DurCell
              value={set.durationSec ?? null}
              onChange={(v) => onChange({ durationSec: v })}
            />
          </td>
        </>
      );
    case "distance_time":
      return (
        <>
          <td>
            <NumCell
              value={set.distanceM}
              onChange={(v) => onChange({ distanceM: v })}
              suffix="m"
              step="1"
            />
          </td>
          <td>
            <DurCell
              value={set.durationSec ?? null}
              onChange={(v) => onChange({ durationSec: v })}
            />
          </td>
          <td>
            <NumCell value={set.rpe} onChange={(v) => onChange({ rpe: v })} step="0.5" />
          </td>
        </>
      );
    case "cardio_distance":
      return (
        <>
          <td>
            <NumCell
              value={set.distanceM}
              onChange={(v) => onChange({ distanceM: v })}
              suffix="m"
              step="1"
            />
          </td>
          <td>
            <DurCell
              value={set.durationSec ?? null}
              onChange={(v) => onChange({ durationSec: v })}
            />
          </td>
          <td>{paceLabel(set.distanceM, set.durationSec)}</td>
        </>
      );
    case "reps_only":
      return (
        <>
          <td>
            <NumCell value={set.reps} onChange={(v) => onChange({ reps: v ? Math.round(v) : null })} />
          </td>
          <td>
            <NumCell value={set.rpe} onChange={(v) => onChange({ rpe: v })} step="0.5" />
          </td>
          <td></td>
        </>
      );
    default:
      // weighted_reps
      return (
        <>
          <td>
            <NumCell
              value={set.weight}
              onChange={(v) => onChange({ weight: v })}
              suffix={set.weightUnit === "lb" ? "lb" : "kg"}
              step="0.5"
            />
          </td>
          <td>
            <NumCell value={set.reps} onChange={(v) => onChange({ reps: v ? Math.round(v) : null })} />
          </td>
          <td>
            <NumCell value={set.rpe} onChange={(v) => onChange({ rpe: v })} step="0.5" />
          </td>
        </>
      );
  }
}

function NumCell({
  value,
  onChange,
  suffix,
  placeholder,
  step,
}: {
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  suffix?: string;
  placeholder?: string;
  step?: string;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
      <input
        type="number"
        step={step}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        placeholder={placeholder}
        style={{
          background: "transparent",
          border: "none",
          fontFamily: "var(--mono)",
          fontVariantNumeric: "oldstyle-nums tabular-nums",
          fontSize: "inherit",
          color: "inherit",
          width: 64,
          padding: "1px 2px",
          borderBottom: "1px solid transparent",
          outline: "none",
        }}
        onFocus={(e) => (e.target.style.borderBottom = "1px solid var(--rule)")}
        onBlur={(e) => (e.target.style.borderBottom = "1px solid transparent")}
      />
      {suffix && (
        <span
          style={{
            fontFamily: "var(--italic)",
            fontStyle: "italic",
            fontSize: ".68rem",
            color: "var(--ash-light)",
          }}
        >
          {suffix}
        </span>
      )}
    </span>
  );
}

/** mm:ss editor */
function DurCell({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const display = (() => {
    if (value == null) return "";
    const m = Math.floor(value / 60);
    const s = value % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  })();
  return (
    <input
      type="text"
      value={display}
      onChange={(e) => {
        const v = e.target.value.trim();
        if (v === "") return onChange(null);
        const m = v.match(/^(\d+):(\d{1,2})$/);
        if (m) {
          onChange(Number(m[1]) * 60 + Number(m[2]));
          return;
        }
        const justSec = Number(v);
        if (!isNaN(justSec)) onChange(Math.round(justSec));
      }}
      placeholder="0:00"
      style={{
        background: "transparent",
        border: "none",
        fontFamily: "var(--mono)",
        fontVariantNumeric: "oldstyle-nums tabular-nums",
        fontSize: "inherit",
        color: "inherit",
        width: 64,
        padding: "1px 2px",
        borderBottom: "1px solid transparent",
        outline: "none",
      }}
      onFocus={(e) => (e.target.style.borderBottom = "1px solid var(--rule)")}
      onBlur={(e) => (e.target.style.borderBottom = "1px solid transparent")}
    />
  );
}

function paceLabel(distanceM: number | null | undefined, durationSec: number | null | undefined) {
  if (!distanceM || !durationSec) return "—";
  const km = distanceM / 1000;
  if (km <= 0) return "—";
  const minPerKm = (durationSec / 60) / km;
  const m = Math.floor(minPerKm);
  const sec = Math.round((minPerKm - m) * 60);
  return (
    <span style={{ fontFamily: "var(--mono)" }}>
      {m}:{String(sec).padStart(2, "0")} <span style={{ fontStyle: "italic", color: "var(--ash)" }}>/km</span>
    </span>
  );
}
