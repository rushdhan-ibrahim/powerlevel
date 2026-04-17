/**
 * Category-aware set table.
 *
 * Different exercise categories have different relevant columns:
 * - weighted_reps:    # | weight | reps | rpe | note
 * - bodyweight_reps:  # | added  | reps | rpe | note
 * - timed_hold:       # | duration | added load | rpe | note
 * - carry:            # | weight | distance | duration | note
 * - distance_time:    # | distance | duration | note
 * - cardio_distance:  # | distance | duration | pace | note
 * - reps_only:        # | reps | note
 */

import { Rubric } from "@/components/manuscript/Rubric";

type Set = {
  id?: string;
  weight: number | null;
  weightUnit: string | null;
  reps: number | null;
  durationSec?: number | null;
  distanceM?: number | null;
  rpe: number | null;
  isWarmup: boolean;
  isFailure: boolean;
  notes: string | null;
};

export function SetTable({
  sets,
  category,
}: {
  sets: Set[];
  category: string | null | undefined;
}) {
  const cat = category ?? "weighted_reps";
  const cols = COLUMNS[cat] ?? COLUMNS.weighted_reps;

  return (
    <table className="set-table" style={{ marginTop: 12 }}>
      <thead>
        <tr>
          <th style={{ width: 24 }}>#</th>
          {cols.map((c) => (
            <th key={c.key} style={c.thStyle}>{c.label}</th>
          ))}
          <th>note</th>
        </tr>
      </thead>
      <tbody>
        {sets.map((s, i) => {
          const display = !s.isWarmup
            ? sets.filter((x, xi) => !x.isWarmup && xi <= i).length
            : null;
          return (
            <tr key={s.id ?? i} className={s.isWarmup ? "warmup" : ""}>
              <td className="col-num">{s.isWarmup ? "w" : display}</td>
              {cols.map((c) => (
                <td key={c.key} style={c.tdStyle}>
                  {c.render(s)}
                </td>
              ))}
              <td
                style={{
                  fontFamily: "var(--italic)",
                  fontStyle: "italic",
                  fontSize: ".72rem",
                  color: "var(--ash)",
                }}
              >
                {s.notes ?? ""}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ─── column definitions ────────────────────────────────────── */

type Col = {
  key: string;
  label: string;
  thStyle?: React.CSSProperties;
  tdStyle?: React.CSSProperties;
  render: (s: Set) => React.ReactNode;
};

const dash = "—";

function fmtWeight(s: Set): React.ReactNode {
  if (s.weight == null) return dash;
  const unit = s.weightUnit ?? "kg";
  if (unit === "bw") return "BW";
  return `${s.weight} ${unit}`;
}

function fmtAdded(s: Set): React.ReactNode {
  if (s.weight == null || s.weight === 0) return "BW";
  const unit = s.weightUnit ?? "kg";
  if (unit === "bw") return "BW";
  return `+${s.weight} ${unit}`;
}

function fmtDuration(s: Set): React.ReactNode {
  if (s.durationSec == null) return dash;
  const m = Math.floor(s.durationSec / 60);
  const sec = s.durationSec % 60;
  if (m === 0) return `${sec}s`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function fmtDistance(s: Set): React.ReactNode {
  if (s.distanceM == null) return dash;
  if (s.distanceM >= 1000) return `${(s.distanceM / 1000).toFixed(2)} km`;
  return `${Math.round(s.distanceM)} m`;
}

function fmtPace(s: Set): React.ReactNode {
  if (s.distanceM == null || s.durationSec == null || s.distanceM === 0) return dash;
  const km = s.distanceM / 1000;
  const minPerKm = (s.durationSec / 60) / km;
  const m = Math.floor(minPerKm);
  const sec = Math.round((minPerKm - m) * 60);
  return `${m}:${String(sec).padStart(2, "0")} /km`;
}

function fmtReps(s: Set): React.ReactNode {
  if (s.reps == null) return dash;
  if (s.isFailure) {
    return (
      <>
        {s.reps}
        <Rubric>
          <span style={{ marginLeft: 4 }}>F</span>
        </Rubric>
      </>
    );
  }
  return s.reps;
}

function fmtRpe(s: Set): React.ReactNode {
  return s.rpe ?? dash;
}

const COLUMNS: Record<string, Col[]> = {
  weighted_reps: [
    { key: "weight", label: "weight", render: fmtWeight },
    { key: "reps", label: "reps", render: fmtReps },
    { key: "rpe", label: "rpe", render: fmtRpe },
  ],
  bodyweight_reps: [
    { key: "weight", label: "added", render: fmtAdded },
    { key: "reps", label: "reps", render: fmtReps },
    { key: "rpe", label: "rpe", render: fmtRpe },
  ],
  timed_hold: [
    { key: "duration", label: "duration", render: fmtDuration },
    { key: "weight", label: "added", render: (s) => (s.weight ? fmtAdded(s) : "BW") },
    { key: "rpe", label: "rpe", render: fmtRpe },
  ],
  carry: [
    { key: "weight", label: "load", render: fmtWeight },
    { key: "distance", label: "distance", render: fmtDistance },
    { key: "duration", label: "time", render: fmtDuration },
  ],
  distance_time: [
    { key: "distance", label: "distance", render: fmtDistance },
    { key: "duration", label: "time", render: fmtDuration },
    { key: "rpe", label: "rpe", render: fmtRpe },
  ],
  cardio_distance: [
    { key: "distance", label: "distance", render: fmtDistance },
    { key: "duration", label: "time", render: fmtDuration },
    { key: "pace", label: "pace", render: fmtPace },
  ],
  reps_only: [
    { key: "reps", label: "reps", render: fmtReps },
    { key: "rpe", label: "rpe", render: fmtRpe },
  ],
};
