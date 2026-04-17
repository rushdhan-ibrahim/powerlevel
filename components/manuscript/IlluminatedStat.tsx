/**
 * ILLUMINATED STAT — replaces the flat Vital cell. Hairline corner
 * ticks make the box feel like a framed plate; a small rubric mark
 * sits beside the label; numerals render in the display face with
 * a fine baseline rule beneath.
 */

import type React from "react";

type Props = {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  subWarn?: boolean;
  glyph?: React.ReactNode;
};

export function IlluminatedStat({ label, value, unit, sub, subWarn, glyph }: Props) {
  return (
    <div className="ill-stat">
      {/* corner ticks */}
      <span className="ill-corner ill-corner-tl" aria-hidden="true" />
      <span className="ill-corner ill-corner-tr" aria-hidden="true" />
      <span className="ill-corner ill-corner-bl" aria-hidden="true" />
      <span className="ill-corner ill-corner-br" aria-hidden="true" />

      <div className="ill-stat-label">
        {glyph ? <span className="ill-stat-glyph">{glyph}</span> : <span className="ill-stat-mark">◇</span>}
        <span>{label}</span>
      </div>

      <div className="ill-stat-value-row">
        <span className="ill-stat-value">{value}</span>
        {unit && <span className="ill-stat-unit">{unit}</span>}
      </div>

      <div className="ill-stat-rule" />

      {sub && <div className={`ill-stat-sub ${subWarn ? "is-warn" : ""}`}>{sub}</div>}
    </div>
  );
}
