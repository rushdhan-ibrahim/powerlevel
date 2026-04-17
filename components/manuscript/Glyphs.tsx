/**
 * GLYPHS — small geometric marks used in the masthead, chapter
 * openers, and gutter furniture. All hairline SVG, geometry rules.
 *
 * Each glyph is designed to read at ~18px (nav), ~28px (chapter
 * opener), or ~50px (gutter). They share a vocabulary: rings,
 * spokes, points, dots — never literal icons.
 */

import { polar, pointRing } from "@/lib/manuscript";

type GlyphProps = {
  size?: number;
  rubric?: boolean;
  className?: string;
  spinning?: boolean;
};

const stroke = (rubric?: boolean) => (rubric ? "var(--rubric)" : "var(--ink)");

/** A nested square — a folio open. */
export function GlyphHome({ size = 18, rubric, className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={className}>
      <rect x="3" y="3" width="18" height="18" fill="none" stroke={stroke(rubric)} strokeWidth=".7" opacity=".75" />
      <rect x="6" y="6" width="12" height="12" fill="none" stroke={stroke(rubric)} strokeWidth=".4" opacity=".55" />
      <circle cx="12" cy="12" r="1.4" fill={stroke(rubric)} opacity=".85" />
    </svg>
  );
}

/** A short stack of horizontal rules — a catalog. */
export function GlyphHistory({ size = 18, rubric, className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={className}>
      <line x1="4" y1="6" x2="20" y2="6" stroke={stroke(rubric)} strokeWidth=".7" opacity=".85" />
      <line x1="4" y1="11" x2="20" y2="11" stroke={stroke(rubric)} strokeWidth=".5" opacity=".65" />
      <line x1="4" y1="16" x2="14" y2="16" stroke={stroke(rubric)} strokeWidth=".5" opacity=".55" />
      <line x1="4" y1="21" x2="11" y2="21" stroke={stroke(rubric)} strokeWidth=".4" opacity=".42" />
      <circle cx="20" cy="11" r="1" fill={stroke(rubric)} opacity=".7" />
    </svg>
  );
}

/** A six-point star — the contemplative plate. */
export function GlyphPlates({ size = 18, rubric, className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={className}>
      <polygon
        points={pointRing(12, 12, 9, 3.6, 6)}
        fill="none"
        stroke={stroke(rubric)}
        strokeWidth=".7"
        opacity=".85"
      />
      <circle cx="12" cy="12" r="1.6" fill={stroke(rubric)} opacity=".85" />
    </svg>
  );
}

/** Three horizontal rules with weights — a balanced ledger. */
export function GlyphLedger({ size = 18, rubric, className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={className}>
      <line x1="4" y1="6" x2="20" y2="6" stroke={stroke(rubric)} strokeWidth=".55" opacity=".75" />
      <line x1="4" y1="12" x2="20" y2="12" stroke={stroke(rubric)} strokeWidth=".55" opacity=".75" />
      <line x1="4" y1="18" x2="20" y2="18" stroke={stroke(rubric)} strokeWidth=".55" opacity=".75" />
      <circle cx="8" cy="6" r="1.6" fill={stroke(rubric)} opacity=".85" />
      <circle cx="16" cy="12" r="1" fill={stroke(rubric)} opacity=".85" />
      <circle cx="12" cy="18" r="1.3" fill={stroke(rubric)} opacity=".85" />
    </svg>
  );
}

/** A spiral / snail — accumulation, totals. */
export function GlyphTotals({ size = 18, rubric, className }: GlyphProps) {
  // Two-arc spiral hand-tuned to read at small sizes
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={className}>
      <path
        d="M12,4 A8,8 0 1,1 4,12 A6,6 0 1,1 16,12 A4,4 0 1,1 8,12 A2,2 0 1,1 12,12"
        fill="none"
        stroke={stroke(rubric)}
        strokeWidth=".55"
        opacity=".85"
      />
    </svg>
  );
}

/** A quill cross — the act of inscribing. */
export function GlyphAdd({ size = 18, rubric = true, className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={className}>
      <line x1="12" y1="3" x2="12" y2="21" stroke={stroke(rubric)} strokeWidth=".7" opacity=".85" />
      <line x1="3" y1="12" x2="21" y2="12" stroke={stroke(rubric)} strokeWidth=".7" opacity=".85" />
      <polygon
        points="12,3 13.5,7 12,11 10.5,7"
        fill={stroke(rubric)}
        opacity=".95"
      />
      <circle cx="12" cy="12" r="1.4" fill={stroke(rubric)} opacity=".95" />
    </svg>
  );
}

