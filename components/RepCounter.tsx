"use client";

/**
 * REP COUNTER — interactive: pick a lift, pick a threshold (either an
 * absolute weight in kg or a percentage of your true 1RM), drag the
 * chain pendant, and see the live count of working reps you've ever
 * performed at or above that threshold. Plus tonnage and session
 * count for context.
 *
 * Designed to be a joy: chips for lift, two-state toggle for mode,
 * one big slider, three illuminated stats.
 */

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ChainSlider } from "@/components/manuscript/ChainSlider";
import { LiftPicker } from "@/components/manuscript/charts/LiftPicker";
import { Plate } from "@/components/manuscript/Plate";
import { IlluminatedStat } from "@/components/manuscript/IlluminatedStat";
import { InkLineChart } from "@/components/manuscript/charts/InkLineChart";
import type { WorkoutRow, SetRow } from "@/lib/insights";
import { liftKey, toKg } from "@/lib/insights";

type SerializedWorkout = Omit<WorkoutRow, "date"> & { date: string };

type Lift = {
  key: string;
  label: string;
  found: boolean;
  trueMax: number; // kg
};

type Props = {
  workouts: SerializedWorkout[];
  lifts: Lift[]; // pre-computed canonical lifts the user has logged
};

type Mode = "kg" | "pct";

