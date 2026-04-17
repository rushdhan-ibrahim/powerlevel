import Link from "next/link";
import { notFound } from "next/navigation";
import { differenceInCalendarDays, format } from "date-fns";
import { prisma } from "@/lib/db";
import {
  bestE1RM,
  exerciseHistory,
  liftKey,
  setTonnage,
  toKg,
  type WorkoutRow,
  type SetRow,
} from "@/lib/insights";
import { loadProfile, classifyLift, type StrengthClass } from "@/lib/profile";
import { Headpiece } from "@/components/manuscript/Headpiece";
import { Ornament } from "@/components/manuscript/Ornament";
import { Initial } from "@/components/manuscript/Initial";
import { Plate } from "@/components/manuscript/Plate";
import { ChapterOpener } from "@/components/manuscript/ChapterOpener";
import { PageIncipit } from "@/components/manuscript/PageIncipit";
import { IlluminatedStat } from "@/components/manuscript/IlluminatedStat";
import { Rubric } from "@/components/manuscript/Rubric";
import { OrreryE1RM } from "@/components/manuscript/plates/OrreryE1RM";
import { InkLineChart } from "@/components/manuscript/charts/InkLineChart";
import { MemoryField } from "@/components/manuscript/plates/MemoryField";
import { ColophonSeal } from "@/components/manuscript/Seal";
import { roman } from "@/lib/manuscript";
import { consistencyGrid } from "@/lib/insights";
import { SortableSessionTable } from "@/components/SortableSessionTable";

export const revalidate = 60;

