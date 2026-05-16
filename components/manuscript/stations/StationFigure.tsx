/**
 * STATION FIGURE — renders one inline figure inside a Stations
 * chapter. Two figure kinds are implemented in PR 1 (calendar +
 * volume jump); the remaining kinds render a courteous placeholder
 * frame until PR 3 lands the running plates proper.
 *
 * Lives as a server-rendered component because every figure reads
 * from Postgres at render time — the chronicle is a window into
 * live data, not a snapshot. New plates (CardiacRose, WayfarerStar,
 * etc.) plug in here as their components land.
 */
import { dailyKmSeries, type DailyKmRow } from "@/lib/pilgrimage/queries";
import { Plate } from "@/components/manuscript/Plate";

export interface FigureSpec {
  kind: string;
  from?: string;
  to?: string;
  tissue_id?: string;
  caption: string;
}

export async function StationFigure({ spec, ordinal }: { spec: FigureSpec; ordinal: string }) {
  const title = (spec.kind === "calendar" || spec.kind === "volume_jump")
    ? defaultTitleFor(spec)
    : defaultTitleFor(spec);

  if (spec.kind === "calendar") {
    const days = await dailyKmSeries();
    const range = filterRange(days, spec.from, spec.to);
    return (
      <Plate numeral={ordinal} title={title} caption={spec.caption}>
        <CalendarFigure rows={range} />
      </Plate>
    );
  }
  if (spec.kind === "volume_jump") {
    // PR 1 ships the constants from the seeded chapter; PR 5 will
    // pull these from RaceGoal + recent peak weeks when those exist.
    return (
      <Plate numeral={ordinal} title={title} caption={spec.caption}>
        <VolumeJumpFigure baseline={35} prescribed={67} actualPeak={38} />
      </Plate>
    );
  }
  // Other kinds — placeholder until PR 3 lands the chart components.
  return (
    <Plate numeral={ordinal} title={title} caption={spec.caption}>
      <FigurePending kind={spec.kind} />
    </Plate>
  );
}

function defaultTitleFor(spec: FigureSpec): string {
  switch (spec.kind) {
    case "calendar":     return "The kalendar";
    case "weekly_range": return "Weekly distance";
    case "tissue":       return `Tissue · ${spec.tissue_id ?? ""}`.trim();
    case "acwr_range":   return "Acute / chronic ratio";
    case "pace_at_hr":   return "Pace at fixed effort";
    case "bests_range":  return "Best efforts";
    case "volume_jump":  return "The volume jump";
    case "readiness":    return "The managed return";
    default:             return "Figure";
  }
}

function filterRange(rows: DailyKmRow[], from?: string, to?: string): DailyKmRow[] {
  return rows.filter((r) => (!from || r.date >= from) && (!to || r.date <= to));
}

