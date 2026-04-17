import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { prisma } from "@/lib/db";
import { type WorkoutRow } from "@/lib/insights";
import {
  acwr,
  keyLifts,
  muscleFrequency,
  muscleVolumeLedger,
  powerliftingTotal,
  progressionSignals,
  recoveryStats,
  repRangeByWeek,
  repRangeDistribution,
  strengthRatios,
  type KeyLiftRow,
  type MuscleVolumeRow,
  type RatioRow,
  type FrequencyRow,
} from "@/lib/training";
import { exerciseHistory, liftKey, weeklyTonnage } from "@/lib/insights";
import { LedgerCharts } from "@/components/LedgerCharts";
import { Headpiece } from "@/components/manuscript/Headpiece";
import { Ornament } from "@/components/manuscript/Ornament";
import { Initial } from "@/components/manuscript/Initial";
import { ChapterOpener } from "@/components/manuscript/ChapterOpener";
import { PageIncipit } from "@/components/manuscript/PageIncipit";
import { Plate } from "@/components/manuscript/Plate";
import { Rubric } from "@/components/manuscript/Rubric";
import { Vesica } from "@/components/manuscript/plates/Vesica";
import { Vitruvian } from "@/components/manuscript/plates/Vitruvian";
import { RepRangeWheel } from "@/components/manuscript/plates/RepRangeWheel";
import { LoadChain } from "@/components/manuscript/plates/LoadChain";
import { ColophonSeal } from "@/components/manuscript/Seal";
import { roman } from "@/lib/manuscript";

export const dynamic = "force-dynamic";