export default async function ExercisePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const key = decodeURIComponent(slug);

  const [raw, profile] = await Promise.all([
    prisma.workout.findMany({
      orderBy: { date: "asc" },
      omit: {
        rawParseJson: true,
        parseModel: true,
        parseTokensIn: true,
        parseTokensOut: true,
        createdAt: true,
        updatedAt: true,
      },
      include: { exercises: { include: { sets: true } } },
    }),
    loadProfile(),
  ]);

  const workouts: WorkoutRow[] = raw.map((w) => ({
    id: w.id,
    date: w.date,
    title: w.title,
    exercises: w.exercises.map((e) => ({
      id: e.id,
      name: e.name,
      normalizedName: e.normalizedName,
      canonicalSlug: e.canonicalSlug,
      category: e.category,
      variation: e.variation,
      muscleGroup: e.muscleGroup,
      sets: e.sets,
    })),
  }));

  const history = exerciseHistory(workouts, key);
  if (history.length === 0) notFound();

  // Find every exercise row that matches this lift to collect raw set data
  const matchingExercises = workouts.flatMap((w) =>
    w.exercises
      .filter((e) => liftKey(e) === key)
      .map((e) => ({ ...e, date: w.date, workoutId: w.id })),
  );

  const displayName = matchingExercises[0]?.name ?? key;
  const muscleGroup = matchingExercises[0]?.muscleGroup ?? "other";
  const category = matchingExercises[0]?.category ?? "weighted_reps";

  // Aggregate stats
  let totalWorkingSets = 0;
  let totalReps = 0;
  let totalTonnage = 0;
  let heaviestWeight = 0;
  let heaviestReps = 0;
  let heaviestDate: Date | null = null;
  const byRepRange = { strength: 0, hypertrophy: 0, metabolic: 0 };
  const variationsSet = new Set<string>();

  for (const ex of matchingExercises) {
    if (ex.variation) variationsSet.add(ex.variation);
    for (const s of ex.sets) {
      if (s.isWarmup) continue;
      totalWorkingSets++;
      if (s.reps != null) {
        totalReps += s.reps;
        if (s.reps <= 5) byRepRange.strength++;
        else if (s.reps <= 12) byRepRange.hypertrophy++;
        else byRepRange.metabolic++;
      }
      totalTonnage += setTonnage(s);
      if (s.weight != null && s.reps != null) {
        const wkg = toKg(s.weight, s.weightUnit);
        if (wkg > heaviestWeight) {
          heaviestWeight = wkg;
          heaviestReps = s.reps;
          heaviestDate = ex.date;
        }
      }
    }
  }

  const peakE1RM = Math.max(...history.map((h) => h.e1RM));
  const peakSession = history.find((h) => h.e1RM === peakE1RM);
  const latestSession = history[history.length - 1];
  const previousSessions = history.slice(-6, -1);
  const trendPct =
    previousSessions.length > 0
      ? Math.round(
          ((latestSession.e1RM -
            previousSessions.reduce((s, x) => s + x.e1RM, 0) / previousSessions.length) /
            Math.max(
              previousSessions.reduce((s, x) => s + x.e1RM, 0) / previousSessions.length,
              1,
            )) *
            100,
        )
      : null;

  // Strength standards if profile + big lift match
  const LIFT_KEY_MAP: Record<string, "squat" | "bench" | "deadlift" | "ohp" | "row" | "pullup"> = {
    back_squat: "squat", low_bar_squat: "squat", front_squat: "squat", squat: "squat",
    bench_press: "bench", "bench press": "bench", benchpress: "bench",
    deadlift: "deadlift", sumo_deadlift: "deadlift",
    overhead_press: "ohp", push_press: "ohp", ohp: "ohp",
    barbell_row: "row", pendlay_row: "row", "barbell row": "row",
    pull_up: "pullup", chin_up: "pullup", pullup: "pullup",
  };
  const canonKey = LIFT_KEY_MAP[key] ?? LIFT_KEY_MAP[displayName.toLowerCase()];
  const classification = canonKey && profile.bodyweightKg
    ? classifyLift(
        canonKey,
        peakE1RM,
        profile.bodyweightKg,
        profile.sex as "male" | "female" | null,
      )
    : null;

  const bwRatio =
    profile.bodyweightKg && peakE1RM
      ? Math.round((peakE1RM / profile.bodyweightKg) * 100) / 100
      : null;

  // Chart data
  const chartPoints = (() => {
    let running = 0;
    return history.map((h) => {
      const isPR = h.e1RM > running;
      if (isPR) running = h.e1RM;
      return { x: h.date, y: h.e1RM, isPR };
    });
  })();

  const topSetChartPoints = history
    .filter((h) => h.topSet && h.topSet.weight > 0)
    .map((h) => ({
      x: h.date,
      y: h.topSet!.weight,
    }));

  // Training calendar
  const consistency = consistencyGrid(workouts, 14);
  const trainingDatesSet = new Set(
    matchingExercises.map((e) => format(e.date, "yyyy-MM-dd")),
  );
  const memoryCells = consistency.map((c) => ({
    ...c,
    tonnage: trainingDatesSet.has(c.date) ? 1 : 0,
    count: trainingDatesSet.has(c.date) ? 1 : c.count < 0 ? -1 : 0,
  }));

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <Link
          href="/insights"
          style={{
            fontFamily: "var(--display)",
            fontVariant: "small-caps",
            fontSize: ".68rem",
            fontWeight: 500,
            letterSpacing: ".16em",
            color: "var(--ash)",
            textDecoration: "none",
          }}
        >
          ← plates
        </Link>
      </div>

      <PageIncipit
        eyebrow="A treatise on a single lift"
        title={capitalize(displayName)}
        meta={`${muscleGroup.replace(/_/g, " ")} · ${history.length} session${history.length === 1 ? "" : "s"} · first ${format(history[0].date, "MMM d, yyyy")}`}
      />

      <p className="body-prose">
        <Initial letter={firstLetter(displayName)} seed={displayName.charCodeAt(0) * 13 + 2} />
        Across {history.length} session{history.length === 1 ? "" : "s"}, the highest
        estimated one-rep maximum reached for this lift was{" "}
        <Rubric><span className="numerals">{peakE1RM}</span> kg</Rubric>
        {peakSession && (
          <>
            {" "}on <em>{format(peakSession.date, "MMMM d, yyyy")}</em>
          </>
        )}
        . The heaviest single weight moved was{" "}
        <strong><span className="numerals">{Math.round(heaviestWeight)}</span> kg</strong>
        {heaviestReps > 0 && <> for <strong>{heaviestReps}</strong> reps</>}
        {heaviestDate && <> on {format(heaviestDate, "MMM d, yyyy")}</>}
        .{" "}
        {trendPct != null && (
          <>
            Most recently the lift is{" "}
            <em>
              {trendPct > 2 ? `ascending — ${trendPct}% above the prior window` : trendPct < -3 ? `declining — ${Math.abs(trendPct)}% below the prior window` : "level with the prior window"}
            </em>
            .{" "}
          </>
        )}
        {classification && (
          <>
            At your bodyweight of{" "}
            <strong><span className="numerals">{profile.bodyweightKg}</span> kg</strong>,
            this peak puts you at{" "}
            <Rubric>{classification.ratio}×</Rubric> bodyweight —{" "}
            a <em>{classification.klass}</em>-class lift by published standards.
          </>
        )}
      </p>

      <Ornament variant="diamond" />

      {/* §I VITAL SIGNS */}
      <ChapterOpener
        n="i"
        title="Vital signs"
        caption="peak · heaviest · volume · cadence"
        glyph="compass"
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
        }}
      >
        <IlluminatedStat
          label="peak est. 1RM"
          value={String(peakE1RM)}
          unit="kg"
          sub={peakSession ? format(peakSession.date, "MMM d, yyyy") : undefined}
        />
        <IlluminatedStat
          label="heaviest set"
          value={heaviestWeight > 0 ? `${Math.round(heaviestWeight)}×${heaviestReps}` : "—"}
          unit="kg"
          sub={heaviestDate ? format(heaviestDate, "MMM d") : undefined}
        />
        <IlluminatedStat
          label="lifetime tonnage"
          value={Math.round(totalTonnage).toLocaleString()}
          unit="kg"
          sub={`across ${totalWorkingSets} working sets`}
        />
        <IlluminatedStat
          label="lifetime reps"
          value={totalReps.toLocaleString()}
          sub={`${history.length} session${history.length === 1 ? "" : "s"}`}
        />
      </div>

      {(bwRatio || classification) && (
        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
        >
          {bwRatio != null && (
            <IlluminatedStat
              label="× bodyweight"
              value={`${bwRatio}×`}
              unit="bw"
              sub={profile.bodyweightKg ? `at ${profile.bodyweightKg} kg` : undefined}
            />
          )}
          {classification && (
            <IlluminatedStat
              label="strength class"
              value={classification.klass}
              sub={`elite: ${classification.targets[3]}× bw`}
            />
          )}
          <IlluminatedStat
            label="trend · last 6"
            value={trendPct == null ? "—" : `${trendPct > 0 ? "+" : ""}${trendPct}%`}
            sub={trendPct == null ? "not enough sessions" : undefined}
            subWarn={trendPct != null && trendPct < -3}
          />
          <IlluminatedStat
            label="variations"
            value={String(variationsSet.size || "—")}
            sub={variationsSet.size > 0 ? "see below" : undefined}
          />
        </div>
      )}

      <Ornament variant="hollow" />

      {/* §II PROGRESSION */}
      <ChapterOpener
        n="ii"
        title="Progression"
        caption="estimated 1RM and top-set weight, session by session"
        glyph="seed"
      />

      <div className="plate-grid" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}>
        <Plate numeral="i" title="est. 1RM curve" caption="rubric diamonds mark PRs">
          <InkLineChart
            series={chartPoints}
            yLabel="est. 1RM (kg)"
            yUnit="kg"
            height={260}
            emptyLabel="one data point — more sessions will draw the curve"
          />
        </Plate>
        <Plate numeral="ii" title="top-set weight" caption="heaviest working-set load, session by session">
          <InkLineChart
            series={topSetChartPoints}
            yLabel="weight (kg)"
            yUnit="kg"
            height={260}
            emptyLabel="no top-set data yet"
          />
        </Plate>
      </div>

      <Ornament variant="star" />

      {/* §III ORBITAL FIELD */}
      <ChapterOpener
        n="iii"
        title="Orbital field"
        caption="every session orbiting the same center · radius grows with e1RM"
        glyph="compass"
      />
      <Plate
        numeral="iii"
        title="The Orrery"
        caption="time runs clockwise from the apex · diamonds mark personal records"
      >
        <OrreryE1RM
          history={history.map((h) => ({ date: h.date, e1RM: h.e1RM }))}
        />
      </Plate>

      <Ornament variant="hollow" />

      {/* §IV REP RANGE */}
      <ChapterOpener
        n="iv"
        title="Rep-range distribution"
        caption="working sets by intent · lifetime"
        glyph="rose"
      />
      <div className="plate-grid" style={{ gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)" }}>
        <Plate numeral="iv" title="Sets by rep range" caption="strength · hypertrophy · metabolic">
          <RepRangeBar
            strength={byRepRange.strength}
            hypertrophy={byRepRange.hypertrophy}
            metabolic={byRepRange.metabolic}
          />
        </Plate>
        <Plate
          numeral="v"
          title="Training calendar"
          caption="sessions of this lift · last 14 weeks"
        >
          <MemoryField cells={memoryCells} weeks={14} />
        </Plate>
      </div>

      {variationsSet.size > 0 && (
        <>
          <Ornament variant="star" />
          <ChapterOpener
            n="v"
            title="Variations observed"
            caption="qualifiers Gemini found on the page"
            glyph="chaplet"
          />
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              padding: "10px 0 20px",
            }}
          >
            {Array.from(variationsSet).map((v) => (
              <span
                key={v}
                style={{
                  fontFamily: "var(--italic)",
                  fontStyle: "italic",
                  fontSize: ".92rem",
                  color: "var(--rubric)",
                  padding: "6px 14px",
                  border: "1px solid var(--rubric)",
                  borderRadius: 2,
                  background: "rgba(139,45,35,.04)",
                }}
              >
                {v}
              </span>
            ))}
          </div>
        </>
      )}

      <Ornament variant="trinity" />

      {/* §VI SESSION HISTORY */}
      <ChapterOpener
        n={variationsSet.size > 0 ? "vi" : "v"}
        title="Session history"
        caption="every time you've performed this lift, most recent first"
        glyph="hourglass"
      />
      <div className="plate" style={{ padding: 18 }}>
        <span className="plate-n">vi</span>
        <span className="plate-t">full log · click a column to sort</span>
        <SortableSessionTable
          sessions={history.map((s) => ({
            date: s.date.toISOString(),
            workoutId: s.workoutId,
            e1RM: s.e1RM,
            topSet: s.topSet,
            totalVolume: s.totalVolume,
          }))}
        />
      </div>

      <Ornament variant="diamond" />

      <div style={{ textAlign: "center", marginTop: 36 }}>
        <ColophonSeal />
        <div className="marginalia" style={{ marginTop: 4 }}>
          the lift continues
        </div>
      </div>
    </div>
  );
}

