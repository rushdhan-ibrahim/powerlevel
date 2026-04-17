import { notFound } from "next/navigation";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { prisma } from "@/lib/db";
import {
  bestE1RM,
  liftKey,
  workoutTonnage,
  workoutWorkingSets,
} from "@/lib/insights";
import { DeleteWorkoutButton } from "@/components/DeleteWorkoutButton";
import { Headpiece } from "@/components/manuscript/Headpiece";
import { Ornament } from "@/components/manuscript/Ornament";
import { ColophonSeal } from "@/components/manuscript/Seal";
import { SessionNotebook } from "@/components/manuscript/SessionNotebook";
import { SetTable } from "@/components/SetTable";
import { roman } from "@/lib/manuscript";

export const dynamic = "force-dynamic";

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workout = await prisma.workout.findUnique({
    where: { id },
    omit: {
      // detail page shows the facsimile + structured log but not the
      // raw Gemini parse — drop the biggest redundant field
      rawParseJson: true,
      createdAt: true,
      updatedAt: true,
    },
    include: {
      exercises: {
        orderBy: { order: "asc" },
        include: { sets: { orderBy: { order: "asc" } } },
      },
      pages: { orderBy: { order: "asc" } },
      sessionNotes: { orderBy: { order: "asc" } },
    },
  });
  if (!workout) notFound();

  const row = {
    id: workout.id,
    date: workout.date,
    title: workout.title,
    exercises: workout.exercises.map((e) => ({
      id: e.id,
      name: e.name,
      normalizedName: e.normalizedName,
      canonicalSlug: e.canonicalSlug,
      category: e.category,
      muscleGroup: e.muscleGroup,
      sets: e.sets,
    })),
  };
  const tonnage = Math.round(workoutTonnage(row));
  const sets = workoutWorkingSets(row);

  const pages = workout.pages.length > 0
    ? workout.pages
    : workout.imagePath
      ? [{ id: "legacy", imagePath: workout.imagePath, order: 0 }]
      : [];

  return (
    <div>
      {/* BREADCRUMB ROW */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 18,
          paddingBottom: 10,
          borderBottom: "1px solid var(--rule-soft)",
        }}
      >
        <Link
          href="/workouts"
          style={{
            fontFamily: "var(--display)",
            fontVariant: "small-caps",
            fontSize: ".58rem",
            letterSpacing: ".18em",
            color: "var(--ash)",
            textDecoration: "none",
          }}
        >
          ← all workouts
        </Link>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <Link
            href={`/workouts/${workout.id}/edit`}
            style={{
              fontFamily: "var(--display)",
              fontVariant: "small-caps",
              fontSize: ".58rem",
              letterSpacing: ".18em",
              color: "var(--ash)",
              textDecoration: "none",
              borderBottom: "1px solid var(--ash-light)",
              paddingBottom: 2,
            }}
          >
            edit
          </Link>
          <DeleteWorkoutButton id={workout.id} />
        </div>
      </div>

      {/* TITLE */}
      <div style={{ textAlign: "center" }}>
        <div className="date-stamp">
          {format(workout.date, "EEEE, MMMM d, yyyy")}
        </div>
        <h1 className="h-display" style={{ fontSize: "1.7rem", marginTop: 6 }}>
          {workout.title ?? "Untitled workout"}
        </h1>
        <div className="subtitle">
          {formatDistanceToNow(workout.date, { addSuffix: true })} &middot;{" "}
          {workout.exercises.length} exercises &middot; {sets} working sets &middot;{" "}
          <span className="numerals" style={{ fontStyle: "normal" }}>
            {tonnage.toLocaleString()}
          </span>{" "}
          kg
        </div>
      </div>

      <Headpiece />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: pages.length > 0 ? "minmax(0, 1fr) minmax(0, 1.1fr)" : "1fr",
          gap: 32,
        }}
      >
        {pages.length > 0 && (
          <div style={{ position: "sticky", top: 16, alignSelf: "start" }}>
            <div className="plate" style={{ padding: 14 }}>
              <span className="plate-n">{pages.length > 1 ? `${pages.length} pp.` : "src."}</span>
              <span className="plate-t">
                {pages.length > 1 ? "source pages" : "source page"}
              </span>
              <div
                style={{
                  marginTop: 22,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {pages.map((p, i) => (
                  <div key={p.id ?? i} className="facsimile" style={{ width: "100%" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/${p.imagePath}`} alt={`Source page ${i + 1}`} />
                  </div>
                ))}
              </div>
              <div className="facsimile-caption">
                read by gemini-3.1-pro
                {workout.parseTokensIn && (
                  <>
                    {" "}&middot; <span className="numerals" style={{ fontStyle: "normal" }}>{workout.parseTokensIn}</span> in /{" "}
                    <span className="numerals" style={{ fontStyle: "normal" }}>{workout.parseTokensOut}</span> out
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div>
          {(workout.sessionNotes.length > 0 || workout.notes) && (
            <SessionNotebook
              notes={workout.sessionNotes}
              fallback={workout.sessionNotes.length === 0 ? workout.notes : null}
            />
          )}

          {workout.exercises.map((ex, idx) => {
            const e1RM = bestE1RM(ex.sets, ex.category);
            const idxRoman = roman(idx + 1).toLowerCase();
            const linkKey = liftKey(ex);
            return (
              <div key={ex.id} className="plate" style={{ padding: 18, marginBottom: 14 }}>
                <span className="plate-n">{idxRoman}</span>
                <span className="plate-t">{ex.muscleGroup}</span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    marginTop: 18,
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <Link
                      href={`/exercises/${encodeURIComponent(linkKey)}`}
                      className="q-link"
                      style={{
                        fontFamily: "var(--serif)",
                        fontSize: "1.05rem",
                        fontWeight: 500,
                        color: "var(--ink)",
                        borderBottom: "none",
                      }}
                    >
                      {ex.name}
                    </Link>
                    {ex.variation && (
                      <span
                        style={{
                          marginLeft: 10,
                          fontFamily: "var(--italic)",
                          fontStyle: "italic",
                          fontSize: ".82rem",
                          color: "var(--rubric)",
                        }}
                      >
                        — {ex.variation}
                      </span>
                    )}
                  </div>
                  {e1RM > 0 && (
                    <div style={{ textAlign: "right" }}>
                      <div
                        className="numerals"
                        style={{
                          fontSize: "1.15rem",
                          color: "var(--rubric)",
                          fontWeight: 500,
                          letterSpacing: "-.01em",
                        }}
                      >
                        {e1RM} kg
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--italic)",
                          fontStyle: "italic",
                          fontSize: ".66rem",
                          color: "var(--ash)",
                        }}
                      >
                        est. 1RM
                      </div>
                    </div>
                  )}
                </div>

                <SetTable sets={ex.sets} category={ex.category} />

                {ex.notes && (
                  <div
                    style={{
                      marginTop: 8,
                      fontFamily: "var(--italic)",
                      fontStyle: "italic",
                      fontSize: ".78rem",
                      color: "var(--ash)",
                    }}
                  >
                    &mdash; {ex.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Ornament variant="trinity" />

      <div style={{ textAlign: "center", marginTop: 28 }}>
        <ColophonSeal />
        <div className="marginalia" style={{ marginTop: 4 }}>
          saved to your log
        </div>
      </div>
    </div>
  );
}