export default async function LedgerPage() {
  const raw = await prisma.workout.findMany({
    orderBy: { date: "desc" },
    include: { exercises: { include: { sets: true } } },
  });

  const workouts: WorkoutRow[] = raw.map((w) => ({
    id: w.id,
    date: w.date,
    title: w.title,
    exercises: w.exercises.map((e) => ({
      id: e.id,
      name: e.name,
      normalizedName: e.normalizedName,
      muscleGroup: e.muscleGroup,
      sets: e.sets,
    })),
  }));

  if (workouts.length === 0) {
    return (
      <div>
        <PageIncipit eyebrow="The Coach's View" title="Ledger" meta="no workouts to analyse yet" />
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Vesica size={140} />
          <p className="body-prose" style={{ maxWidth: 420, margin: "20px auto" }}>
            The ledger needs at least one workout to start its analysis.
          </p>
          <Link href="/upload" className="btn btn-rubric btn-quill">
            add your first workout
          </Link>
        </div>
      </div>
    );
  }

  const lifts = keyLifts(workouts);
  const sbd = powerliftingTotal(lifts);
  const muscles = muscleVolumeLedger(workouts);
  const repDist = repRangeDistribution(workouts, 28);
  const ratios = strengthRatios(workouts);
  const progression = progressionSignals(workouts).slice(0, 12);
  const load = acwr(workouts);
  const recovery = recoveryStats(workouts);
  const frequency = muscleFrequency(workouts);

  // ─── data for the new chart section ──────────────────────────
  const KEY_LIFT_SLUGS: Record<string, string[]> = {
    squat: ["back_squat", "low_bar_squat", "front_squat", "back squat", "squat"],
    bench: ["bench_press", "bench press", "benchpress"],
    deadlift: ["deadlift", "sumo_deadlift"],
    ohp: ["overhead_press", "push_press", "ohp"],
    row: ["barbell_row", "pendlay_row", "dumbbell_row", "barbell row", "bb row"],
    pullup: ["pull_up", "chin_up", "pullup", "pull up", "chin up"],
  };

  const progressionLiftsSerialized = lifts.map((l) => {
    // Aggregate all normalized-name / canonical-slug matches for this key lift
    const slugs = KEY_LIFT_SLUGS[l.key] ?? [l.key];
    const matching = new Set<string>();
    for (const w of workouts) {
      for (const ex of w.exercises) {
        const k = liftKey(ex);
        const name = ex.name.toLowerCase();
        const norm = ex.normalizedName.toLowerCase();
        if (
          slugs.some(
            (s) => k === s || norm === s || name.includes(s.replace(/_/g, " ")),
          )
        ) {
          matching.add(k);
        }
      }
    }
    const sessions: { date: string; e1RM: number; isPR: boolean }[] = [];
    for (const key of matching) {
      const hist = exerciseHistory(workouts, key);
      let running = 0;
      for (const h of hist) {
        const isPR = h.e1RM > running;
        if (isPR) running = h.e1RM;
        sessions.push({ date: h.date.toISOString(), e1RM: h.e1RM, isPR });
      }
    }
    sessions.sort((a, b) => a.date.localeCompare(b.date));
    return {
      key: l.key,
      label: l.label,
      sessions,
      peakE1RM: l.peakE1RM,
    };
  });

  // initial tab: the first key lift that actually has data
  const initialTab =
    progressionLiftsSerialized.find((l) => l.sessions.length > 0)?.key ??
    progressionLiftsSerialized[0]?.key ??
    "squat";

  const weekly12 = weeklyTonnage(workouts, 12);
  const repRangeWeekly = repRangeByWeek(workouts, 12);

  return (
    <div>
      <PageIncipit
        eyebrow="The Coach's View"
        title="Ledger"
        meta="key lifts · volume · intensity · load management"
      />

      <p className="body-prose">
        <Initial letter="T" />
        his is the coach&rsquo;s view. Where{" "}
        <Link href="/insights" className="q-link">
          the plates
        </Link>{" "}
        invite contemplation, the ledger answers practical questions: how much volume
        each muscle is getting, which lifts are moving, whether the workload is spiking,
        how balanced the push and pull are. Numbers are drawn from evidence-based
        training literature; targets are approximate, not prescriptive.
      </p>

      <Ornament variant="diamond" />

      {/* §I — The big lifts */}
      <ChapterOpener n="i" title="The big lifts" caption="estimated 1RM, all-time peak, top set, recent trend" glyph="compass" />
      <p className="body-prose">
        Estimated one-rep max for the compound movements, derived from your working sets
        using the Epley formula (<em>weight × (1 + reps ÷ 30)</em>). Rubric entries are
        the powerlifting three &mdash; their sum is your estimated total.
      </p>

      {sbd > 0 && (
        <div
          style={{
            marginTop: 14,
            marginBottom: 18,
            padding: "18px 22px",
            border: "1px solid var(--rubric)",
            background: "rgb(139 45 35 / .04)",
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--display)",
                fontVariant: "small-caps",
                fontSize: ".62rem",
                letterSpacing: ".2em",
                color: "var(--rubric)",
                marginBottom: 3,
              }}
            >
              est. powerlifting total
            </div>
            <div
              style={{
                fontFamily: "var(--italic)",
                fontStyle: "italic",
                fontSize: ".8rem",
                color: "var(--ash)",
              }}
            >
              squat &amp; bench &amp; deadlift, estimated from working sets
            </div>
          </div>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: "2rem",
              color: "var(--rubric)",
              letterSpacing: "-.02em",
              fontVariantNumeric: "oldstyle-nums tabular-nums",
            }}
          >
            {sbd} <span style={{ fontSize: "1rem", color: "var(--ash)" }}>kg</span>
          </div>
        </div>
      )}

      <div className="plate" style={{ padding: 18 }}>
        <span className="plate-n">i</span>
        <span className="plate-t">Key lifts · current estimates</span>
        <table className="set-table" style={{ marginTop: 22 }}>
          <thead>
            <tr>
              <th>lift</th>
              <th style={{ textAlign: "right" }}>est. 1RM</th>
              <th style={{ textAlign: "right" }}>all-time peak</th>
              <th style={{ textAlign: "right" }}>top set</th>
              <th style={{ textAlign: "right" }}>trend</th>
              <th>last done</th>
            </tr>
          </thead>
          <tbody>
            {lifts.map((l) => (
              <KeyLiftRowDisplay key={l.key} row={l} />
            ))}
          </tbody>
        </table>
      </div>

      <Ornament variant="hollow" />

      {/* §II — Progression over time */}
      <ChapterOpener
        n="ii"
        title="Progression"
        caption="estimated 1RM by session · weekly tonnage · rep-range rhythm"
        glyph="compass"
      />
      <p className="body-prose">
        A chart is the most honest conversation with your training. Pick a lift below to
        watch its estimated one-rep max over time; the rubric diamonds mark sessions
        where you set a new personal record. Alongside, the weekly tonnage line and the
        rep-range rhythm give the shape of your last twelve weeks.
      </p>

      <LedgerCharts
        lifts={progressionLiftsSerialized}
        initialKey={initialTab}
        weeklyTonnage={weekly12}
        repRangeWeekly={repRangeWeekly}
        keyLiftRows={lifts}
      />

      <Ornament variant="star" />

      {/* §III — Volume per muscle */}
      <ChapterOpener n="iii" title="Weekly volume per muscle group" caption="working sets vs evidence-based MEV/MAV/MRV bands" glyph="rose" />
      <p className="body-prose">
        Working sets per muscle group over the current training week, compared against
        evidence-based ranges: <strong>MEV</strong> (minimum effective volume) is the
        floor; <strong>MAV</strong> (maximum adaptive volume) is the hypertrophy sweet
        spot; <strong>MRV</strong> (maximum recoverable) is the ceiling above which
        recovery suffers. The Vitruvian figure to the right illuminates the same data
        at a glance.
      </p>

      <div
        className="plate-grid"
        style={{ gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)" }}
      >
        <div className="plate" style={{ padding: 18 }}>
          <span className="plate-n">v</span>
          <span className="plate-t">Volume vs target</span>
          <table className="set-table" style={{ marginTop: 22 }}>
            <thead>
              <tr>
                <th>muscle</th>
                <th style={{ textAlign: "right" }}>this wk</th>
                <th style={{ textAlign: "right" }}>4wk avg</th>
                <th>target (mav)</th>
                <th style={{ textAlign: "right" }}>status</th>
              </tr>
            </thead>
            <tbody>
              {muscles.map((m) => (
                <VolumeRow key={m.group} row={m} />
              ))}
            </tbody>
          </table>
        </div>

        <Plate
          numeral="vi"
          title="The Vitruvian figure"
          caption="muscle zones illuminated by working-set volume"
          size="tall"
        >
          <Vitruvian muscles={muscles} />
        </Plate>
      </div>

      <Ornament variant="star" />

      {/* §III — Intensity + Load */}
      <ChapterOpener n="iv" title="Intensity &amp; load" caption="strength · hypertrophy · metabolic — and the acute:chronic chain" glyph="hourglass" />
      <p className="body-prose">
        The wheel shows how your working sets split across rep ranges &mdash;{" "}
        <em>strength</em> work (1&ndash;5 reps), <em>hypertrophy</em> work
        (6&ndash;12), and <em>metabolic</em> work (13+). The chain beneath tracks
        acute-to-chronic workload: last week&rsquo;s tonnage against your four-week
        rolling average. The <Rubric>rubric pendant</Rubric> marks your current ratio.
        Sweet spot is 0.8&ndash;1.3; consistent spikes above 1.5 are a signal to back
        off.
      </p>

      <div className="plate-grid">
        <Plate
          numeral="vii"
          title="Rep-range distribution · aggregate"
          caption="working sets by rep range · last 28 days"
        >
          <RepRangeWheel
            strengthPct={repDist.strengthPct}
            hypertrophyPct={repDist.hypertrophyPct}
            metabolicPct={repDist.metabolicPct}
            total={repDist.total}
          />
        </Plate>

        <Plate
          numeral="viii"
          title="Acute : chronic workload"
          caption={`current ratio · ${load.status}`}
        >
          <LoadChain ratio={load.ratio} status={load.status} acute={load.acute} chronic={load.chronic} />
          <div
            style={{
              fontFamily: "var(--italic)",
              fontStyle: "italic",
              fontSize: ".85rem",
              color: "var(--ink-light)",
              padding: "10px 20px 18px",
              textAlign: "center",
              lineHeight: 1.55,
            }}
          >
            {ACWR_NOTE[load.status]}
          </div>
        </Plate>
      </div>

      <Ornament variant="hollow" />

      {/* §IV — Progression signals */}
      <ChapterOpener n="v" title="Progression signals" caption="ascending · stable · declining, by recent comparison" glyph="seed" />
      <p className="body-prose">
        Each frequent lift is compared to its own recent history. <em>Ascending</em>{" "}
        means the most recent e1RM exceeded the average of the preceding sessions;{" "}
        <em>stable</em> is within 2% of it; <em>declining</em> has dropped more than 3%.
        Declining lifts aren&rsquo;t always a problem &mdash; they can mean a deload or
        an honest fatigue &mdash; but multiple declines in a row are worth looking at.
      </p>

      <div className="plate" style={{ padding: 18 }}>
        <span className="plate-n">ix</span>
        <span className="plate-t">Direction of travel · recent sessions</span>
        <table className="set-table" style={{ marginTop: 22 }}>
          <thead>
            <tr>
              <th>n</th>
              <th>lift</th>
              <th style={{ textAlign: "right" }}>now</th>
              <th style={{ textAlign: "right" }}>peak</th>
              <th style={{ textAlign: "right" }}>δ %</th>
              <th>trend</th>
              <th>last done</th>
            </tr>
          </thead>
          <tbody>
            {progression.map((p, i) => (
              <tr key={p.normalizedName}>
                <td className="col-num">{roman(i + 1).toLowerCase()}</td>
                <td>
                  <Link
                    href={`/exercises/${encodeURIComponent(p.normalizedName)}`}
                    className="q-link"
                    style={{ borderBottom: "none" }}
                  >
                    {p.displayName}
                  </Link>
                </td>
                <td style={{ textAlign: "right" }}>
                  <span className="rubric">{p.currentE1RM}</span>
                </td>
                <td style={{ textAlign: "right" }}>{p.peakE1RM}</td>
                <td
                  style={{
                    textAlign: "right",
                    color:
                      p.trend === "up"
                        ? "var(--rubric)"
                        : p.trend === "down"
                          ? "var(--ash)"
                          : "var(--ink-light)",
                  }}
                >
                  {p.deltaPct > 0 ? "+" : ""}
                  {p.deltaPct}
                </td>
                <td>
                  <TrendGlyph trend={p.trend} />{" "}
                  <span
                    style={{
                      fontFamily: "var(--italic)",
                      fontStyle: "italic",
                      fontSize: ".76rem",
                      color: "var(--ash)",
                    }}
                  >
                    {p.trend === "up" ? "ascending" : p.trend === "down" ? "declining" : "stable"}
                  </span>
                </td>
                <td
                  style={{
                    fontFamily: "var(--italic)",
                    fontStyle: "italic",
                    fontSize: ".76rem",
                    color: "var(--ash)",
                  }}
                >
                  {formatDistanceToNow(p.lastDate, { addSuffix: true })}
                </td>
              </tr>
            ))}
            {progression.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "20px 0", color: "var(--ash)" }}>
                  need at least three sessions of a lift to signal a trend
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Ornament variant="star" />

      {/* §V — Strength ratios */}
      <ChapterOpener n="vi" title="Strength ratios" caption="balance checks across the big lifts" glyph="compass" />
      <p className="body-prose">
        Balance checks across the big lifts. These aren&rsquo;t scores &mdash; they&rsquo;re
        prompts for thought. Low push:pull ratios protect shoulders; low OHP:bench
        ratios flag weak overhead strength; a huge squat-deadlift gap points to the
        undertrained of the pair.
      </p>

      <div className="plate" style={{ padding: 18 }}>
        <span className="plate-n">x</span>
        <span className="plate-t">Lift : lift</span>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
            marginTop: 20,
          }}
        >
          {ratios.map((r) => (
            <RatioCard key={r.label} row={r} />
          ))}
        </div>
      </div>

      <Ornament variant="hollow" />

      {/* §VI — Frequency + Recovery */}
      <ChapterOpener n="vii" title="Frequency &amp; recovery" caption="how often each muscle is touched · cadence and rest" glyph="chaplet" />
      <p className="body-prose">
        Most muscles respond best when trained at least twice a week. The table below
        shows how often each major group is being touched. Alongside, the rhythm of
        your rest days and the longest current training streak.
      </p>

      <div
        className="plate-grid"
        style={{ gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)" }}
      >
        <div className="plate" style={{ padding: 18 }}>
          <span className="plate-n">xi</span>
          <span className="plate-t">Weekly frequency per muscle</span>
          <table className="set-table" style={{ marginTop: 22 }}>
            <thead>
              <tr>
                <th>muscle</th>
                <th style={{ textAlign: "right" }}>last 7d</th>
                <th style={{ textAlign: "right" }}>weekly avg</th>
                <th>status</th>
              </tr>
            </thead>
            <tbody>
              {frequency.map((f) => (
                <FrequencyRowDisplay key={f.group} row={f} />
              ))}
            </tbody>
          </table>
        </div>

        <div className="plate" style={{ padding: 18 }}>
          <span className="plate-n">xii</span>
          <span className="plate-t">Rest &amp; cadence</span>
          <div style={{ marginTop: 22 }}>
            <RecoveryStat
              label="avg sessions / week"
              value={recovery.avgSessionsPerWeek.toString()}
              sub="last 28 days"
            />
            <RecoveryStat
              label="rest days, last 7"
              value={recovery.restDaysLast7.toString()}
              sub={recovery.restDaysLast7 < 2 ? "low — consider a rest day" : ""}
              warn={recovery.restDaysLast7 < 2}
            />
            <RecoveryStat
              label="rest days, last 28"
              value={recovery.restDaysLast28.toString()}
              sub="ideal range 8–14"
              warn={recovery.restDaysLast28 < 8}
            />
            <RecoveryStat
              label="current streak"
              value={recovery.consecutiveTrainingDays.toString()}
              sub={
                recovery.consecutiveTrainingDays > 6
                  ? "long — deload soon?"
                  : "consecutive training days"
              }
              warn={recovery.consecutiveTrainingDays > 6}
            />
          </div>
        </div>
      </div>

      <Ornament variant="diamond" />

      <div style={{ textAlign: "center", marginTop: 36 }}>
        <ColophonSeal />
        <div className="marginalia" style={{ marginTop: 4 }}>
          targets are approximate · your body is the authority
        </div>
      </div>
    </div>
  );
}

