import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  consistencyGrid,
  muscleGroupVolume,
  prsByMonth,
  recentPRs,
  topExercisesByFrequency,
  weeklyTonnage,
  workoutTonnage,
  type WorkoutRow,
} from "@/lib/insights";
import { InkLineChart } from "@/components/manuscript/charts/InkLineChart";
import { Headpiece } from "@/components/manuscript/Headpiece";
import { Ornament } from "@/components/manuscript/Ornament";
import { Initial } from "@/components/manuscript/Initial";
import { ChapterOpener } from "@/components/manuscript/ChapterOpener";
import { PageIncipit } from "@/components/manuscript/PageIncipit";
import { Plate } from "@/components/manuscript/Plate";
import { Catalog } from "@/components/manuscript/Catalog";
import { Compass } from "@/components/manuscript/plates/Compass";
import { Vesica } from "@/components/manuscript/plates/Vesica";
import { RoseMuscle } from "@/components/manuscript/plates/RoseMuscle";
import { MemoryField } from "@/components/manuscript/plates/MemoryField";
import { PendulumChoir } from "@/components/manuscript/plates/PendulumChoir";
import { Chaplet } from "@/components/manuscript/plates/Chaplet";
import { PilgrimStar } from "@/components/manuscript/plates/PilgrimStar";
import { Phyllotaxis } from "@/components/manuscript/plates/Phyllotaxis";
import { YearHeatmap } from "@/components/manuscript/plates/YearHeatmap";
import { ChapterPager } from "@/components/manuscript/ChapterPager";
import { format } from "date-fns";
import { roman } from "@/lib/manuscript";

export const revalidate = 60;

