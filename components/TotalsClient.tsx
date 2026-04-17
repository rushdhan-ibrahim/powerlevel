"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import type { WorkoutRow } from "@/lib/insights";
import {
  HEAVY_THRESHOLDS,
  dailyTonnage,
  exerciseTotalsInPeriod,
  inPeriod,
  periodTotals,
  presetPeriod,
  type Period,
  type ExerciseTotals,
} from "@/lib/totals";
import { Headpiece } from "@/components/manuscript/Headpiece";
import { Ornament } from "@/components/manuscript/Ornament";
import { Initial } from "@/components/manuscript/Initial";
import { ChapterOpener } from "@/components/manuscript/ChapterOpener";
import { PageIncipit } from "@/components/manuscript/PageIncipit";
import { Plate } from "@/components/manuscript/Plate";
import { Rubric } from "@/components/manuscript/Rubric";
import { ColophonSeal } from "@/components/manuscript/Seal";
import { PeriodBrush } from "@/components/manuscript/PeriodBrush";
import { RepCounter } from "@/components/RepCounter";
import { liftKey, toKg } from "@/lib/insights";

type SerialisedWorkout = Omit<WorkoutRow, "date"> & { date: string };

type Props = {
  workouts: SerialisedWorkout[];
  todayIso: string;
};