export function RepCounter({ workouts: raw, lifts }: Props) {
  const workouts = useMemo<WorkoutRow[]>(
    () => raw.map((w) => ({ ...w, date: new Date(w.date) })),
    [raw],
  );

  // pick the lift with the most reps logged as the default
  const defaultKey = useMemo(() => {
    const found = lifts.find((l) => l.found && l.trueMax > 0);
    return found?.key ?? lifts[0]?.key ?? "bench";
  }, [lifts]);

  const [selectedKey, setSelectedKey] = useState<string>(defaultKey);
  const [mode, setMode] = useState<Mode>("kg");
  // value is interpreted by mode: in kg mode, the absolute weight; in pct
  // mode, the percentage 0–100. Default to a sensible starting position.
  const [kgValue, setKgValue] = useState<number>(() => {
    const lift = lifts.find((l) => l.key === defaultKey);
    if (lift?.trueMax) return Math.round(lift.trueMax * 0.7 / 2.5) * 2.5;
    return 60;
  });
  const [pctValue, setPctValue] = useState<number>(80);

  const lift = lifts.find((l) => l.key === selectedKey);
  const trueMax = lift?.trueMax ?? 0;

  // resolve the kg threshold whichever mode we're in
  const thresholdKg =
    mode === "kg"
      ? kgValue
      : Math.round(((trueMax * pctValue) / 100) * 10) / 10;

  // Walk all sets across all workouts that match this lift; count those
  // whose load is >= thresholdKg, and include their reps in the total.
  const stats = useMemo(() => {
    const matchingSets: Array<{ date: Date; reps: number; weight: number; workoutId: string }> = [];
    for (const w of workouts) {
      for (const ex of w.exercises) {
        if (liftKey(ex) !== selectedKey) continue;
        for (const s of ex.sets) {
          if (s.isWarmup || s.weight == null || s.reps == null) continue;
          const weightKg = toKg(s.weight, s.weightUnit);
          if (weightKg + 0.01 < thresholdKg) continue;
          matchingSets.push({ date: w.date, reps: s.reps, weight: weightKg, workoutId: w.id });
        }
      }
    }
    const totalReps = matchingSets.reduce((n, s) => n + s.reps, 0);
    const totalSets = matchingSets.length;
    const totalTonnage = Math.round(
      matchingSets.reduce((n, s) => n + s.weight * s.reps, 0),
    );
    const sessionsAtOrAbove = new Set(matchingSets.map((s) => format(s.date, "yyyy-MM-dd"))).size;

    // a per-session timeline of reps-at-threshold for the chart
    const byDay = new Map<string, number>();
    for (const m of matchingSets) {
      const k = format(m.date, "yyyy-MM-dd");
      byDay.set(k, (byDay.get(k) ?? 0) + m.reps);
    }
    const timeline = Array.from(byDay.entries())
      .map(([d, reps]) => ({ x: d, y: reps }))
      .sort((a, b) => a.x.localeCompare(b.x));

    return { totalReps, totalSets, totalTonnage, sessionsAtOrAbove, timeline };
  }, [workouts, selectedKey, thresholdKg]);

  const liftOptions = lifts.map((l) => ({
    key: l.key,
    label: l.label,
    disabled: !l.found,
  }));

  // Slider config
  const sliderConfig = mode === "kg"
    ? {
        min: 0,
        max: Math.max(trueMax * 1.1, 40),
        step: 2.5,
        value: kgValue,
        onChange: (v: number) => setKgValue(v),
        format: (v: number) => `${v} kg`,
      }
    : {
        min: 0,
        max: 100,
        step: 5,
        value: pctValue,
        onChange: (v: number) => setPctValue(v),
        format: (v: number) => `${v}%`,
      };

  return (
    <Plate
      numeral="iii"
      title="Rep counter"
      caption={
        lift?.found
          ? `total reps you've performed of ${lift.label.toLowerCase()} at a chosen threshold`
          : "select a lift you've logged to count reps at any threshold"
      }
    >
      <div style={{ padding: "10px 8px" }}>
        <LiftPicker
          lifts={liftOptions}
          selected={selectedKey}
          onSelect={(k) => {
            setSelectedKey(k);
            const next = lifts.find((l) => l.key === k);
            if (next?.trueMax) {
              setKgValue(Math.round((next.trueMax * 0.7) / 2.5) * 2.5);
            }
          }}
        />

        {/* mode toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 16,
            margin: "14px 0 6px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--display)",
              fontVariant: "small-caps",
              fontSize: ".68rem",
              letterSpacing: ".16em",
              color: "var(--ash)",
            }}
          >
            threshold by
          </span>
          <ModeButton
            label="absolute weight"
            active={mode === "kg"}
            onClick={() => setMode("kg")}
          />
          <span style={{ color: "var(--ash-light)", fontSize: ".7rem" }}>·</span>
          <ModeButton
            label={trueMax > 0 ? `% of true max (${Math.round(trueMax)} kg)` : "% of true max"}
            active={mode === "pct"}
            onClick={() => trueMax > 0 && setMode("pct")}
            disabled={trueMax <= 0}
          />
        </div>

        {/* slider */}
        <div style={{ marginTop: 14 }}>
          <ChainSlider
            min={sliderConfig.min}
            max={sliderConfig.max}
            step={sliderConfig.step}
            value={sliderConfig.value}
            onChange={sliderConfig.onChange}
            format={sliderConfig.format}
          />
        </div>

        {/* live readout */}
        <div
          style={{
            marginTop: 14,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 14,
          }}
        >
          <IlluminatedStat
            label="reps at or above"
            value={stats.totalReps.toLocaleString()}
            unit={`≥ ${Math.round(thresholdKg)} kg`}
            sub={
              trueMax > 0
                ? mode === "pct"
                  ? `${pctValue}% of ${Math.round(trueMax)} kg`
                  : `${Math.round((thresholdKg / trueMax) * 100)}% of ${Math.round(trueMax)} kg true max`
                : undefined
            }
          />
          <IlluminatedStat
            label="working sets"
            value={stats.totalSets.toLocaleString()}
            sub="that crossed the threshold"
          />
          <IlluminatedStat
            label="sessions"
            value={stats.sessionsAtOrAbove.toLocaleString()}
            sub="containing at least one set"
          />
          <IlluminatedStat
            label="cumulative tonnage"
            value={stats.totalTonnage.toLocaleString()}
            unit="kg"
            sub="over those reps"
          />
        </div>

        {/* timeline */}
        {stats.timeline.length > 0 ? (
          <div style={{ marginTop: 22 }}>
            <div
              style={{
                fontFamily: "var(--italic)",
                fontStyle: "italic",
                fontSize: ".82rem",
                color: "var(--ash)",
                marginBottom: 4,
                textAlign: "center",
              }}
            >
              reps at or above the threshold, session by session
            </div>
            <InkLineChart
              series={stats.timeline}
              yLabel="reps · session"
              height={200}
            />
          </div>
        ) : (
          <div
            style={{
              marginTop: 22,
              padding: "30px 0",
              textAlign: "center",
              fontFamily: "var(--italic)",
              fontStyle: "italic",
              color: "var(--ash)",
            }}
          >
            no working reps of this lift have crossed{" "}
            <span className="rubric">{Math.round(thresholdKg)} kg</span> yet
          </div>
        )}
      </div>
    </Plate>
  );
}

function ModeButton({
  label,
  active,
  onClick,
  disabled,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        background: "transparent",
        border: "none",
        fontFamily: "var(--display)",
        fontVariant: "small-caps",
        fontSize: ".74rem",
        fontWeight: 500,
        letterSpacing: ".14em",
        color: disabled ? "var(--ash-light)" : active ? "var(--rubric)" : "var(--ash)",
        cursor: disabled ? "not-allowed" : "pointer",
        padding: "3px 2px",
        borderBottom: active ? "1.5px solid var(--rubric)" : "1.5px solid transparent",
        transition: "color .15s var(--ease), border-color .15s var(--ease)",
      }}
      onMouseEnter={(e) => {
        if (!active && !disabled) e.currentTarget.style.color = "var(--ink)";
      }}
      onMouseLeave={(e) => {
        if (!active && !disabled) e.currentTarget.style.color = "var(--ash)";
      }}
    >
      {label}
    </button>
  );
}
