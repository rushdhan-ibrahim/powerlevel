"use client";

/**
 * A miniature illuminated day-marker. Echoes the Initial's vocabulary
 * at a scale that fits inside the history card's left column — a
 * proper manuscript tablet, not a typographic stack.
 *
 * Layout (top → bottom):
 *   CAP-STAR      ◆  a tiny eight-point rose crowning the pediment
 *   PEDIMENT     ╱╲  tiered triangle on a double rule flanked by
 *                     concentric-ring bosses and outward taper dots
 *   OUTER FRAME  ▣▣  four nested rubric frames: main hairline, inner
 *                     hairline, dashed, plus a dot-chain on each edge
 *   MID-EDGE     ✦  small rubric diamond at the top-centre, bottom-
 *                     centre, left-middle and right-middle of the frame
 *   CORNERS         concentric-ring bosses with 4-point rubric stars,
 *                     plus filigree tails curling inward
 *   INNER FILIGREE  triple-arc acanthus curls in each inner corner
 *   WEEKDAY BAND    small-caps rubric between hairline rules with
 *                     diamond markers AND small scroll terminators
 *   OCTAGRAM       breathing 8-point star behind the numeral, with
 *                     an outer dotted ring studded with four dots
 *   NUMERAL         CINZEL DECORATIVE 28px, rubric-red, with multiple
 *                     paper-coloured gilt glints jittered by a seed
 *   MONTH BAND      italic ash between hairline rules
 *   FOOT            twin-arc scrolled flourish with central boss plus
 *                     a pendant / tassel hanging below
 *
 * Stays monochrome rubric + ink + paper. Density comes from layered
 * hairlines, repeated small motifs (dot chains, filigree), and
 * deliberate architectural elements (cap-star, mid-edge diamonds,
 * pendant) — not from colour variety.
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

  // Dot-chain generator — emits evenly spaced rubric circles along an edge.
  const dotChain = (x1: number, y1: number, x2: number, y2: number, n: number, r = 0.35, op = 0.45) => {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      out.push(
        <circle
          key={`${x1}-${y1}-${i}`}
          cx={x1 + (x2 - x1) * t}
          cy={y1 + (y2 - y1) * t}
          r={r}
          fill="var(--rubric)"
          opacity={op}
        />,
      );
    }
    return out;
  };

  return (
    <svg
      viewBox="-8 -22 100 150"
      width="86"
      height="128"
      aria-hidden="true"
      style={{ overflow: "visible", display: "block" }}
    >
      <defs>
        {/* Two-directional crosshatch — faint, keeps the paper from
            feeling naked inside the frame. */}
        <pattern id={hatchId} width="3.5" height="3.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="3.5" stroke="var(--rubric)" strokeWidth=".22" opacity=".11" />
        </pattern>
        <pattern id={hatchId2} width="3.5" height="3.5" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
          <line x1="0" y1="0" x2="0" y2="3.5" stroke="var(--rubric)" strokeWidth=".18" opacity=".08" />
        </pattern>
      </defs>

      {/* ─── CAP-STAR — the crown above everything ────────────────
           A tiny eight-point rose at the very top; lifts the eye
           into the ornament before the pediment resolves into base. */}
      <g style={{ animation: "sealBreathe 11s ease-in-out infinite", transformOrigin: "42px -20px" }}>
        <polygon points={pointRing(42, -20, 2.4, 1, 8)} fill="var(--rubric)" opacity=".88" />
        <circle cx="42" cy="-20" r=".7" fill="var(--paper-warm)" />
      </g>
      {/* Two tiny flourish curls rising from the star */}
      <path d="M38.5,-19 Q36,-17 36,-14" stroke="var(--rubric)" strokeWidth=".25" fill="none" opacity=".5" strokeLinecap="round" />
      <path d="M45.5,-19 Q48,-17 48,-14" stroke="var(--rubric)" strokeWidth=".25" fill="none" opacity=".5" strokeLinecap="round" />

      {/* ─── PEDIMENT — architectural rubric cap ────────────────── */}
      <g>
        {/* Tiered triangles: large one on top, smaller nested inside */}
        <polygon points="36,-13 42,-7 48,-13" fill="var(--rubric)" opacity=".95" />
        <polygon points="38.5,-9.5 42,-6.5 45.5,-9.5" fill="var(--paper-warm)" />
        <polygon points="39.5,-8.5 42,-6 44.5,-8.5" fill="var(--rubric)" opacity=".9" />
        {/* Double-rule horizontal base of the pediment */}
        <line x1="14" y1="-4" x2="70" y2="-4" stroke="var(--rubric)" strokeWidth=".7" opacity=".78" />
        <line x1="18" y1="-2.4" x2="66" y2="-2.4" stroke="var(--rubric)" strokeWidth=".3" opacity=".42" />
        {/* Dot chain between the rules — subtle, but reads as detail */}
        {dotChain(22, -3.2, 62, -3.2, 10, 0.3, 0.45)}
        {/* Flanking rubric bosses with multiple rings */}
        {[8, 76].map((cx, i) => (
          <g key={i}>
            <circle cx={cx} cy="-4" r="2.3" fill="var(--paper-warm)" stroke="var(--rubric)" strokeWidth=".45" />
            <circle cx={cx} cy="-4" r="1.4" fill="none" stroke="var(--rubric)" strokeWidth=".25" opacity=".55" />
            <polygon points={pointRing(cx, -4, 1.4, 0.55, 4)} fill="var(--rubric)" opacity=".95" />
          </g>
        ))}
        {/* Outer filigree: small scrolls emerging from the bosses */}
        <path d="M4,-4 Q1,-4 0,-1" stroke="var(--rubric)" strokeWidth=".3" fill="none" opacity=".5" strokeLinecap="round" />
        <path d="M80,-4 Q83,-4 84,-1" stroke="var(--rubric)" strokeWidth=".3" fill="none" opacity=".5" strokeLinecap="round" />
      </g>

      {/* ─── OUTER PAPER PANEL — the illuminated tablet ────────── */}
      <rect x="0" y="0" width="84" height="104" rx="2" fill="var(--paper-warm)" />
      {/* Rubric main frame */}
      <rect x=".8" y=".8" width="82.4" height="102.4" rx="1.6" fill="none" stroke="var(--rubric)" strokeWidth=".95" opacity=".9" />
      {/* Crosshatch layers inside the frame */}
      <rect x="1.6" y="1.6" width="80.8" height="100.8" fill={`url(#${hatchId})`} />
      <rect x="1.6" y="1.6" width="80.8" height="100.8" fill={`url(#${hatchId2})`} />
      {/* Inner hairline frame */}
      <rect x="3.2" y="3.2" width="77.6" height="97.6" fill="none" stroke="var(--rubric)" strokeWidth=".4" opacity=".5" />
      {/* Dashed inner-inner frame */}
      <rect x="5" y="5" width="74" height="94" fill="none" stroke="var(--rubric)" strokeWidth=".25" opacity=".32" strokeDasharray="1.2,2" />
      {/* Dot chain along the two long edges (inner) */}
      {dotChain(9, 4, 75, 4, 16, 0.28, 0.42)}
      {dotChain(9, 100, 75, 100, 16, 0.28, 0.42)}

      {/* ─── MID-EDGE ORNAMENTS — small rubric diamonds marking
            the midpoint of each outer frame edge. Turn the rectangle
            into something that reads as intentionally cardinal. */}
      {[
        [42, 0.8],    // top
        [42, 103.2],  // bottom
        [0.8, 52],    // left
        [83.2, 52],   // right
      ].map(([x, y], i) => (
        <g key={i}>
          <polygon points={pointRing(x, y, 1.6, 0.6, 4)} fill="var(--paper-warm)" stroke="var(--rubric)" strokeWidth=".35" />
          <polygon points={pointRing(x, y, 1, 0.38, 4)} fill="var(--rubric)" opacity=".85" />
        </g>
      ))}

      {/* ─── CORNER BOSSES — concentric rings with rubric stars,
            now with filigree tails curling inward into the panel ── */}
      {[
        [5, 5, 1, 1],      // top-left
        [79, 5, -1, 1],    // top-right
        [5, 99, 1, -1],    // bottom-left
        [79, 99, -1, -1],  // bottom-right
      ].map(([x, y, sx, sy], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="2.8" fill="var(--paper-warm)" stroke="var(--rubric)" strokeWidth=".45" />
          <circle cx={x} cy={y} r="1.7" fill="none" stroke="var(--rubric)" strokeWidth=".25" opacity=".55" />
          <polygon points={pointRing(x, y, 1.8, 0.65, 4)} fill="var(--rubric)" opacity=".92" />
          {/* tiny filigree tail curling into the panel */}
          <path
            d={`M${x + 2.2 * sx},${y + 2.2 * sy} Q${x + 5 * sx},${y + 3.5 * sy} ${x + 7 * sx},${y + 5 * sy}`}
            stroke="var(--rubric)"
            strokeWidth=".3"
            fill="none"
            opacity=".45"
            strokeLinecap="round"
          />
        </g>
      ))}

      {/* ─── INNER FILIGREE — triple-arc acanthus tendrils in each
            inner corner, with small terminal dots ─────────────── */}
      <g stroke="var(--rubric)" strokeWidth=".38" fill="none" opacity=".6" strokeLinecap="round">
        {/* top-left */}
        <path d="M11,11 Q15,12 17,16" />
        <path d="M13,11.3 Q16,12.3 17.5,15" />
        <path d="M14.5,11.5 Q16.8,12.5 18,14" />
        {/* top-right */}
        <path d="M73,11 Q69,12 67,16" />
        <path d="M71,11.3 Q68,12.3 66.5,15" />
        <path d="M69.5,11.5 Q67.2,12.5 66,14" />
        {/* bottom-left */}
        <path d="M11,93 Q15,92 17,88" />
        <path d="M13,92.7 Q16,91.7 17.5,89" />
        <path d="M14.5,92.5 Q16.8,91.5 18,90" />
        {/* bottom-right */}
        <path d="M73,93 Q69,92 67,88" />
        <path d="M71,92.7 Q68,91.7 66.5,89" />
        <path d="M69.5,92.5 Q67.2,91.5 66,90" />
      </g>
      {/* tiny terminal dots on the acanthus tendrils */}
      {[
        [17, 16], [67, 16], [17, 88], [67, 88],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r=".45" fill="var(--rubric)" opacity=".65" />
      ))}

      {/* ─── WEEKDAY INSCRIPTION BAND ───────────────────────────── */}
      <line x1="10" y1="23.5" x2="74" y2="23.5" stroke="var(--rubric)" strokeWidth=".35" opacity=".55" />
      <text
        x={42}
        y={19.5}
        fontFamily="var(--display)"
        fontSize="7.2"
        fill="var(--rubric)"
        textAnchor="middle"
        style={{
          fontVariant: "small-caps",
          letterSpacing: ".16em",
        }}
      >
        {weekday}
      </text>
      {/* Diamond flanks — tight to the weekday text */}
      <polygon points="14,17 16,19 14,21 12,19" fill="var(--rubric)" opacity=".75" />
      <polygon points="70,17 72,19 70,21 68,19" fill="var(--rubric)" opacity=".75" />
      {/* Scroll terminators beyond the diamonds */}
      <path d="M10,19 Q7.5,17 7,14" stroke="var(--rubric)" strokeWidth=".3" fill="none" opacity=".55" strokeLinecap="round" />
      <path d="M74,19 Q76.5,17 77,14" stroke="var(--rubric)" strokeWidth=".3" fill="none" opacity=".55" strokeLinecap="round" />

      {/* ─── OCTAGRAM + OUTER DOTTED RING behind the numeral ───── */}
      <g
        style={{
          animation: "sealBreathe 9s ease-in-out infinite",
          transformOrigin: "42px 56px",
        }}
      >
        <polygon
          points={pointRing(42, 56, 20, 7.5, 8)}
          fill="none"
          stroke="var(--rubric)"
          strokeWidth=".4"
          opacity={illuminated ? 0.55 : 0.38}
        />
        <polygon
          points={pointRing(42, 56, 13, 4.8, 8)}
          fill="var(--rubric)"
          opacity={illuminated ? 0.16 : 0.1}
        />
      </g>
      {/* Outer dotted ring — studded with four dots at the cardinal
          points, suggesting a clock-face or compass rose. */}
      <circle cx="42" cy="56" r="24" fill="none" stroke="var(--rubric)" strokeWidth=".2" opacity=".24" strokeDasharray="0.8,1.6" />
      {[
        [42, 32], [42, 80], [18, 56], [66, 56],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r=".7" fill="var(--rubric)" opacity=".55" />
      ))}

      {/* ─── DAY NUMERAL — Cinzel Decorative rubric at scale ───── */}
      <text
        x={j(42, 0.4)}
        y={j(66, 0.4)}
        fontFamily="var(--font-cinzel), 'Cormorant SC', Georgia, serif"
        fontSize="30"
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
      {/* Gilt highlights — four small paper-coloured glints,
          jittered so no two dates read identical */}
      <circle cx={j(34, 0.4)} cy={j(50, 0.4)} r=".8" fill="var(--paper)" opacity=".48" />
      <circle cx={j(50, 0.4)} cy={j(62, 0.4)} r=".55" fill="var(--paper)" opacity=".35" />
      <circle cx={j(39, 0.3)} cy={j(58, 0.3)} r=".35" fill="var(--paper)" opacity=".28" />
      <circle cx={j(46, 0.3)} cy={j(53, 0.3)} r=".35" fill="var(--paper)" opacity=".28" />

      {/* ─── MONTH INSCRIPTION BAND ─────────────────────────────── */}
      <line x1="10" y1="82" x2="74" y2="82" stroke="var(--rubric)" strokeWidth=".35" opacity=".55" />
      <text
        x="42"
        y="92"
        fontFamily="var(--italic)"
        fontSize="8.4"
        fill="var(--ink-light)"
        textAnchor="middle"
        fontStyle="italic"
        style={{ letterSpacing: ".04em" }}
      >
        {month}
      </text>

      {/* ─── SCROLLED FOOT — rubric calligraphic flourish with
            hanging pendant ───────────────────────────────────── */}
      <g>
        {/* twin arcs curling toward central boss */}
        <path d="M12,112 Q26,117 42,114 Q58,117 72,112" fill="none" stroke="var(--rubric)" strokeWidth=".6" opacity=".78" />
        <path d="M18,112 Q24,114 28,113" fill="none" stroke="var(--rubric)" strokeWidth=".32" opacity=".55" />
        <path d="M66,112 Q60,114 56,113" fill="none" stroke="var(--rubric)" strokeWidth=".32" opacity=".55" />
        {/* Central boss — paper-cored rubric ring with star */}
        <circle cx="42" cy="115" r="2.1" fill="var(--paper-warm)" stroke="var(--rubric)" strokeWidth=".45" />
        <polygon points={pointRing(42, 115, 1.4, 0.55, 4)} fill="var(--rubric)" opacity=".92" />
        {/* Flanking dots — taper */}
        <circle cx="32" cy="116" r=".7" fill="var(--rubric)" opacity=".65" />
        <circle cx="52" cy="116" r=".7" fill="var(--rubric)" opacity=".65" />
        <circle cx="26" cy="116.5" r=".45" fill="var(--rubric)" opacity=".45" />
        <circle cx="58" cy="116.5" r=".45" fill="var(--rubric)" opacity=".45" />
        {/* Pendant / tassel hanging below the central boss — a
            short stem ending in a small rubric diamond, anchoring
            the composition visually. */}
        <line x1="42" y1="117" x2="42" y2="122" stroke="var(--rubric)" strokeWidth=".4" opacity=".65" />
        <polygon points="42,122 44,125 42,128 40,125" fill="var(--rubric)" opacity=".85" />
        <circle cx="42" cy="128.5" r=".45" fill="var(--rubric)" opacity=".55" />
      </g>
    </svg>
  );
}