export function TotalsClient({ workouts: raw, todayIso }: Props) {
  const workouts = useMemo<WorkoutRow[]>(
    () => raw.map((w) => ({ ...w, date: new Date(w.date) })),
    [raw],
  );

  // "today" is frozen at SSR time so that server- and client-rendered SVG
  // attribute strings match exactly (otherwise React reports a hydration
  // mismatch on every reload).
  const today = useMemo(() => new Date(todayIso), [todayIso]);
  const firstWorkoutDate = workouts[0]?.date ?? today;
  const minSpanDays = 90;
  const minStart = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - minSpanDays);
    return d;
  }, [today]);
  const earliest = firstWorkoutDate < minStart ? firstWorkoutDate : minStart;
  const latest = today;

  const [period, setPeriod] = useState<Period>(() => {
    // 90d preset bound to the frozen `today`
    const start = new Date(today);
    start.setDate(start.getDate() - 89);
    return { start, end: today };
  });

  const selected = useMemo(() => inPeriod(workouts, period), [workouts, period]);
  const totals = useMemo(() => periodTotals(selected), [selected]);
  const exTotals = useMemo(() => exerciseTotalsInPeriod(workouts, period), [workouts, period]);

  // ─── data for the Rep Counter section ────────────────────────
  // Walk every exercise across all history, group by liftKey, find the
  // heaviest single rep ever performed (true max).
  const repCounterLifts = useMemo(() => {
    const map = new Map<string, { label: string; trueMax: number }>();
    for (const w of workouts) {
      for (const ex of w.exercises) {
        const key = liftKey(ex);
        const cur = map.get(key) ?? { label: ex.name, trueMax: 0 };
        for (const s of ex.sets) {
          if (s.isWarmup || s.weight == null) continue;
          const wkg = toKg(s.weight, s.weightUnit);
          if (wkg > cur.trueMax) cur.trueMax = wkg;
        }
        cur.label = ex.name;
        map.set(key, cur);
      }
    }
    return Array.from(map.entries())
      .map(([key, v]) => ({
        key,
        label: v.label,
        found: v.trueMax > 0,
        trueMax: v.trueMax,
      }))
      .sort((a, b) => b.trueMax - a.trueMax)
      .slice(0, 10);
  }, [workouts]);

  // For the brush, we need ALL daily marks across the full history range.
  const allMarks = useMemo(() => dailyTonnage(workouts), [workouts]);

  return (
    <div>
      <PageIncipit
        eyebrow="The Counter's View"
        title="Totals"
        meta="lifetime and selected periods · drag the chain to change the range"
      />

      <p className="body-prose">
        <Initial letter="P" />
        ick a period at the top &mdash; a chip for a quick range, or drag the chain
        below to set anything custom &mdash; and every total updates: tonnage, reps,
        sessions. Each lift breaks down further: total reps, total tonnage, and
        heavy-work counts at <Rubric>50%, 70%, 80%, 90%, 95%</Rubric> of your true
        all-time max for that lift.
      </p>

      <Ornament variant="hollow" />

      {/* PERIOD PICKER */}
      <div
        style={{
          padding: "20px 22px",
          background: "var(--paper-warm)",
          border: "1px solid var(--rule)",
          marginBottom: 24,
        }}
      >
        <PeriodBrush
          marks={allMarks}
          earliest={earliest}
          latest={latest}
          value={period}
          onChange={setPeriod}
        />
      </div>

      {/* HERO TOTALS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 1,
          background: "var(--rule)",
          border: "1px solid var(--rule)",
          marginBottom: 28,
        }}
      >
        <Big
          label="tonnage"
          value={totals.tonnage.toLocaleString()}
          unit="kg"
          sub={`across ${totals.workingSets} sets`}
        />
        <Big
          label="working reps"
          value={totals.totalReps.toLocaleString()}
          unit="reps"
        />
        <Big
          label="sessions"
          value={String(totals.sessions)}
          unit={totals.sessions === 1 ? "workout" : "workouts"}
        />
        <Big
          label="period"
          value={periodSpanLabel(period)}
          sub={`${format(period.start, "MMM d, yyyy")} – ${format(period.end, "MMM d, yyyy")}`}
        />
      </div>

      <Ornament variant="diamond" />

      {/* PER-EXERCISE TOTALS + HEAVY WORK */}
      <ChapterOpener n="i" title="By lift" caption="reps · tonnage · heavy work at thresholds of true max" glyph="rose" />
      <p className="body-prose">
        Every lift you touched in the period, ranked by tonnage. <em>True max</em> is the
        heaviest single rep ever performed (across all time, not just the period). The
        heavy-work columns count working reps in the period at or above each fraction of
        that true max &mdash; this is your real grit metric, the time spent in the heavy
        zones.
      </p>

      <div className="plate" style={{ padding: 18 }}>
        <span className="plate-n">i</span>
        <span className="plate-t">Per-lift totals · heavy work bands</span>
        <table className="set-table" style={{ marginTop: 22 }}>
          <thead>
            <tr>
              <th style={{ width: 36 }}>n</th>
              <th>lift</th>
              <th style={{ textAlign: "right" }}>sessions</th>
              <th style={{ textAlign: "right" }}>reps</th>
              <th style={{ textAlign: "right" }}>tonnage</th>
              <th style={{ textAlign: "right" }}>true max</th>
              {HEAVY_THRESHOLDS.map((t) => (
                <th key={t} style={{ textAlign: "right" }}>
                  ≥{Math.round(t * 100)}%
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exTotals.length === 0 ? (
              <tr>
                <td
                  colSpan={6 + HEAVY_THRESHOLDS.length}
                  style={{ textAlign: "center", padding: "20px 0", color: "var(--ash)" }}
                >
                  no lifts logged in this period
                </td>
              </tr>
            ) : (
              exTotals.slice(0, 24).map((ex, i) => (
                <ExerciseTotalsRow key={ex.liftKey} ex={ex} index={i} />
              ))
            )}
          </tbody>
        </table>
      </div>

      <Ornament variant="hollow" />

      {/* §III — Rep counter */}
      {repCounterLifts.length > 0 && (
        <>
          <ChapterOpener
            n="iii"
            title="Rep counter"
            caption="how many reps have you ever done at or above any weight you choose"
            glyph="chaplet"
          />
          <RepCounter
            workouts={raw}
            lifts={repCounterLifts}
          />
          <Ornament variant="star" />
        </>
      )}

      {/* INSIGHTS — short prose summaries */}
      <ChapterOpener n="iv" title="Notes from the period" caption="what the numbers say in plain English" glyph="seed" />
      <PeriodNotes totals={totals} exTotals={exTotals} />

      <Ornament variant="diamond" />

      <div style={{ textAlign: "center", marginTop: 36 }}>
        <ColophonSeal />
        <div className="marginalia" style={{ marginTop: 4 }}>
          totals recompute live as you change the range
        </div>
      </div>
    </div>
  );
}

function ExerciseTotalsRow({ ex, index }: { ex: ExerciseTotals; index: number }) {
  return (
    <tr>
      <td className="col-num">{index + 1}</td>
      <td style={{ fontFamily: "var(--serif)" }}>
        <Link
          href={`/exercises/${encodeURIComponent(ex.liftKey)}`}
          className="q-link"
          style={{ borderBottom: "none" }}
        >
          {ex.displayName}
        </Link>
      </td>
      <td style={{ textAlign: "right" }}>{ex.sessions}</td>
      <td style={{ textAlign: "right" }}>{ex.totalReps.toLocaleString()}</td>
      <td style={{ textAlign: "right" }}>
        <span className="rubric">{ex.tonnage.toLocaleString()}</span>
      </td>
      <td style={{ textAlign: "right", color: "var(--ink-light)" }}>
        {ex.trueMax > 0 ? `${ex.trueMax} kg` : "—"}
      </td>
      {ex.heavyWork.map((b, i) => (
        <td
          key={i}
          style={{
            textAlign: "right",
            color:
              b.reps === 0
                ? "var(--ash-light)"
                : i >= 3
                  ? "var(--rubric)"
                  : "var(--ink-light)",
          }}
        >
          {b.reps > 0 ? b.reps : "—"}
        </td>
      ))}
    </tr>
  );
}

function PeriodNotes({
  totals,
  exTotals,
}: {
  totals: ReturnType<typeof periodTotals>;
  exTotals: ExerciseTotals[];
}) {
  const top = exTotals[0];
  const heaviest = exTotals.find((e) => e.trueMax > 0);
  const heaviestHeavyWork = exTotals
    .filter((e) => e.trueMax > 0 && e.heavyWork[3].reps > 0)
    .sort((a, b) => b.heavyWork[3].reps - a.heavyWork[3].reps)[0];

  if (totals.sessions === 0) {
    return (
      <p className="body-prose">
        No work falls inside this range. Drag the brush wider, or pick a longer preset
        above.
      </p>
    );
  }

  return (
    <div>
      <p className="body-prose">
        Across {totals.sessions} session{totals.sessions === 1 ? "" : "s"} you moved a
        total of <Rubric>{totals.tonnage.toLocaleString()}</Rubric> kg over{" "}
        <strong>{totals.workingSets.toLocaleString()}</strong> working sets and{" "}
        <strong>{totals.totalReps.toLocaleString()}</strong> reps.
        {top && (
          <>
            {" "}
            Your most-loaded lift in this window was{" "}
            <Link
              href={`/exercises/${encodeURIComponent(top.liftKey)}`}
              className="q-link"
            >
              {top.displayName.toLowerCase()}
            </Link>
            , with <strong>{top.tonnage.toLocaleString()}</strong> kg of accumulated
            tonnage across {top.sessions} session{top.sessions === 1 ? "" : "s"}.
          </>
        )}
        {heaviestHeavyWork && (
          <>
            {" "}
            The most heavy work (≥90% of all-time max) landed on{" "}
            <Link
              href={`/exercises/${encodeURIComponent(heaviestHeavyWork.liftKey)}`}
              className="q-link"
            >
              {heaviestHeavyWork.displayName.toLowerCase()}
            </Link>{" "}
            &mdash; <Rubric>{heaviestHeavyWork.heavyWork[3].reps}</Rubric> reps at or
            above 90% of {heaviestHeavyWork.trueMax} kg.
          </>
        )}
        {!heaviestHeavyWork && heaviest && (
          <>
            {" "}
            No reps in this window crossed 90% of any lift&rsquo;s true max &mdash;
            this period was lighter, perhaps a deload or volume block.
          </>
        )}
      </p>
    </div>
  );
}

function Big({
  label,
  value,
  unit,
  sub,
}: {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
}) {
  return (
    <div style={{ background: "var(--paper)", padding: "18px 22px" }}>
      <div
        style={{
          fontFamily: "var(--display)",
          fontSize: ".55rem",
          fontVariant: "small-caps",
          letterSpacing: ".16em",
          color: "var(--ash)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--mono)",
          fontVariantNumeric: "oldstyle-nums tabular-nums",
          fontSize: "1.7rem",
          color: "var(--ink)",
          marginTop: 4,
          letterSpacing: "-.02em",
        }}
      >
        {value}
        {unit && (
          <span
            style={{
              marginLeft: 6,
              fontFamily: "var(--italic)",
              fontStyle: "italic",
              fontSize: ".72rem",
              color: "var(--ash)",
              letterSpacing: 0,
            }}
          >
            {unit}
          </span>
        )}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: "var(--italic)",
            fontStyle: "italic",
            fontSize: ".72rem",
            color: "var(--ash)",
            marginTop: 3,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function periodSpanLabel(p: Period): string {
  const ms = p.end.getTime() - p.start.getTime();
  const days = Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
  if (days <= 1) return "1 day";
  if (days < 21) return `${days} days`;
  if (days < 90) return `${Math.round(days / 7)} weeks`;
  if (days < 730) return `${Math.round(days / 30)} months`;
  return `${(days / 365).toFixed(1)} years`;
}
