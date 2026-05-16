/**
 * THE PILGRIMAGE — the running half of the Codex, rendered as a
 * chapter scrolled-past on the home page. Same component vocabulary
 * as the Manuscript chapter above it (ChapterOpener, IlluminatedStat,
 * Plate, Catalog, Ornament) — different glyphs, different data.
 *
 * Owns its own data fetch via `loadPilgrimageOverview()` so it can be
 * dropped into any page without prop-drilling.
 */
import Link from "next/link";
import { format } from "date-fns";
import { ChapterOpener } from "@/components/manuscript/ChapterOpener";
import { IlluminatedStat } from "@/components/manuscript/IlluminatedStat";
import { Plate } from "@/components/manuscript/Plate";
import { Catalog } from "@/components/manuscript/Catalog";
import { Ornament } from "@/components/manuscript/Ornament";
import { Principle } from "@/components/manuscript/Principle";
import { LoadChain } from "@/components/manuscript/plates/LoadChain";
import { WayfarerStar } from "@/components/manuscript/plates/WayfarerStar";
import { PilgrimsKalendar } from "@/components/manuscript/plates/PilgrimsKalendar";
import { loadPilgrimageOverview } from "@/lib/pilgrimage/codex";
import { roman } from "@/lib/manuscript";

const fmtPace = (s: number | null) => {
  if (s == null || !isFinite(s)) return "—";
  const m = Math.floor(s / 60);
  const r = Math.round(s - m * 60);
  return `${m}:${String(r).padStart(2, "0")}/km`;
};
const fmtDuration = (s: number) => {
  const sec = Math.round(s);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const r = sec % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${m}:${String(r).padStart(2, "0")}`;
};

export async function PilgrimageChapter({ sectionN }: { sectionN: number }) {
  const o = await loadPilgrimageOverview();

  if (!o.hasAny) {
    return (
      <section style={{ marginTop: 56 }}>
        <ChapterOpener
          n={roman(sectionN).toLowerCase()}
          title="The Pilgrimage"
          caption="when runs are logged, the road appears."
          glyph="compass"
        />
        <Principle label="not yet underway">
          The Pilgrimage chapter opens with the first imported run. Use the Settings
          page to connect Garmin, or import a folder of FIT files via the backfill
          script. From there it grows on its own.
        </Principle>
      </section>
    );
  }

  // Hero stats: race countdown + 4w volume + 4w pace + tissue snapshot teaser.
  const race = o.raceGoal;
  const recentHrLabel = o.recent4w.avgHr ? `${o.recent4w.avgHr.toFixed(0)} bpm` : "—";
  const acwrLabel =
    o.acwr.ratio == null
      ? "—"
      : o.acwr.status === "spike"
        ? "spike"
        : o.acwr.status === "caution"
          ? "caution"
          : o.acwr.status === "sweet"
            ? "sweet spot"
            : "low";

  return (
    <>
      <section style={{ marginTop: 56 }}>
        <ChapterOpener
          n={roman(sectionN).toLowerCase()}
          title="The Pilgrimage"
          caption="the running half of the chronicle — every road, every pulse, every rest."
          glyph="compass"
        />

        {/* Hero stat row — race / 4w volume / 4w pace / ACWR status */}
        <div className="stat-grid-4" style={{ marginTop: 4 }}>
          {race ? (
            <IlluminatedStat
              label="next race"
              value={race.daysToRace >= 0 ? String(race.daysToRace) : "past"}
              unit={race.daysToRace === 1 ? "day" : race.daysToRace >= 0 ? "days" : ""}
              sub={`${race.name} · ${format(race.raceDate, "EEE d MMM").toLowerCase()}`}
            />
          ) : (
            <IlluminatedStat
              label="next race"
              value="—"
              sub="set a race goal on /profile to anchor the countdown"
            />
          )}

          <IlluminatedStat
            label="last 4 weeks"
            value={o.recent4w.km.toFixed(1)}
            unit="km"
            sub={`${o.recent4w.runs} ${o.recent4w.runs === 1 ? "run" : "runs"} · ${o.recent4w.hoursPerWeekAvg.toFixed(1)} h/wk avg`}
          />

          <IlluminatedStat
            label="recent pace"
            value={fmtPace(o.recent4w.avgPaceSecPerKm)}
            sub={`avg over last 4 wk · hr ${recentHrLabel}`}
          />

          <IlluminatedStat
            label="acute / chronic"
            value={o.acwr.ratio != null ? o.acwr.ratio.toFixed(2) : "—"}
            sub={acwrLabel}
            subWarn={o.acwr.status === "spike" || o.acwr.status === "caution"}
          />
        </div>

        <Ornament variant="diamond" />

        {/* Records & rate — WayfarerStar + a small recent-runs Catalog */}
        <div className="plate-grid">
          <Plate
            numeral={`${roman(sectionN).toLowerCase()}.i`}
            title="Best efforts — the four roads"
            caption="each spoke a distance; each bead a PR; the outermost dot is the all-time best."
          >
            <WayfarerStar progression={o.bestProgression} />
          </Plate>

          <Plate
            numeral={`${roman(sectionN).toLowerCase()}.ii`}
            title="Most recent"
            caption="the last six runs, freshest first."
          >
            <Catalog
              entries={o.recentRuns.map((r, i) => ({
                num: roman(i + 1).toLowerCase(),
                name: (
                  <span>
                    {format(r.date, "EEE d MMM").toLowerCase()}
                    {r.title ? <span style={{ color: "var(--ash)", marginLeft: 6 }}> · {r.title.toLowerCase()}</span> : null}
                  </span>
                ),
                desc: r.avgHr ? `hr ${r.avgHr.toFixed(0)}` : undefined,
                numerals: (
                  <span>
                    {r.distanceKm.toFixed(2)} km
                    <span style={{ color: "var(--ash)", marginLeft: 8, fontSize: ".82em" }}>
                      {fmtDuration(r.durationS)}
                    </span>
                  </span>
                ),
                href: `/runs/${r.id}`,
              }))}
            />
          </Plate>
        </div>

        {/* Load & rhythm — kalendar + ACWR (LoadChain reused) */}
        <div className="plate-grid">
          <Plate
            numeral={`${roman(sectionN).toLowerCase()}.iii`}
            title="The kalendar"
            caption="daily kilometres for the last 14 weeks. today is rubric."
          >
            <PilgrimsKalendar days={o.dailyKm} />
          </Plate>

          <Plate
            numeral={`${roman(sectionN).toLowerCase()}.iv`}
            title="Acute / chronic"
            caption="acwr — the rate at which load is climbing, not its absolute size."
          >
            <LoadChain
              ratio={o.acwr.ratio}
              status={o.acwr.status}
              acute={o.acwr.acute}
              chronic={o.acwr.chronic}
            />
          </Plate>
        </div>

        {/* Quiet pointer to the Stations chapter */}
        <div style={{ marginTop: 28, textAlign: "center" }}>
          <Link
            href="/stations"
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
            read the stations · the running chronicle in full
          </Link>
        </div>
      </section>
    </>
  );
}
