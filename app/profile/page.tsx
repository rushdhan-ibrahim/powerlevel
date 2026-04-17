import { prisma } from "@/lib/db";
import { ProfileForm } from "@/components/ProfileForm";
import { Ornament } from "@/components/manuscript/Ornament";
import { PageIncipit } from "@/components/manuscript/PageIncipit";
import { Initial } from "@/components/manuscript/Initial";
import { IlluminatedStat } from "@/components/manuscript/IlluminatedStat";
import { Plate } from "@/components/manuscript/Plate";
import { ChapterOpener } from "@/components/manuscript/ChapterOpener";
import { ColophonSeal } from "@/components/manuscript/Seal";
import { InkLineChart } from "@/components/manuscript/charts/InkLineChart";
import { loadProfile, profileDerived } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [profile, derivedProfile] = await Promise.all([
    prisma.profile.findUnique({ where: { id: "singleton" } }),
    loadProfile().then((p) => ({ p, d: profileDerived(p) })),
  ]);
  // bodyweight history pulled from every workout that recorded one
  const bwHistory = await prisma.workout.findMany({
    where: { bodyweight: { not: null } },
    orderBy: { date: "asc" },
    select: { bodyweight: true, date: true },
  });
  const latestBWRow = bwHistory[bwHistory.length - 1] ?? null;

  const bwSeries = bwHistory.map((w) => ({
    x: w.date,
    y: w.bodyweight ?? 0,
  }));

  const { p, d } = derivedProfile;
  const bmiBand = bmiClass(d.bmi);

  return (
    <div>
      <PageIncipit
        eyebrow="Your Figure"
        title="Profile"
        meta="height · bodyweight · goal — unlocks bodyweight-relative analysis"
      />
      <p className="body-prose">
        <Initial letter="A" />
        few numbers about you help powerlevel draw better conclusions: bodyweight gives
        every lift a ratio (bench × bodyweight, squat × bodyweight) that separates
        raw strength from relative strength; height unlocks BMI and contextualises
        body composition over time; sex and age are needed to classify each lift
        against published strength standards (novice → beginner → intermediate →
        advanced → elite). None of this is required — leave anything blank and the
        app will simply skip the related analyses.
      </p>
      <Ornament variant="diamond" />

      <ProfileForm
        initial={profile}
        latestBW={latestBWRow?.bodyweight ?? null}
        latestBWDate={latestBWRow?.date?.toISOString() ?? null}
      />

      {(p.bodyweightKg || p.heightCm || d.age != null) && (
        <>
          <ChapterOpener
            n="ii"
            title="Derived"
            caption="numbers your figure unlocks"
            glyph="compass"
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: 16,
              marginBottom: 16,
            }}
          >
            {p.bodyweightKg != null && (
              <IlluminatedStat
                label="bodyweight"
                value={p.bodyweightKg.toString()}
                unit="kg"
              />
            )}
            {p.heightCm != null && (
              <IlluminatedStat
                label="height"
                value={p.heightCm.toString()}
                unit="cm"
              />
            )}
            {d.bmi != null && (
              <IlluminatedStat
                label="BMI"
                value={d.bmi.toString()}
                unit={bmiBand}
              />
            )}
            {d.age != null && (
              <IlluminatedStat
                label="age"
                value={d.age.toString()}
                unit={d.age === 1 ? "year" : "years"}
              />
            )}
          </div>
        </>
      )}

      {bwSeries.length >= 2 && (
        <Plate
          numeral="iii"
          title="Bodyweight over time"
          caption={`${bwSeries.length} weigh-ins from your workout log`}
        >
          <InkLineChart
            series={bwSeries}
            yLabel="kg"
            yUnit="kg"
            height={220}
          />
        </Plate>
      )}

      <Ornament variant="trinity" />

      <div style={{ textAlign: "center", marginTop: 28 }}>
        <ColophonSeal />
        <div className="marginalia" style={{ marginTop: 4 }}>
          your figures stay on this device; nothing leaves the codex
        </div>
      </div>
    </div>
  );
}

function bmiClass(bmi: number | null): string {
  if (bmi == null) return "—";
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "healthy range";
  if (bmi < 30) return "overweight";
  return "obese range";
}
