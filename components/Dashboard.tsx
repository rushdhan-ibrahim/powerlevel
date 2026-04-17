import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { prisma } from "@/lib/db";
import { loadProfile } from "@/lib/profile";
import {
  consistencyGrid,
  currentStreak,
  muscleGroupVolume,
  notedPRDates,
  notedPRs,
  recentPRs,
  sessionsInLastNDays,
  stagnantLifts,
  tonnageInLastNDays,
  topExercisesByFrequency,
  totalsAcross,
  weeklyTonnage,
  workoutTonnage,
  type WorkoutRow,
} from "@/lib/insights";
import { Initial } from "@/components/manuscript/Initial";
import { Headpiece } from "@/components/manuscript/Headpiece";
import { Ornament } from "@/components/manuscript/Ornament";
import { ChapterOpener } from "@/components/manuscript/ChapterOpener";
import { IlluminatedStat } from "@/components/manuscript/IlluminatedStat";
import { Plate } from "@/components/manuscript/Plate";
import { Catalog } from "@/components/manuscript/Catalog";
import { Rubric } from "@/components/manuscript/Rubric";
import { ColophonSeal } from "@/components/manuscript/Seal";
import { OrnamentDiamondPair, OrnamentRose, OrnamentTriad } from "@/components/manuscript/plates/Ornaments";
import { PageIncipit } from "@/components/manuscript/PageIncipit";
import { RoseMuscle } from "@/components/manuscript/plates/RoseMuscle";
import { MemoryField } from "@/components/manuscript/plates/MemoryField";
import { PendulumChoir } from "@/components/manuscript/plates/PendulumChoir";
import { Chaplet } from "@/components/manuscript/plates/Chaplet";
import { PilgrimStar } from "@/components/manuscript/plates/PilgrimStar";
import { Phyllotaxis } from "@/components/manuscript/plates/Phyllotaxis";
import { roman } from "@/lib/manuscript";

