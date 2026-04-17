import { format } from "date-fns";
import { WorkoutEditor } from "@/components/WorkoutEditor";
import { PageIncipit } from "@/components/manuscript/PageIncipit";
import { Initial } from "@/components/manuscript/Initial";
import { Ornament } from "@/components/manuscript/Ornament";
import type { ParsedWorkout } from "@/lib/schema";

export const metadata = { title: "New workout · Powerlevel" };

export default function NewWorkoutPage() {
  const blank: ParsedWorkout = {
    date: format(new Date(), "yyyy-MM-dd"),
    title: null,
    bodyweight: null,
    durationMin: null,
    notes: null,
    sessionNotes: [],
    exercises: [
      {
        name: "",
        normalizedName: "",
        canonicalSlug: null,
        category: "weighted_reps",
        pattern: null,
        variation: null,
        muscleGroup: "other",
        notes: null,
        sets: [
          {
            weight: null,
            weightUnit: "kg",
            reps: null,
            durationSec: null,
            distanceM: null,
            rpe: null,
            isWarmup: false,
            isFailure: false,
            notes: null,
          },
        ],
      },
    ],
    confidence: "high",
    warnings: [],
  };

  return (
    <div>
      <PageIncipit
        eyebrow="A new entry"
        title="New workout"
        meta="enter a session by hand · no photo required"
      />

      <p className="body-prose">
        <Initial letter="N" />
        ot every session needs a photograph. Type the lifts and sets directly below;
        each exercise gets its own block, and you can add as many as you need. Use
        &ldquo;add an exercise&rdquo; at the bottom for each new movement; everything
        else (date, bodyweight, notes) lives in the panels above.
      </p>

      <Ornament variant="diamond" />

      <WorkoutEditor initial={blank} imagePaths={[]} />
    </div>
  );
}
