import { prisma } from "@/lib/db";
import { Dashboard } from "@/components/Dashboard";
import { Initial } from "@/components/manuscript/Initial";
import { Headpiece } from "@/components/manuscript/Headpiece";
import { Ornament } from "@/components/manuscript/Ornament";
import { Principle } from "@/components/manuscript/Principle";
import { Seal } from "@/components/manuscript/Seal";
import Link from "next/link";

export const revalidate = 60;

export default async function Home() {
  const workoutCount = await prisma.workout.count();
  if (workoutCount > 0) return <Dashboard />;
  return <OpeningFolio />;
}

function OpeningFolio() {
  return (
    <div>
      <h1 className="h-display" style={{ fontSize: "2.4rem", textAlign: "center", marginBottom: 6 }}>
        Powerlevel
      </h1>
      <div className="subtitle">your handwritten training, read and illuminated</div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 20, marginBottom: 20 }}>
        <Seal size={140} />
      </div>

      <Headpiece />

      <p className="body-prose">
        <Initial letter="P" />
        <strong>Powerlevel turns a photo of your training journal into structured data.</strong>
        {" "}Snap any page &mdash; even messy, even shorthand &mdash; and Gemini reads every set, rep, and note. Powerlevel then tracks your lifts over time and surfaces what matters: records, stagnation, weekly volume, muscle balance, progression trends. Plain data, beautifully presented. No typing, no forms, no friction.
      </p>

      <Ornament variant="diamond" />

      <h2 className="h-section"><span className="n">§</span>How it works</h2>

      <Principle label="one &middot; photograph">
        Take a photo of a page from your journal. The scribe (Gemini 3.1 Pro, with extended reasoning) reads your handwriting and expands common shorthand &mdash; BP, RDL, RPE, BW, and the rest.
      </Principle>

      <Principle label="two &middot; review">
        Every parse opens beside the source page. Correct anything Gemini misread; every set is editable before you save. The parser flags anything it was unsure about.
      </Principle>

      <Principle label="three &middot; analyse">
        Personal records, muscle-group volume, intensity distribution, stagnation alerts, projected one-rep maxes &mdash; all computed automatically as you add workouts. Two analysis surfaces: <em>Plates</em> for the contemplative view, <em>Ledger</em> for the practical one.
      </Principle>

      <Ornament variant="star" />

      <div style={{ textAlign: "center", marginTop: 36 }}>
        <Link href="/upload" className="btn btn-rubric btn-quill">
          add your first workout
        </Link>
      </div>

      <Ornament variant="hollow" />

      <p className="marginalia" style={{ textAlign: "center", marginTop: 16 }}>
        the page reads itself
      </p>
    </div>
  );
}