export async function Dashboard() {
  const [raw, profile] = await Promise.all([
    prisma.workout.findMany({
      orderBy: { date: "desc" },
      omit: {
        // Heavy fields nobody on the dashboard reads. rawParseJson in
        // particular can be 10-50 KB per row — skipping it turned a
        // ~1 MB query into ~50 KB.
        rawParseJson: true,
        parseModel: true,
        parseTokensIn: true,
        parseTokensOut: true,
        createdAt: true,
        updatedAt: true,
      },
      include: {
        exercises: { include: { sets: true }, orderBy: { order: "asc" } },
        sessionNotes: { orderBy: { order: "asc" } },
      },
    }),
    loadProfile(),
  ]);
  const profileNeedsAttention =
    raw.length > 0 &&
    (profile.bodyweightKg == null || profile.heightCm == null || profile.sex == null);

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

  const totals = totalsAcross(workouts);
  const streak = currentStreak(workouts);
  const last7Sessions = sessionsInLastNDays(workouts, 7);
  const prior7Sessions =
    sessionsInLastNDays(workouts, 14) - sessionsInLastNDays(workouts, 7);
  const last7Tonnage = tonnageInLastNDays(workouts, 7);
  const prior7Tonnage =
    tonnageInLastNDays(workouts, 14) - tonnageInLastNDays(workouts, 7);

  const weekly = weeklyTonnage(workouts, 12);
  const muscle = muscleGroupVolume(workouts, 28);

  const heatmap = consistencyGrid(workouts, 14);
  const tonnageByDate = new Map<string, number>();
  for (const w of workouts) {
    const k = format(w.date, "yyyy-MM-dd");
    tonnageByDate.set(k, (tonnageByDate.get(k) ?? 0) + workoutTonnage(w));
  }
  const memoryCells = heatmap.map((c) => ({
    ...c,
    tonnage: tonnageByDate.get(c.date) ?? 0,
  }));

  // session-note map → for noted PR detection
  const sessionNotesByWorkoutId = new Map<string, { body: string; kind?: string | null }[]>();
  for (const w of raw) {
    sessionNotesByWorkoutId.set(w.id, (w.sessionNotes ?? []).map((n) => ({ body: n.body, kind: n.kind })));
  }
  const noted = notedPRs(workouts, sessionNotesByWorkoutId);
  const prDateSet = notedPRDates(noted);

  const prs = recentPRs(workouts, 60);
  const stagnant = stagnantLifts(workouts);
  const topExercises = topExercisesByFrequency(workouts, 12);

  const liftsForChaplet = topExercises.map((ex) => ({
    normalizedName: ex.normalizedName,
    displayName: ex.displayName,
    sessions: ex.sessions,
    bestE1RM: ex.bestE1RM,
    daysSinceLast: Math.floor(
      (Date.now() - ex.lastDate.getTime()) / (1000 * 60 * 60 * 24),
    ),
  }));

  const tonnageDelta =
    prior7Tonnage > 0
      ? Math.round(((last7Tonnage - prior7Tonnage) / prior7Tonnage) * 100)
      : null;

  const lastWorkout = workouts[0];

  return (
    <div>
      {/* PAGE INCIPIT */}
      <PageIncipit
        eyebrow="The Codex"
        title="Your Training"
        meta={`${totals.sessions} ${totals.sessions === 1 ? "workout" : "workouts"} · ${totals.sets.toLocaleString()} sets · ${totals.tonnage.toLocaleString()} kg`}
      />

      {profileNeedsAttention && (
        <Link
          href="/profile"
          style={{
            display: "block",
            margin: "10px 0 22px",
            padding: "14px 18px",
            border: "1px solid var(--rubric)",
            background: "rgb(139 45 35 / .035)",
            color: "var(--ink)",
            textDecoration: "none",
            fontFamily: "var(--italic)",
            fontStyle: "italic",
            fontSize: ".94rem",
            lineHeight: 1.5,
          }}
        >
          <span
            style={{
              fontFamily: "var(--display)",
              fontVariant: "small-caps",
              fontSize: ".62rem",
              letterSpacing: ".18em",
              color: "var(--rubric)",
              fontStyle: "normal",
              marginRight: 10,
            }}
          >
            tip
          </span>
          Add your bodyweight, height, and sex to your{" "}
          <span style={{ borderBottom: "1px solid var(--rubric)" }}>profile</span> to
          unlock bodyweight-relative ratios and strength-class scoring on each lift.
        </Link>
      )}

      {/* PROEM */}
      <p className="body-prose">
        <Initial letter="Y" />
        our training, summarised. <strong>{totals.sessions}</strong>{" "}
        {totals.sessions === 1 ? "workout" : "workouts"} logged so far,
        across <strong>{totals.sets.toLocaleString()}</strong> working sets totalling{" "}
        <Rubric>
          <span className="numerals">{totals.tonnage.toLocaleString()}</span>
        </Rubric>{" "}
        kg of weight lifted.{" "}
        {lastWorkout && (
          <>
            Your last session &mdash;{" "}
            <Link href={`/workouts/${lastWorkout.id}`} className="q-link">
              {lastWorkout.title ?? "an untitled workout"}
            </Link>{" "}
            &mdash; was {formatDistanceToNow(lastWorkout.date, { addSuffix: true })}.{" "}
          </>
        )}
        The charts and counters below update automatically as you log more.
      </p>

      <div style={{ display: "flex", justifyContent: "center", margin: "26px 0 18px" }}>
        <OrnamentDiamondPair />
      </div>

      {/* §I HERO STATS */}
      <ChapterOpener
        n="i"
        title="At a glance"
        caption="streak · sessions this week · weight lifted this week · workouts so far"
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
          label="streak"
          value={String(streak)}
          unit={streak === 1 ? "day" : "days"}
        />
        <IlluminatedStat
          label="last 7 days"
          value={String(last7Sessions)}
          unit={last7Sessions === 1 ? "session" : "sessions"}
          sub={
            prior7Sessions > 0 && last7Sessions !== prior7Sessions
              ? `${last7Sessions - prior7Sessions > 0 ? "+" : ""}${last7Sessions - prior7Sessions} vs prior week`
              : undefined
          }
        />
        <IlluminatedStat
          label="last 7 days"
          value={last7Tonnage.toLocaleString()}
          unit="kg lifted"
          sub={
            tonnageDelta != null && tonnageDelta !== 0
              ? `${tonnageDelta > 0 ? "↑" : "↓"} ${Math.abs(tonnageDelta)}% vs prior week`
              : undefined
          }
        />
        <IlluminatedStat
          label="workouts so far"
          value={String(totals.sessions)}
          unit="lifetime"
        />
      </div>

      <div style={{ display: "flex", justifyContent: "center", margin: "32px 0 8px" }}>
        <OrnamentRose />
      </div>

      {/* §II PRs */}
      <ChapterOpener
        n="ii"
        title="Records"
        caption="every personal best, newest first"
        glyph="rose"
      />
      <p className="body-prose">
        A personal record is any time your estimated one-rep max climbed past its
        previous high for that lift. The star plots the most recent ones — brightest tip
        is freshest. The list to the right shows the same data chronologically.
      </p>

      <div className="plate-grid">
        <Plate numeral="i" title="Recent records" caption="most recent at the brightest tip">
          <PilgrimStar prs={prs} />
        </Plate>

        <div className="plate" style={{ padding: 18 }}>
          <span className="plate-n">ii</span>
          <span className="plate-t">PR log</span>
          <div style={{ marginTop: 24 }}>
            {prs.length > 0 ? (
              <Catalog
                entries={prs.slice(0, 8).map((pr, i) => ({
                  num: roman(i + 1).toLowerCase(),
                  name: (
                    <Link
                      href={`/exercises/${encodeURIComponent(pr.normalizedName)}`}
                      className="q-link"
                    >
                      {pr.exerciseName}
                    </Link>
                  ),
                  desc: format(pr.date, "MMM d"),
                  numerals: <span className="rubric numerals">{pr.e1RM} kg</span>,
                  href: undefined,
                }))}
              />
            ) : (
              <p className="marginalia" style={{ textAlign: "center", padding: "32px 0" }}>
                no records set yet
              </p>
            )}
          </div>
        </div>
      </div>

      <Ornament variant="star" />

      <div style={{ display: "flex", justifyContent: "center", margin: "32px 0 8px" }}>
        <OrnamentTriad />
      </div>

      {/* §III BALANCE */}
      <ChapterOpener
        n="iii"
        title="Balance &amp; volume"
        caption="muscle-by-muscle work · weight lifted per week"
        glyph="rose"
      />
      <p className="body-prose">
        The rose window shows how your working sets are distributed across muscle
        groups over the last four weeks. The pendulums beside it represent the last
        twelve weeks — the longer the pendulum, the more weight you lifted that week.
      </p>

      <div className="plate-grid">
        <Plate
          numeral="iii"
          title="Muscle balance"
          caption="working sets by muscle group · last 28 days"
        >
          <RoseMuscle data={muscle} />
        </Plate>

        <Plate
          numeral="iv"
          title="Weekly volume"
          caption="kg lifted per week · last 12 weeks"
        >
          <PendulumChoir data={weekly} />
        </Plate>
      </div>

      <Ornament variant="diamond" />

      {/* §IV CONSISTENCY */}
      <ChapterOpener
        n="iv"
        title="Consistency"
        caption="every session, day by day, the last fourteen weeks"
        glyph="hourglass"
      />
      <p className="body-prose">
        Each row in the field is a week. Each bead is a workout; the bead&rsquo;s size
        scales with the weight you lifted that day. The current week is highlighted in
        rubric red.
      </p>

      <Plate
        numeral="v"
        title="Activity"
        caption={
          noted.length > 0
            ? "last 14 weeks · day by day · rubric rings mark days you wrote a PR"
            : "last 14 weeks · day by day"
        }
      >
        <MemoryField cells={memoryCells} weeks={14} prDates={prDateSet} />
      </Plate>

      {noted.length > 0 && (
        <div className="plate" style={{ padding: 18, marginTop: 14 }}>
          <span className="plate-n">va</span>
          <span className="plate-t">PR notes — pulled from your handwriting</span>
          <ul style={{ listStyle: "none", margin: "22px 0 0", padding: 0 }}>
            {noted.slice(0, 8).map((pr, i) => (
              <li
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "100px 1fr auto",
                  gap: 14,
                  alignItems: "baseline",
                  padding: "10px 0",
                  borderBottom: i < Math.min(noted.length, 8) - 1 ? "1px solid var(--rule-soft)" : "none",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: ".8rem",
                    color: "var(--rubric)",
                    fontVariantNumeric: "oldstyle-nums tabular-nums",
                    letterSpacing: ".04em",
                  }}
                >
                  {format(pr.date, "MMM d")}
                </span>
                <span>
                  <Link
                    href={
                      pr.liftKey === "session_note"
                        ? `/workouts/${pr.workoutId}`
                        : `/exercises/${encodeURIComponent(pr.liftKey)}`
                    }
                    className="q-link"
                    style={{ borderBottom: "none", fontWeight: 500 }}
                  >
                    {pr.exerciseName}
                  </Link>
                  {pr.weight != null && pr.reps != null && (
                    <>
                      {" "}
                      <span
                        style={{
                          fontFamily: "var(--mono)",
                          color: "var(--ink-light)",
                          fontVariantNumeric: "oldstyle-nums tabular-nums",
                        }}
                      >
                        — {pr.weight} {pr.weightUnit ?? "kg"} × {pr.reps}
                      </span>
                    </>
                  )}
                  <span
                    style={{
                      display: "block",
                      marginTop: 2,
                      fontFamily: "var(--italic)",
                      fontStyle: "italic",
                      fontSize: ".84rem",
                      color: "var(--ash)",
                    }}
                  >
                    “{pr.noteBody}”
                  </span>
                </span>
                <span
                  style={{
                    fontFamily: "var(--display)",
                    fontVariant: "small-caps",
                    fontSize: ".58rem",
                    letterSpacing: ".14em",
                    color: "var(--ash)",
                  }}
                >
                  {pr.noteSource}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Ornament variant="hollow" />

      {/* §V THE CHAPLET + STAGNANT */}
      <ChapterOpener
        n="v"
        title="Your repertoire"
        caption="frequent lifts in motion · stagnant lifts to revisit"
        glyph="chaplet"
      />
      <p className="body-prose">
        The lifts you do most often, arranged in a circle. Filled beads were trained
        recently; hollow beads haven&rsquo;t been touched in a month or more. Lifts whose
        estimated one-rep max hasn&rsquo;t improved in several sessions are flagged on the
        right so you can revisit them.
      </p>

      <div className="plate-grid">
        <Plate numeral="vi" title="Frequent lifts" caption="hollow beads are cold; larger beads mark milestones">
          <Chaplet lifts={liftsForChaplet} />
        </Plate>

        <div className="plate" style={{ padding: 18 }}>
          <span className="plate-n">vii</span>
          <span className="plate-t">Stagnant lifts</span>
          <div style={{ marginTop: 24 }}>
            {stagnant.length > 0 ? (
              <Catalog
                entries={stagnant.slice(0, 8).map((s, i) => ({
                  num: roman(i + 1).toLowerCase(),
                  name: (
                    <Link
                      href={`/exercises/${encodeURIComponent(s.normalizedName)}`}
                      className="q-link"
                    >
                      {s.exerciseName}
                    </Link>
                  ),
                  desc: `${s.daysSincePR}d · ${s.sessionsSincePR} sessions since PR`,
                  numerals: <span className="numerals">{s.currentBest}</span>,
                }))}
              />
            ) : (
              <p className="marginalia" style={{ textAlign: "center", padding: "32px 0" }}>
                every frequent lift is still advancing
              </p>
            )}
          </div>
        </div>
      </div>

      <Ornament variant="trinity" />

      {/* §VI THE SEED */}
      <ChapterOpener
        n="vi"
        title="Growth"
        caption="every workout arranged by the golden angle of φ"
        glyph="seed"
      />
      <p className="body-prose">
        Each dot is one workout, placed at the golden angle (137.508°) — the same
        spiral that fills a sunflower head. The pattern grows tighter as you log more
        sessions; your most recent one is the highlighted seed.
      </p>

      <Plate
        numeral="viii"
        title="Seed"
        caption={`${totals.sessions} session${totals.sessions === 1 ? "" : "s"} arranged by φ`}
      >
        <Phyllotaxis count={totals.sessions} />
      </Plate>

      <Ornament variant="diamond" />

      {/* COLOPHON */}
      <div style={{ textAlign: "center", marginTop: 56 }}>
        <ColophonSeal />
        <div className="marginalia" style={{ marginTop: 6 }}>
          {totals.sessions} {totals.sessions === 1 ? "workout" : "workouts"} &middot;{" "}
          {totals.sets.toLocaleString()} sets
        </div>
      </div>
    </div>
  );
}