/* ─── sub-components ────────────────────────────────────────── */

function KeyLiftRowDisplay({ row }: { row: KeyLiftRow }) {
  if (!row.found) {
    return (
      <tr style={{ color: "var(--ash-light)" }}>
        <td style={{ fontStyle: "italic", fontFamily: "var(--italic)" }}>
          {row.label.toLowerCase()}
        </td>
        <td colSpan={5} style={{ textAlign: "right", color: "var(--ash)", fontStyle: "italic", fontFamily: "var(--italic)" }}>
          not yet logged
        </td>
      </tr>
    );
  }
  return (
    <tr>
      <td style={{ fontFamily: "var(--serif)", color: row.rubric ? "var(--rubric)" : "var(--ink)" }}>
        {row.label}
      </td>
      <td style={{ textAlign: "right" }}>
        <span className={row.rubric ? "rubric" : ""}>{row.e1RM} kg</span>
      </td>
      <td style={{ textAlign: "right", color: "var(--ink-light)" }}>
        {row.peakE1RM} kg
      </td>
      <td style={{ textAlign: "right", color: "var(--ink-light)" }}>
        {row.topSet ? `${row.topSet.weight} × ${row.topSet.reps}` : "—"}
      </td>
      <td style={{ textAlign: "right" }}>
        <TrendGlyph trend={row.trend === "new" ? "flat" : row.trend === "none" ? "flat" : row.trend} />
        {row.deltaPct != null && (
          <span
            style={{
              marginLeft: 6,
              color:
                row.trend === "up"
                  ? "var(--rubric)"
                  : row.trend === "down"
                    ? "var(--ash)"
                    : "var(--ink-light)",
            }}
          >
            {row.deltaPct > 0 ? "+" : ""}
            {row.deltaPct}%
          </span>
        )}
      </td>
      <td
        style={{
          fontFamily: "var(--italic)",
          fontStyle: "italic",
          fontSize: ".76rem",
          color: "var(--ash)",
        }}
      >
        {row.lastSessionDate
          ? formatDistanceToNow(row.lastSessionDate, { addSuffix: true })
          : "—"}
      </td>
    </tr>
  );
}

