import Link from "next/link";
import { prisma } from "@/lib/db";
import { workoutTonnage, workoutWorkingSets, type WorkoutRow } from "@/lib/insights";
import { Ornament } from "@/components/manuscript/Ornament";
import { Initial } from "@/components/manuscript/Initial";
import { Compass } from "@/components/manuscript/plates/Compass";
import { PageIncipit } from "@/components/manuscript/PageIncipit";
import {
  WorkoutsHistory,
  type WorkoutHistoryRow,
} from "@/components/WorkoutsHistory";

export const dynamic = "force-dynamic";

async function loadWorkouts() {
  return prisma.workout.findMany({
    orderBy: { date: "desc" },
    omit: {
      rawParseJson: true,
      parseModel: true,
      parseTokensIn: true,
      parseTokensOut: true,
      createdAt: true,
      updatedAt: true,
    },
    include: { exercises: { include: { sets: true } } },
  });
}

export default async function WorkoutsPage() {
  const workouts = await loadWorkouts();

  if (workouts.length === 0) {
    return (
      <div>
        <PageIncipit eyebrow="The Catalog" title="History" meta="no workouts yet" />
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Compass size={140} />
          <p className="body-prose" style={{ maxWidth: 420, margin: "20px auto" }}>
            Your history will appear here once you&rsquo;ve added a workout.
          </p>
          <Link href="/upload" className="btn btn-rubric btn-quill">
            add your first workout
          </Link>
        </div>
      </div>
    );
  }

  const rows: WorkoutHistoryRow[] = workouts.map((w) => {
    const row: WorkoutRow = {
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
    };
    return {
      id: w.id,
      date: w.date.toISOString(),
      title: w.title,
      exerciseNames: w.exercises.map((e) => e.name),
      exerciseCount: w.exercises.length,
      setCount: workoutWorkingSets(row),
      tonnage: Math.round(workoutTonnage(row)),
    };
  });

  const totalSets = rows.reduce((n, r) => n + r.setCount, 0);
  const totalTon = rows.reduce((n, r) => n + r.tonnage, 0);

  return (
    <div>
      <PageIncipit
        eyebrow="The Catalog"
        title="History"
        meta={`${rows.length} ${rows.length === 1 ? "workout" : "workouts"} · ${totalSets.toLocaleString()} sets · ${totalTon.toLocaleString()} kg`}
      />

      <p className="body-prose">
        <Initial letter="T" />
        his is your full training history. <strong>{rows.length}</strong>{" "}
        {rows.length === 1 ? "workout" : "workouts"} so far, comprising{" "}
        <strong>{totalSets.toLocaleString()}</strong> working sets and{" "}
        <strong>
          <span className="numerals">{totalTon.toLocaleString()}</span>
        </strong>{" "}
        kg lifted in total. Use the search box to find a workout by title or by any
        exercise name; otherwise scroll through, grouped by month.
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
            fontFamily: "var(--display)",
            fontVariant: "small-caps",
            fontSize: ".62rem",
            letterSpacing: ".18em",
            color: "var(--ash)",
            textDecoration: "none",
            borderBottom: "1px solid var(--ash-light)",
            paddingBottom: 2,
          }}
        >
          export · csv
        </a>
        <a
          href="/api/export?fmt=json"
          download
          style={{
            fontFamily: "var(--display)",
            fontVariant: "small-caps",
            fontSize: ".62rem",
            letterSpacing: ".18em",
            color: "var(--ash)",
            textDecoration: "none",
            borderBottom: "1px solid var(--ash-light)",
            paddingBottom: 2,
          }}
        >
          export · json
        </a>
      </div>

      <Ornament variant="diamond" />

      <WorkoutsHistory workouts={rows} />
    </div>
  );
}