// ─────────────────────────────────────────────────────────────────────
//  Inline figure: calendar mini-heatmap
//  Rendered in pure HTML/CSS for a hairline match with the surrounding
//  prose. Columns = weeks; rows = days of week (Sun..Sat).
// ─────────────────────────────────────────────────────────────────────
function CalendarFigure({ rows }: { rows: DailyKmRow[] }) {
  if (!rows.length) {
    return <div style={{ padding: "20px 0", textAlign: "center", color: "var(--ash)", fontStyle: "italic" }}>no runs in this window</div>;
  }
  const firstDate = new Date(rows[0].date + "T00:00:00Z");
  const lastDate  = new Date(rows[rows.length - 1].date + "T00:00:00Z");
  const start = new Date(firstDate); start.setUTCDate(firstDate.getUTCDate() - firstDate.getUTCDay());
  const end   = new Date(lastDate);  end.setUTCDate(lastDate.getUTCDate() + (6 - lastDate.getUTCDay()));
  const DAY_MS = 86_400_000;
  const weeks = Math.ceil(((end.getTime() - start.getTime()) / DAY_MS + 1) / 7);
  const byDate = Object.fromEntries(rows.map((r) => [r.date, r] as const));
  const maxKm = Math.max(...rows.map((r) => r.km), 1);

  const cells: { row: number; col: number; iso: string; km: number }[] = [];
  for (let col = 0; col < weeks; col++) {
    for (let row = 0; row < 7; row++) {
      const t = start.getTime() + (col * 7 + row) * DAY_MS;
      const iso = new Date(t).toISOString().slice(0, 10);
      const km = byDate[iso]?.km ?? 0;
      cells.push({ row: row + 1, col: col + 1, iso, km });
    }
  }
  const level = (km: number) => {
    if (km <= 0) return 0;
    if (km > maxKm * 0.66) return 3;
    if (km > maxKm * 0.33) return 2;
    return 1;
  };
  const inkAt = (lvl: number) => {
    // graded rubric saturation on paper — matches the existing
    // illumination vocabulary; no new colour token introduced.
    if (lvl === 0) return "color-mix(in oklab, var(--ink) 6%, transparent)";
    if (lvl === 1) return "color-mix(in oklab, var(--rubric) 25%, transparent)";
    if (lvl === 2) return "color-mix(in oklab, var(--rubric) 55%, transparent)";
    return "var(--rubric)";
  };

  return (
    <div style={{ padding: "8px 4px 4px", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${weeks}, 14px)`,
          gridAutoFlow: "column",
          gap: 3,
        }}
      >
        {cells.map((c, i) => (
          <div
            key={i}
            title={`${c.iso} · ${c.km.toFixed(1)} km`}
            style={{
              gridRow: c.row,
              gridColumn: c.col,
              width: 14,
              height: 14,
              background: inkAt(level(c.km)),
              borderRadius: 1,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Inline figure: volume-jump bars (Chapter VII)
//  Three horizontal bars — baseline, prescribed, actual — on a
//  shared scale. Hairline rules, paper backgrounds, rubric on the
//  worst-case bar.
// ─────────────────────────────────────────────────────────────────────
function VolumeJumpFigure({
  baseline, prescribed, actualPeak,
}: { baseline: number; prescribed: number; actualPeak: number }) {
  const max = Math.max(baseline, prescribed, actualPeak, 1) * 1.05;
  const Row = ({ label, value, ink }: { label: string; value: number; ink: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12 }}>
      <div style={{
        width: 160, color: "var(--ash)",
        fontFamily: "var(--display)", fontVariant: "small-caps",
        letterSpacing: ".06em", fontSize: ".68rem",
      }}>{label}</div>
      <div style={{ flex: 1, height: 22, background: "color-mix(in oklab, var(--ink) 4%, transparent)", position: "relative", border: "1px solid var(--rule)" }}>
        <div style={{
          height: "100%", width: `${(value / max) * 100}%`,
          background: ink,
          display: "flex", alignItems: "center", justifyContent: "flex-end",
          paddingRight: 8, color: "var(--paper)",
          fontFamily: "var(--mono)", fontSize: ".68rem", letterSpacing: ".02em",
          fontVariantNumeric: "tabular-nums oldstyle-nums",
        }}>
          {value.toFixed(1)} km
        </div>
      </div>
    </div>
  );
  return (
    <div style={{ display: "grid", gap: 10, padding: "10px 4px" }}>
      <Row label="your baseline (peak)" value={baseline}    ink="color-mix(in oklab, var(--ink) 70%, transparent)" />
      <Row label="coach prescribed"     value={prescribed}  ink="var(--rubric)" />
      <Row label="actual peak week"     value={actualPeak}  ink="color-mix(in oklab, var(--ink) 50%, transparent)" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Placeholder for figure kinds whose plates land in PR 3.
//  Frames the empty space honestly rather than crashing the chapter.
// ─────────────────────────────────────────────────────────────────────
function FigurePending({ kind }: { kind: string }) {
  return (
    <div style={{
      padding: "32px 18px",
      textAlign: "center",
      color: "var(--ash)",
      fontFamily: "var(--italic)",
      fontStyle: "italic",
      fontSize: ".88rem",
      border: "1px dashed var(--rule)",
      letterSpacing: ".01em",
    }}>
      The <span style={{ fontFamily: "var(--display)", fontVariant: "small-caps", letterSpacing: ".12em", fontStyle: "normal" }}>{kind.replace(/_/g, " ")}</span> plate is illuminated in a forthcoming folio.
    </div>
  );
}
