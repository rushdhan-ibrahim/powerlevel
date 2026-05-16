/**
 * §VII PILGRIMAGE — the running insights section, appended to the
 * existing /insights chapter. Self-fetches via loadPilgrimageInsights().
 * Renders five plates in a deliberate reading order:
 *
 *   vii.i   THE STATIONS FRIEZE — the year as stained glass
 *   vii.ii  THE ANATOMICAL HEART — cardiovascular adaptations
 *   vii.iii THE VITRUVIAN RUNNER — running tissue zones on a body
 *   vii.iv  THE RELIQUARY — 19 tissues as a reliquary cabinet
 *   vii.v   THE WAYFARING MAP — every road, ink on paper
 *   vii.vi  THE CADENCE PENDULUMS — recent runs as a metronome choir
 */
import { ChapterOpener } from "@/components/manuscript/ChapterOpener";
import { Plate } from "@/components/manuscript/Plate";
import { Principle } from "@/components/manuscript/Principle";
import { Ornament } from "@/components/manuscript/Ornament";
import { Reliquary } from "@/components/manuscript/plates/Reliquary";
import { VitruvianRunner } from "@/components/manuscript/plates/VitruvianRunner";
import { AnatomicalHeart } from "@/components/manuscript/plates/AnatomicalHeart";
import { StationsFrieze } from "@/components/manuscript/plates/StationsFrieze";
import { WayfaringMap } from "@/components/manuscript/plates/WayfaringMap";
import { CadencePendulums } from "@/components/manuscript/plates/CadencePendulums";
import { loadPilgrimageInsights } from "@/lib/pilgrimage/insights";
import { KNOWN_INJURIES } from "@/lib/pilgrimage/injuries";
import { roman } from "@/lib/manuscript";

export async function InsightsPilgrimage({ sectionN }: { sectionN: number }) {
  const o = await loadPilgrimageInsights();
  const r = roman(sectionN).toLowerCase();

  if (!o.hasAny) {
    return (
      <section style={{ marginTop: 56 }}>
        <ChapterOpener
          n={r}
          title="The Pilgrimage"
          caption="when runs are logged, the body opens its own plates."
          glyph="reliquary"
        />
        <Principle label="not yet underway">
          The Reliquary, the Wayfaring Map and the Cadence Pendulums fill themselves
          from running data. Once Garmin syncs (or you import FIT files via the
          backfill script), this section comes alive.
        </Principle>
      </section>
    );
  }

  const activeInjuryTissues = KNOWN_INJURIES
    .filter((i) => i.status === "active" || i.status === "managing")
    .flatMap((i) => i.tissueIds);

  return (
    <section style={{ marginTop: 56 }}>
      <ChapterOpener
        n={r}
        title="The Pilgrimage"
        caption="the running half — heart, tissues, roads, rhythm."
        glyph="reliquary"
      />

      {/* The year, as stained glass. Sets the temporal frame for everything
          beneath it — readers see at a glance which phase they're in. */}
      <Plate
        numeral={`${r}.i`}
        title="The stations frieze"
        caption="every week of the journey, panelled as stained glass. build, maintain, detrain, ramp, off."
      >
        <StationsFrieze bands={o.phaseBands} />
      </Plate>

      <Ornament variant="diamond" />

      {/* CARDIOVASCULAR — the heart at the centre */}
      <Plate
        numeral={`${r}.ii`}
        title="The anatomical heart"
        caption="pulses at your recent average heart rate. four satellite arcs report the cardiovascular adaptations."
      >
        <AnatomicalHeart heart={o.heart} />
      </Plate>

      <Ornament variant="diamond" />

      {/* THE BODY + THE RELIQUARY — companion plates in a single row */}
      <div className="plate-grid">
        <Plate
          numeral={`${r}.iii`}
          title="The vitruvian runner"
          caption="running-specific tissue zones. injured tissues pulse rubric; load fullness graduates from quiet ink to bright rubric."
        >
          <VitruvianRunner snapshots={o.tissues} activeInjuryTissues={activeInjuryTissues} />
        </Plate>

        <Plate
          numeral={`${r}.iv`}
          title="The reliquary"
          caption="nineteen tissues, each a relic in its niche. tap a niche for the snapshot, half-life and rationale."
        >
          <Reliquary snapshots={o.tissues} activeInjuryTissues={activeInjuryTissues} />
        </Plate>
      </div>

      <Ornament variant="trinity" />

      {/* Roads & rhythm */}
      <Plate
        numeral={`${r}.v`}
        title="The wayfaring map"
        caption="every gps line, overlaid. faint roads walked once, dark roads walked many times. the freshest run is rubric."
      >
        <WayfaringMap paths={o.paths} />
      </Plate>

      <Ornament variant="diamond" />

      <Plate
        numeral={`${r}.vi`}
        title="The cadence pendulums"
        caption="one pendulum per recent run. faster swing = higher cadence. the dashed rule is the canonical 180 spm."
      >
        <CadencePendulums samples={o.cadences} />
      </Plate>
    </section>
  );
}