function firstLetter(name: string): string {
  const ch = name.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(ch) ? ch : "T";
}

function capitalize(name: string): string {
  return name.replace(/\b[a-z]/g, (m) => m.toUpperCase());
}

/* ─── Rep range bar ─────────────────────────────────────────── */

function RepRangeBar({
  strength,
  hypertrophy,
  metabolic,
}: {
  strength: number;
  hypertrophy: number;
  metabolic: number;
}) {
  const total = strength + hypertrophy + metabolic;
  if (total === 0) {
    return (
      <div
        style={{
          padding: "40px 12px",
          textAlign: "center",
          fontFamily: "var(--italic)",
          fontStyle: "italic",
          color: "var(--ash)",
        }}
      >
        no working reps logged
      </div>
    );
  }
  const sPct = (strength / total) * 100;
  const hPct = (hypertrophy / total) * 100;
  const mPct = (metabolic / total) * 100;
  return (
    <div style={{ padding: "30px 20px" }}>
      <div
        style={{
          display: "flex",
          width: "100%",
          height: 32,
          background: "var(--paper-warm)",
          border: "1px solid var(--rule)",
          overflow: "hidden",
        }}
      >
        {strength > 0 && (
          <div
            style={{
              width: `${sPct}%`,
              background: "var(--ink)",
              opacity: 0.9,
            }}
            title={`${strength} sets of 1–5 reps`}
          />
        )}
        {hypertrophy > 0 && (
          <div
            style={{
              width: `${hPct}%`,
              background: "var(--ink)",
              opacity: 0.55,
              borderLeft: strength > 0 ? "1px solid var(--paper)" : "none",
            }}
            title={`${hypertrophy} sets of 6–12 reps`}
          />
        )}
        {metabolic > 0 && (
          <div
            style={{
              width: `${mPct}%`,
              background: "var(--ash)",
              opacity: 0.85,
              borderLeft: hypertrophy > 0 || strength > 0 ? "1px solid var(--paper)" : "none",
            }}
            title={`${metabolic} sets of 13+ reps`}
          />
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginTop: 20,
          textAlign: "center",
        }}
      >
        <RangeCell
          label="strength"
          reps="1–5"
          count={strength}
          pct={sPct}
          active={strength >= hypertrophy && strength >= metabolic}
        />
        <RangeCell
          label="hypertrophy"
          reps="6–12"
          count={hypertrophy}
          pct={hPct}
          active={hypertrophy > strength && hypertrophy >= metabolic}
        />
        <RangeCell
          label="metabolic"
          reps="13+"
          count={metabolic}
          pct={mPct}
          active={metabolic > strength && metabolic > hypertrophy}
        />
      </div>
    </div>
  );
}

function RangeCell({
  label,
  reps,
  count,
  pct,
  active,
}: {
  label: string;
  reps: string;
  count: number;
  pct: number;
  active: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--display)",
          fontVariant: "small-caps",
          fontSize: ".62rem",
          letterSpacing: ".16em",
          color: active ? "var(--rubric)" : "var(--ash)",
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--italic)",
          fontStyle: "italic",
          fontSize: ".7rem",
          color: "var(--ash)",
          marginTop: 2,
        }}
      >
        {reps} reps
      </div>
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: "1.25rem",
          color: active ? "var(--rubric)" : "var(--ink)",
          marginTop: 8,
          letterSpacing: "-.01em",
        }}
      >
        {count}
      </div>
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: ".68rem",
          color: "var(--ash)",
          marginTop: 2,
        }}
      >
        {Math.round(pct)}%
      </div>
    </div>
  );
}