function VolumeRow({ row }: { row: MuscleVolumeRow }) {
  const glyph = VOLUME_STATUS_GLYPH[row.status];
  const color = VOLUME_STATUS_COLOR[row.status];
  return (
    <tr>
      <td style={{ fontFamily: "var(--serif)" }}>{row.label}</td>
      <td style={{ textAlign: "right" }}>
        <span style={{ color }}>{row.lastWeek}</span>
      </td>
      <td style={{ textAlign: "right", color: "var(--ink-light)" }}>
        {row.fourWeekAvg}
      </td>
      <td style={{ color: "var(--ash)", fontFamily: "var(--mono)", fontSize: ".76rem" }}>
        {row.mavLow}–{row.mavHigh}{" "}
        <span style={{ color: "var(--ash-light)", fontStyle: "italic", fontFamily: "var(--italic)" }}>
          (mev {row.mev} · mrv {row.mrv})
        </span>
      </td>
      <td style={{ textAlign: "right", color }}>
        <span style={{ marginRight: 4 }}>{glyph}</span>
        <span
          style={{
            fontFamily: "var(--italic)",
            fontStyle: "italic",
            fontSize: ".76rem",
          }}
        >
          {VOLUME_STATUS_LABEL[row.status]}
        </span>
      </td>
    </tr>
  );
}

