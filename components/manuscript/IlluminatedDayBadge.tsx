"use client";

/**
 * A miniature illuminated day-marker. Echoes the Initial's vocabulary —
 * corner bosses, crosshatched background, rubric octagram, pediment and
 * scrolled foot — at a scale that fits inside the history card's left
 * column. The day numeral is the illuminated capital; the weekday sits
 * above it in a small rubric inscription band, the month below.
 *
 * Stays monochrome rubric + ink + paper to match the rest of the app;
 * no vines or foliage. Density comes from layered hairline frames,
 * pattern fills, and filigree — not from colour variety.
 */

import { mulberry32, pointRing } from "@/lib/manuscript";

type Props = {
  weekday: string;          // "thu"
  day: number | string;     // 16
  month: string;            // "apr"
  illuminated?: boolean;    // slightly richer rendering when the card is expanded
  seed?: number;
};

export function IlluminatedDayBadge({
  weekday,
  day,
  month,
  illuminated = false,
  seed,
}: Props) {
  const base = seed ?? (String(day).charCodeAt(0) * 37 + 11);
  const rng = mulberry32(base);
  const j = (v: number, a = 0.5) => v + (rng() - 0.5) * a;
  const hatchId = `day-hatch-${base}`;
  const hatchId2 = `day-hatch2-${base}`;

  return (
    <svg
      viewBox="-6 -14 76 110"
      width="62"
      height="86"
      aria-hidden="true"
      style={{ overflow: "visible", display: "block" }}
    >
      <defs>
        {/* Two-directional crosshatch for the panel background — very
            faint, but enough to keep the paper from feeling naked
            inside the frame. */}
        <pattern id={hatchId} width="3.5" height="3.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="3.5" stroke="var(--rubric)" strokeWidth=".25" opacity=".12" />
        </pattern>
        <pattern id={hatchId2} width="3.5" height="3.5" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
          <line x1="0" y1="0" x2="0" y2="3.5" stroke="var(--rubric)" strokeWidth=".2" opacity=".08" />
        </pattern>
      </defs>

      {/* ─── PEDIMENT — an architectural rubric cap ─────────────── */}
      <g>
        {/* Central filigree: three-tiered triangle, denser than a
            plain v-notch, with side runners extending outwards */}
        <polygon points="29,-12 32,-9 35,-12" fill="var(--rubric)" opacity=".95" />
        <polygon points="30.2,-8.5 32,-7 33.8,-8.5" fill="var(--rubric)" opacity=".75" />
        <line x1="14" y1="-5" x2="50" y2="-5" stroke="var(--rubric)" strokeWidth=".55" opacity=".7" />
        <line x1="18" y1="-3.5" x2="46" y2="-3.5" stroke="var(--rubric)" strokeWidth=".25" opacity=".4" />
        {/* Flanking rubric bosses — concentric rings + 4-point star */}
        {[10, 54].map((cx, i) => (
          <g key={i}>
            <circle cx={cx} cy="-5" r="1.6" fill="var(--paper-warm)" stroke="var(--rubric)" strokeWidth=".35" opacity=".92" />
            <polygon points={pointRing(cx, -5, 1.1, 0.45, 4)} fill="var(--rubric)" opacity=".9" />
          </g>
        ))}
        {/* Outer filigree dots — taper off to nothing */}
        {[4, 60].map((cx, i) => (
          <circle key={i} cx={cx} cy="-5" r=".55" fill="var(--rubric)" opacity=".55" />
        ))}
      </g>

      {/* ─── OUTER PAPER PANEL — the illuminated tablet ──────────── */}
      <rect x="0" y="0" width="64" height="82" rx="1.5" fill="var(--paper-warm)" />
      {/* Rubric main frame */}
      <rect x=".7" y=".7" width="62.6" height="80.6" rx="1.2" fill="none" stroke="var(--rubric)" strokeWidth=".85" opacity=".88" />
      {/* Crosshatch layers inside the frame */}
      <rect x="1.5" y="1.5" width="61" height="79" fill={`url(#${hatchId})`} />
      <rect x="1.5" y="1.5" width="61" height="79" fill={`url(#${hatchId2})`} />
      {/* Inner hairline frame */}
      <rect x="3" y="3" width="58" height="76" fill="none" stroke="var(--rubric)" strokeWidth=".35" opacity=".45" />
      {/* Dashed inner-inner frame for depth */}
      <rect x="4.5" y="4.5" width="55" height="73" fill="none" stroke="var(--rubric)" strokeWidth=".2" opacity=".28" strokeDasharray="1,1.8" />

      {/* ─── CORNER BOSSES — concentric rings with rubric stars ──── */}
      {[
        [4.5, 4.5],
        [59.5, 4.5],
        [4.5, 77.5],
        [59.5, 77.5],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="2.4" fill="var(--paper-warm)" stroke="var(--rubric)" strokeWidth=".4" />
          <circle cx={x} cy={y} r="1.5" fill="none" stroke="var(--rubric)" strokeWidth=".25" opacity=".55" />
          <polygon points={pointRing(x, y, 1.6, 0.55, 4)} fill="var(--rubric)" opacity=".9" />
        </g>
      ))}

      {/* ─── INNER FLOURISH CURLS — acanthus-ish tendrils tucked
           into the inner corners for density ───────────────────── */}
      <g stroke="var(--rubric)" strokeWidth=".35" fill="none" opacity=".55" strokeLinecap="round">
        <path d="M8,8 Q11,9 12.5,11.5 M11,8.2 Q12.5,9 13.5,10.5" />
        <path d="M56,8 Q53,9 51.5,11.5 M53,8.2 Q51.5,9 50.5,10.5" />
        <path d="M8,74 Q11,73 12.5,70.5 M11,73.8 Q12.5,73 13.5,71.5" />
        <path d="M56,74 Q53,73 51.5,70.5 M53,73.8 Q51.5,73 50.5,71.5" />
      </g>

      {/* ─── WEEKDAY INSCRIPTION BAND ────────────────────────────── */}
      <line x1="8" y1="18" x2="56" y2="18" stroke="var(--rubric)" strokeWidth=".3" opacity=".5" />
      <text
        x="32"
        y="15"
        fontFamily="var(--display)"
        fontSize="5.6"
        fill="var(--rubric)"
        textAnchor="middle"
        style={{
          fontVariant: "small-caps",
          letterSpacing: ".16em",
        }}
      >
        {weekday}
      </text>
      {/* Tiny rubric diamonds framing the weekday text */}
      <polygon points="11,13.5 12.5,15 11,16.5 9.5,15" fill="var(--rubric)" opacity=".7" />
      <polygon points="53,13.5 54.5,15 53,16.5 51.5,15" fill="var(--rubric)" opacity=".7" />

      {/* ─── BREATHING OCTAGRAM behind the numeral ───────────────── */}
      <g
        style={{
          animation: "sealBreathe 9s ease-in-out infinite",
          transformOrigin: "32px 46px",
        }}
      >
        <polygon
          points={pointRing(32, 46, 16, 6, 8)}
          fill="none"
          stroke="var(--rubric)"
          strokeWidth=".35"
          opacity={illuminated ? 0.5 : 0.35}
        />
        <polygon
          points={pointRing(32, 46, 10, 3.8, 8)}
          fill="var(--rubric)"
          opacity={illuminated ? 0.15 : 0.1}
        />
      </g>

      {/* ─── DAY NUMERAL — Cinzel Decorative rubric ──────────────── */}
      <text
        x={j(32, 0.4)}
        y={j(55, 0.4)}
        fontFamily="var(--font-cinzel), 'Cormorant SC', Georgia, serif"
        fontSize="24"
        fontWeight="900"
        fill="var(--rubric)"
        textAnchor="middle"
        style={{
          letterSpacing: "-.015em",
          fontVariantNumeric: "lining-nums",
        }}
      >
        {day}
      </text>
      {/* Gilt highlight — small paper-coloured glints on the numeral */}
      <circle cx={j(26, 0.3)} cy={j(42, 0.3)} r=".6" fill="var(--paper)" opacity=".45" />
      <circle cx={j(38, 0.3)} cy={j(52, 0.3)} r=".4" fill="var(--paper)" opacity=".3" />

      {/* ─── MONTH INSCRIPTION BAND ──────────────────────────────── */}
      <line x1="8" y1="65" x2="56" y2="65" stroke="var(--rubric)" strokeWidth=".3" opacity=".5" />
      <text
        x="32"
        y="73"
        fontFamily="var(--italic)"
        fontSize="6.8"
        fill="var(--ink-light)"
        textAnchor="middle"
        fontStyle="italic"
        style={{ letterSpacing: ".04em" }}
      >
        {month}
      </text>

      {/* ─── SCROLLED FOOT — rubric calligraphic flourish ────────── */}
      <g>
        {/* twin arcs curling inward to a central boss */}
        <path d="M10,90 Q20,94 32,92 Q44,94 54,90" fill="none" stroke="var(--rubric)" strokeWidth=".55" opacity=".75" />
        <path d="M16,90 Q20,91.5 23,91" fill="none" stroke="var(--rubric)" strokeWidth=".3" opacity=".55" />
        <path d="M48,90 Q44,91.5 41,91" fill="none" stroke="var(--rubric)" strokeWidth=".3" opacity=".55" />
        {/* central boss */}
        <circle cx="32" cy="92.5" r="1.6" fill="var(--paper-warm)" stroke="var(--rubric)" strokeWidth=".35" />
        <polygon points={pointRing(32, 92.5, 1.1, 0.45, 4)} fill="var(--rubric)" opacity=".9" />
        {/* flanking dots — taper */}
        <circle cx="25" cy="93" r=".55" fill="var(--rubric)" opacity=".6" />
        <circle cx="39" cy="93" r=".55" fill="var(--rubric)" opacity=".6" />
        <circle cx="20" cy="93.3" r=".35" fill="var(--rubric)" opacity=".4" />
        <circle cx="44" cy="93.3" r=".35" fill="var(--rubric)" opacity=".4" />
      </g>
    </svg>
  );
}
