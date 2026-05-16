import Link from "next/link";
import { prisma } from "@/lib/db";
import { workoutTonnage, workoutWorkingSets, type WorkoutRow } from "@/lib/insights";
import { Ornament } from "@/components/manuscript/Ornament";
import { Initial } from "@/components/manuscript/Initial";
import { Compass } from "@/components/manuscript/plates/Compass";
import { PageIncipit } from "@/components/manuscript/PageIncipit";
import { HistoryTimeline, type HistoryItem } from "@/components/HistoryTimeline";

export const revalidate = 60;

async function loadWorkouts() {
  return prisma.workout.findMany({
    orderBy: { date: "desc" },
    omit: {
      rawParseJson: true, parseModel: true,
      parseTokensIn: true, parseTokensOut: true,
      createdAt: true, updatedAt: true,
    },
    include: { exercises: { include: { sets: true } } },
  });
}

async function loadRuns() {
  return prisma.run.findMany({
    orderBy: { startedAtLocal: "desc" },
    select: {
      id: true, startedAtLocal: true, title: true,
      distanceM: true, durationS: true,
      avgPaceSecPerKm: true, avgHr: true,
    },
  });
}

export default async function HistoryPage() {
  const [workouts, runs] = await Promise.all([loadWorkouts(), loadRuns()]);

  if (workouts.length === 0 && runs.length === 0) {
    return (
      <div>
        <PageIncipit eyebrow="The Catalog" title="History" meta="no entries yet" />
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Compass size={140} />
          <p className="body-prose" style={{ maxWidth: 420, margin: "20px auto" }}>
            Your history will appear here once you&rsquo;ve added a workout — or once Garmin
            pulls in your first run.
          </p>
          <Link href="/upload" className="btn btn-rubric btn-quill">
            add your first workout
          </Link>
        </div>
      </div>
    );
  }

  // Build the unified HistoryItem list
  const workoutItems: HistoryItem[] = workouts.map((w) => {
    const row: WorkoutRow = {
      id: w.id, date: w.date, title: w.title,
      exercises: w.exercises.map((e) => ({
        id: e.id, name: e.name, normalizedName: e.normalizedName,
        muscleGroup: e.muscleGroup, sets: e.sets,
      })),
    };
    return {
      kind: "workout",
      id: w.id,
      date: w.date.toISOString(),
      title: w.title,
      exerciseNames: w.exercises.map((e) => e.name),
      exerciseCount: w.exercises.length,
      setCount: workoutWorkingSets(row),
      tonnage: Math.round(workoutTonnage(row)),
    };
  });

  const runItems: HistoryItem[] = runs.map((r) => ({
    kind: "run",
    id: r.id,
    date: r.startedAtLocal.toISOString(),
    title: r.title,
    distanceKm: r.distanceM / 1000,
    durationS: r.durationS,
    avgPaceSecPerKm: r.avgPaceSecPerKm,
    avgHr: r.avgHr,
  }));

  // Merge into a single chronological timeline, newest first
  const items: HistoryItem[] = [...workoutItems, ...runItems].sort(
    (a, b) => b.date.localeCompare(a.date),
  );

  // Page-level summary stats — both halves of the chronicle in one breath
  const totalSets = workoutItems.reduce((n, w) => n + (w as Extract<HistoryItem, { kind: "workout" }>).setCount, 0);
  const totalTon  = workoutItems.reduce((n, w) => n + (w as Extract<HistoryItem, { kind: "workout" }>).tonnage, 0);
  const totalKm   = runItems.reduce((n, r) => n + (r as Extract<HistoryItem, { kind: "run" }>).distanceKm, 0);

  const paperLabel = workoutItems.length === 1 ? "paper workout" : "paper workouts";
  const runLabel   = runItems.length === 1 ? "run" : "runs";

  return (
    <div>
      <PageIncipit
        eyebrow="The Catalog"
        title="History"
        meta={[
          `${workoutItems.length} ${paperLabel}`,
          `${runItems.length} ${runLabel}`,
          `${totalSets.toLocaleString()} sets`,
          `${Math.round(totalTon).toLocaleString()} kg`,
          `${totalKm.toFixed(1)} km`,
        ].join(" · ")}
      />

      <p className="body-prose">
        <Initial letter="T" />
        his is the unified catalog — every paper workout and every run, side by side, by date. The
        scribe&rsquo;s mark beside each row tells you the kind at a glance: the open square is paper,
        the four-point star is a road walked. The filter chips on the right let you scope the
        view; the search field looks across titles and (for paper workouts) exercise names.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 18,
          marginTop: -6,
          marginBottom: 4,
        }}
      >
        <a
          href="/api/export?fmt=csv"
          download
          style={{
            fontFamily: "var(--display)", fontVariant: "small-caps",
            fontSize: ".62rem", letterSpacing: ".18em",
            color: "var(--ash)", textDecoration: "none",
            borderBottom: "1px solid var(--ash-light)", paddingBottom: 2,
          }}
        >
          export · csv
        </a>
        <a
          href="/api/export?fmt=json"
          download
          style={{
            fontFamily: "var(--display)", fontVariant: "small-caps",
            fontSize: ".62rem", letterSpacing: ".18em",
            color: "var(--ash)", textDecoration: "none",
            borderBottom: "1px solid var(--ash-light)", paddingBottom: 2,
          }}
        >
          export · json
        </a>
      </div>

      <Ornament variant="diamond" />

      <HistoryTimeline items={items} />
    </div>
  );
}