function FrequencyRowDisplay({ row }: { row: FrequencyRow }) {
  const color =
    row.status === "low"
      ? "var(--ash)"
      : row.status === "ample"
        ? "var(--rubric)"
        : "var(--ink-light)";
  const label =
    row.status === "low"
      ? "under 2× / wk"
      : row.status === "ample"
        ? "well covered"
        : "adequate";
  return (
    <tr>
      <td style={{ fontFamily: "var(--serif)" }}>{row.label}</td>
      <td style={{ textAlign: "right" }}>{row.sessionsLast7}</td>
      <td style={{ textAlign: "right", color }}>{row.weeklyFrequency}×</td>
      <td style={{ fontFamily: "var(--italic)", fontStyle: "italic", color }}>
        {label}
      </td>
    </tr>
  );
}

function RatioCard({ row }: { row: RatioRow }) {
  const color =
    row.status === "ideal"
      ? "var(--rubric)"
      : row.status === "unknown"
        ? "var(--ash-light)"
        : "var(--ash)";
  return (
    <div
      style={{
        padding: 16,
        border: "1px solid var(--rule)",
        background: "var(--paper-warm)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--display)",
          fontVariant: "small-caps",
          fontSize: ".6rem",
          letterSpacing: ".16em",
          color: "var(--ash)",
          marginBottom: 4,
        }}
      >
        {row.label}
      </div>
      <div
        style={{
          fontFamily: "var(--italic)",
          fontStyle: "italic",
          fontSize: ".78rem",
          color: "var(--ink-light)",
          marginBottom: 10,
        }}
      >
        {row.numerator} &nbsp;:&nbsp; {row.denominator}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 14,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: "1.6rem",
            color,
            letterSpacing: "-.02em",
          }}
        >
          {row.ratio != null ? row.ratio.toFixed(2) : "—"}
        </div>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: ".72rem",
            color: "var(--ash)",
          }}
        >
          target {row.ideal}
        </div>
      </div>
      <div
        style={{
          fontFamily: "var(--italic)",
          fontStyle: "italic",
          fontSize: ".78rem",
          color: "var(--ash)",
          lineHeight: 1.5,
        }}
      >
        {row.note}
      </div>
    </div>
  );
}