export default async function InsightsPage() {
  const raw = await prisma.workout.findMany({
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
        <PageIncipit eyebrow="The Plates" title="Illuminations" meta="add a workout to unlock the plates" />
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Vesica size={140} />
          <p className="body-prose" style={{ maxWidth: 420, margin: "20px auto" }}>
            The plates will start drawing themselves once the first workout is logged.
          </p>
          <Link href="/upload" className="btn btn-rubric btn-quill">
            add your first workout
          </Link>
        </div>
      </div>
    );
  }

  const weekly24 = weeklyTonnage(workouts, 24);
  const muscle = muscleGroupVolume(workouts, 28);
  const heatmap = consistencyGrid(workouts, 26);
  const yearGrid = consistencyGrid(workouts, 53);
  const tonnageByDate = new Map<string, number>();
  for (const w of workouts) {
    const k = format(w.date, "yyyy-MM-dd");
    tonnageByDate.set(k, (tonnageByDate.get(k) ?? 0) + workoutTonnage(w));
  }
  const memoryCells = heatmap.map((c) => ({
    ...c,
    tonnage: tonnageByDate.get(c.date) ?? 0,
  }));
  const yearCells = yearGrid
    .filter((c) => c.count >= 0) // drop future days
    .map((c) => ({
      date: c.date,
      tonnage: tonnageByDate.get(c.date) ?? 0,
      sessions: c.count,
    }));
  const topExercises = topExercisesByFrequency(workouts, 24);
  const liftsForChaplet = topExercises.map((ex) => ({
    normalizedName: ex.normalizedName,
    displayName: ex.displayName,
    sessions: ex.sessions,
    bestE1RM: ex.bestE1RM,
    daysSinceLast: Math.floor(
      (Date.now() - ex.lastDate.getTime()) / (1000 * 60 * 60 * 24),
    ),
  }));
  const prs = recentPRs(workouts, 365);
  const prFrequency = prsByMonth(workouts, 12);

  return (
    <div>
      <PageIncipit
        eyebrow="The Plates"
        title="Illuminations"
        meta="the contemplative view · drawn from your training"
      />

      <p className="body-prose">
        <Initial letter="E" />
        ach panel is a different way of seeing the same data — one that rewards looking
        rather than reading. If you want coaching numbers, see{" "}
        <Link href="/ledger" className="q-link">
          the ledger
        </Link>
        ; this is the view where you watch the pattern emerge.
      </p>

      <Ornament variant="diamond" />

      <ChapterPager
        labels={[
          { n: "i",   title: "Records" },
          { n: "ii",  title: "Balance & volume" },
          { n: "iii", title: "Activity over time" },
          { n: "iv",  title: "Your repertoire" },
          { n: "v",   title: "All exercises" },
        ]}
      >
        {/* §I Records */}
        <section>
          <ChapterOpener n="i" title="Records" caption="every PR set in this codex, brightest at the freshest" glyph="rose" />
          <div className="plate-grid">
            <Plate numeral="i" title="Records" caption="every PR set, brightest at the freshest point">
              <PilgrimStar prs={prs} />
            </Plate>
            <Plate numeral="ia" title="PRs per month" caption="how often you broke new ground · last 12 months">
              <InkLineChart
                series={prFrequency}
                yLabel="PRs"
                yUnit=""
                allowZeros
                height={220}
                emptyLabel="no PRs to chart yet"
              />
            </Plate>
          </div>
        </section>

        {/* §II Balance & volume */}
        <section>
          <ChapterOpener n="ii" title="Balance &amp; volume" caption="working sets by muscle group · weight lifted per week" glyph="rose" />
          <div className="plate-grid">
            <Plate numeral="ii" title="Muscle balance" caption="working sets by muscle group · last 28 days">
              <RoseMuscle data={muscle} />
            </Plate>
            <Plate numeral="iii" title="Weekly volume" caption="kg lifted per week · last 24 weeks">
              <PendulumChoir data={weekly24} />
            </Plate>
          </div>
        </section>

        {/* §III Activity */}
        <section>
          <ChapterOpener n="iii" title="Activity over time" caption="every day of the last twenty-six weeks" glyph="hourglass" />
          <Plate numeral="iv" title="Activity" caption="every day of the last 26 weeks · bead size scales with weight lifted">
            <MemoryField cells={memoryCells} weeks={26} />
          </Plate>
          <Plate numeral="iva" title="Year at a glance" caption="every day of the last 12 months · cell shading scales with weight lifted">
            <YearHeatmap cells={yearCells} />
          </Plate>
        </section>

        {/* §IV Repertoire */}
        <section>
          <ChapterOpener n="iv" title="Your repertoire" caption="frequent lifts in motion · the seed grows" glyph="chaplet" />
          <div className="plate-grid">
            <Plate numeral="v" title="Frequent lifts" caption="hollow beads are cold; larger beads mark milestones">
              <Chaplet lifts={liftsForChaplet} />
            </Plate>
            <Plate numeral="vi" title="Growth" caption={`${workouts.length} workouts arranged by φ`}>
              <Phyllotaxis count={workouts.length} />
            </Plate>
          </div>
        </section>

        {/* §V All exercises */}
        <section>
          <ChapterOpener n="v" title="All exercises" caption="every lift the codex has read, ranked by frequency" glyph="seed" />
          <p className="body-prose">
            Every exercise Powerlevel has seen, ranked by how often you do it. Each entry
            opens to a full history of that lift &mdash; orbital field, progression chain,
            session table.
          </p>
          <Catalog
            entries={topExercises.map((ex, i) => ({
              num: roman(i + 1).toLowerCase(),
              name: ex.displayName,
              desc: `${ex.sessions} session${ex.sessions === 1 ? "" : "s"} · last on ${format(ex.lastDate, "MMM d")}`,
              numerals:
                ex.bestE1RM > 0 ? (
                  <span className="rubric numerals">{ex.bestE1RM} kg</span>
                ) : (
                  <span className="numerals">—</span>
                ),
              href: `/exercises/${encodeURIComponent(ex.normalizedName)}`,
            }))}
          />
        </section>
      </ChapterPager>

      <Ornament variant="diamond" />

      <div style={{ textAlign: "center", marginTop: 36 }}>
        <Compass size={88} />
        <div className="marginalia" style={{ marginTop: 4 }}>
          updated each time you log a workout
        </div>
      </div>
    </div>
  );
}
