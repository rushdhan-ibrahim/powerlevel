import Link from "next/link";
import { prisma } from "@/lib/db";
import type { WorkoutRow } from "@/lib/insights";
import { TotalsClient } from "@/components/TotalsClient";
import { Headpiece } from "@/components/manuscript/Headpiece";
import { Vesica } from "@/components/manuscript/plates/Vesica";
import { PageIncipit } from "@/components/manuscript/PageIncipit";

export const revalidate = 60;

export default async function TotalsPage() {
  const raw = await prisma.workout.findMany({
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
  });

  if (raw.length === 0) {
    return (
      <div>
        <PageIncipit eyebrow="The Counter's View" title="Totals" meta="no workouts to total" />
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Vesica size={140} />
          <p className="body-prose" style={{ maxWidth: 420, margin: "20px auto" }}>
            Once you log a workout, every total &mdash; lifetime and per period &mdash; will live here.
          </p>
          <Link href="/upload" className="btn btn-rubric btn-quill">
            add your first workout
          </Link>
        </div>
      </div>
    );
  }

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
      muscleGroup: e.muscleGroup,
      sets: e.sets,
    })),
  }));

  // serialise dates for the client component
  const serialised = workouts.map((w) => ({
    ...w,
    date: w.date.toISOString(),
  }));

  // freeze "today" from the server so SSR and client agree to the millisecond
  return <TotalsClient workouts={serialised} todayIso={new Date().toISOString()} />;
}