function RecoveryStat({
  label,
  value,
  sub,
  warn,
}: {
  label: string;
  value: string;
  sub?: string;
  warn?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: "1px solid var(--rule-soft)",
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "var(--display)",
            fontVariant: "small-caps",
            fontSize: ".58rem",
            letterSpacing: ".14em",
            color: "var(--ash)",
          }}
        >
          {label}
        </div>
        {sub && (
          <div
            style={{
              fontFamily: "var(--italic)",
              fontStyle: "italic",
              fontSize: ".72rem",
              color: warn ? "var(--rubric)" : "var(--ash-light)",
              marginTop: 1,
            }}
          >
            {sub}
          </div>
        )}
      </div>
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: "1.25rem",
          color: warn ? "var(--rubric)" : "var(--ink)",
          fontVariantNumeric: "oldstyle-nums tabular-nums",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function TrendGlyph({ trend }: { trend: "up" | "flat" | "down" }) {
  if (trend === "up") return <span style={{ color: "var(--rubric)" }}>↗</span>;
  if (trend === "down") return <span style={{ color: "var(--ash)" }}>↘</span>;
  return <span style={{ color: "var(--ink-light)" }}>→</span>;
}

const VOLUME_STATUS_GLYPH: Record<MuscleVolumeRow["status"], string> = {
  below: "◯",
  mev: "◐",
  mav: "●",
  above: "◆",
};
const VOLUME_STATUS_COLOR: Record<MuscleVolumeRow["status"], string> = {
  below: "var(--ash)",
  mev: "var(--ink-light)",
  mav: "var(--rubric)",
  above: "var(--rubric)",
};
const VOLUME_STATUS_LABEL: Record<MuscleVolumeRow["status"], string> = {
  below: "below mev",
  mev: "at mev",
  mav: "in mav",
  above: "above mrv",
};

const ACWR_NOTE: Record<"undertrained" | "sweet" | "caution" | "spike", string> = {
  undertrained:
    "Acute load well under chronic. Fine for a planned deload; otherwise you may be detraining. Ease back in without a jump.",
  sweet: "Acute load matches what your body has been preparing for. Keep consistent; progress comes from this zone.",
  caution:
    "Acute load is starting to outpace chronic capacity. Watch sleep, joints, form; one more hard week and you're in the spike zone.",
  spike:
    "Acute load has spiked well above chronic. Injury and overtraining risk rises here. Consider a lighter week or two sessions of deload.",
};