/** A small heraldic crest — the powerlevel mark for the masthead. */
export function GlyphCrest({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" className={className}>
      <g style={{ animation: "spin 240s linear infinite", transformOrigin: "16px 16px" }}>
        <circle cx="16" cy="16" r="14" fill="none" stroke="var(--ink)" strokeWidth=".4" opacity=".5" />
        <circle
          cx="16"
          cy="16"
          r="11"
          fill="none"
          stroke="var(--ink)"
          strokeWidth=".22"
          opacity=".3"
          strokeDasharray="1.5,3"
        />
      </g>
      <g style={{ animation: "sealBreathe 9s ease-in-out infinite", transformOrigin: "16px 16px" }}>
        <polygon
          points={pointRing(16, 16, 9, 4, 8)}
          fill="none"
          stroke="var(--rubric)"
          strokeWidth=".55"
          opacity=".9"
        />
        <polygon
          points={pointRing(16, 16, 4.5, 1.8, 8)}
          fill="var(--rubric)"
          opacity=".8"
        />
      </g>
    </svg>
  );
}

/** Small section ornament glyphs — used by ChapterOpener. */
export function GlyphRose({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      <g style={{ animation: "spinR 60s linear infinite", transformOrigin: "20px 20px" }}>
        <circle cx="20" cy="20" r="16" fill="none" stroke="var(--ink)" strokeWidth=".35" opacity=".5" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
          const [x, y] = polar(20, 20, 11, a);
          return <circle key={i} cx={x} cy={y} r={5} fill="none" stroke="var(--ink)" strokeWidth=".3" opacity=".6" />;
        })}
      </g>
      <polygon
        points={pointRing(20, 20, 5.5, 2.4, 8)}
        fill="var(--rubric)"
        opacity=".9"
        style={{ animation: "pulse 5s ease-in-out infinite" }}
      />
    </svg>
  );
}

export function GlyphCompass({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      <g style={{ animation: "spin 80s linear infinite", transformOrigin: "20px 20px" }}>
        <circle cx="20" cy="20" r="16" fill="none" stroke="var(--ink)" strokeWidth=".4" opacity=".55" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
          const [x, y] = polar(20, 20, 16, a);
          return <line key={i} x1={20} y1={20} x2={x} y2={y} stroke="var(--ink)" strokeWidth=".3" opacity=".55" />;
        })}
      </g>
      <polygon points={pointRing(20, 20, 5, 2, 4, Math.PI / 4)} fill="var(--rubric)" opacity=".95" />
    </svg>
  );
}

export function GlyphHourglassOrnament({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      <g style={{ animation: "breathe 12s ease-in-out infinite", transformOrigin: "20px 20px" }}>
        <path
          d="M10,4 L30,4 L22,20 L30,36 L10,36 L18,20 Z"
          fill="none"
          stroke="var(--ink)"
          strokeWidth=".55"
          opacity=".75"
        />
      </g>
      <line x1="10" y1="4" x2="30" y2="4" stroke="var(--ink)" strokeWidth=".7" opacity=".75" />
      <line x1="10" y1="36" x2="30" y2="36" stroke="var(--ink)" strokeWidth=".7" opacity=".75" />
      <circle cx="20" cy="20" r="1.6" fill="var(--rubric)" opacity=".95" />
    </svg>
  );
}

export function GlyphChapletOrnament({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      <g style={{ animation: "spin 90s linear infinite", transformOrigin: "20px 20px" }}>
        <circle cx="20" cy="20" r="13" fill="none" stroke="var(--ink)" strokeWidth=".35" opacity=".55" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const [x, y] = polar(20, 20, 13, a);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={i % 4 === 0 ? 1.8 : 1}
              fill={i % 4 === 0 ? "var(--rubric)" : "var(--ink)"}
              opacity=".82"
            />
          );
        })}
      </g>
    </svg>
  );
}

export function GlyphSeed({ size = 32 }: { size?: number }) {
  // phyllotaxis seed glyph
  const ga = (137.508 * Math.PI) / 180;
  const dots = Array.from({ length: 21 }, (_, i) => {
    const r = 1.6 * Math.sqrt(i + 1);
    const a = i * ga;
    const [x, y] = polar(20, 20, r, a);
    return { x, y, i };
  });
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      {dots.map((d) => (
        <circle
          key={d.i}
          cx={d.x}
          cy={d.y}
          r={1 + d.i * 0.04}
          fill={d.i === 0 ? "var(--rubric)" : "var(--ink)"}
          opacity={d.i === 0 ? 1 : 0.2 + (d.i / 21) * 0.5}
        />
      ))}
    </svg>
  );
}
