"use client";

/**
 * A miniature illuminated day-marker. Echoes the Initial's vocabulary
 * at a scale that fits inside the history card's left column — a
 * proper manuscript tablet, not a typographic stack.
 *
 * MOTION — most elements are static hairline geometry, but a few
 * are animated very slowly so the tablet feels alive rather than
 * printed: the cap-star breathes, the outer compass ring rotates
 * over minutes, the four mid-edge diamonds pulse on staggered
 * cycles, the numeral's gilt glints flicker as if lit by candle,
 * and the pendant sways. All cycles are 8–220 seconds — far too
 * slow to read as "animation" consciously, which is the point.
 *
 * COLOUR — strictly monochrome: rubric + paper + ink + ash. Density
 * comes from layered hairlines, repeated small motifs, and
 * architectural elements (cap-star, mid-edge diamonds, pendant,
 * compass ring).
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
      viewBox="-10 -28 120 184"
      width="104"
      height="156"
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
           A tiny 8-point rose at the very top. Breathes slowly on
           its own cycle; the rising curls drift left-right almost
           imperceptibly via a sway animation. */}
      <g style={{ animation: "sealBreathe 11s ease-in-out infinite", transformOrigin: "50px -26px" }}>
        <polygon points={pointRing(50, -26, 3, 1.25, 8)} fill="var(--rubric)" opacity=".9" />
        <circle cx="50" cy="-26" r=".9" fill="var(--paper-warm)" />
      </g>
      {/* Flourish curls rising from the star — each sways gently */}
      <g style={{ animation: "dayCurlSwayL 14s ease-in-out infinite", transformOrigin: "45px -19px" }}>
        <path d="M45.5,-24 Q42,-22 42,-18" stroke="var(--rubric)" strokeWidth=".3" fill="none" opacity=".55" strokeLinecap="round" />
      </g>
      <g style={{ animation: "dayCurlSwayR 14s ease-in-out infinite", transformOrigin: "55px -19px" }}>
        <path d="M54.5,-24 Q58,-22 58,-18" stroke="var(--rubric)" strokeWidth=".3" fill="none" opacity=".55" strokeLinecap="round" />
      </g>

      {/* ─── PEDIMENT — architectural rubric cap ────────────────── */}
      <g>
        {/* Tiered triangles: large top, nested paper-cut V, smaller filled V inside */}
        <polygon points="42,-17 50,-9 58,-17" fill="var(--rubric)" opacity=".95" />
        <polygon points="45,-13 50,-8 55,-13" fill="var(--paper-warm)" />
        <polygon points="46.5,-12 50,-8.5 53.5,-12" fill="var(--rubric)" opacity=".92" />
        {/* Double-rule horizontal base of the pediment */}
        <line x1="18" y1="-5" x2="82" y2="-5" stroke="var(--rubric)" strokeWidth=".75" opacity=".8" />
        <line x1="22" y1="-3" x2="78" y2="-3" stroke="var(--rubric)" strokeWidth=".3" opacity=".44" />
        {/* Dot chain between the rules */}
        {dotChain(26, -4, 74, -4, 12, 0.3, 0.48)}
        {/* Flanking rubric bosses with multiple rings — breathing softly */}
        {[10, 90].map((cx, i) => (
          <g
            key={i}
            style={{
              animation: `sealBreathe ${14 + i * 1}s ease-in-out ${i * 2}s infinite`,
              transformOrigin: `${cx}px -5px`,
            }}
          >
            <circle cx={cx} cy="-5" r="2.6" fill="var(--paper-warm)" stroke="var(--rubric)" strokeWidth=".5" />
            <circle cx={cx} cy="-5" r="1.6" fill="none" stroke="var(--rubric)" strokeWidth=".28" opacity=".55" />
            <polygon points={pointRing(cx, -5, 1.6, 0.6, 4)} fill="var(--rubric)" opacity=".95" />
          </g>
        ))}
        {/* Outer filigree scrolls emerging from the bosses */}
        <path d="M5,-5 Q1,-5 0,-1" stroke="var(--rubric)" strokeWidth=".3" fill="none" opacity=".5" strokeLinecap="round" />
        <path d="M95,-5 Q99,-5 100,-1" stroke="var(--rubric)" strokeWidth=".3" fill="none" opacity=".5" strokeLinecap="round" />
      </g>

      {/* ─── OUTER PAPER PANEL — the illuminated tablet ────────── */}
      <rect x="0" y="0" width="100" height="124" rx="2.4" fill="var(--paper-warm)" />
      {/* Rubric main frame */}
      <rect x="1" y="1" width="98" height="122" rx="1.8" fill="none" stroke="var(--rubric)" strokeWidth="1.05" opacity=".9" />
      {/* Crosshatch layers */}
      <rect x="1.8" y="1.8" width="96.4" height="120.4" fill={`url(#${hatchId})`} />
      <rect x="1.8" y="1.8" width="96.4" height="120.4" fill={`url(#${hatchId2})`} />
      {/* Inner hairline frame */}
      <rect x="3.6" y="3.6" width="92.8" height="116.8" fill="none" stroke="var(--rubric)" strokeWidth=".45" opacity=".5" />
      {/* Dashed inner-inner frame */}
      <rect x="5.5" y="5.5" width="89" height="113" fill="none" stroke="var(--rubric)" strokeWidth=".28" opacity=".33" strokeDasharray="1.3,2" />
      {/* Dot chain along the two long edges (inner) */}
      {dotChain(11, 5, 89, 5, 20, 0.32, 0.44)}
      {dotChain(11, 119, 89, 119, 20, 0.32, 0.44)}

      {/* ─── MID-EDGE ORNAMENTS — small rubric diamonds marking
            the midpoint of each outer frame edge. Each breathes on
            its own stagger so the composition has multiple slow
            pulses in counterpoint. */}
      {[
        [50, 1,   14],  // top
        [50, 123, 16],  // bottom
        [1, 62,   17],  // left
        [99, 62,  15],  // right
      ].map(([x, y, dur], i) => (
        <g
          key={i}
          style={{
            animation: `sealBreathe ${dur}s ease-in-out ${i * 3}s infinite`,
            transformOrigin: `${x}px ${y}px`,
          }}
        >
          <polygon points={pointRing(x, y, 1.9, 0.7, 4)} fill="var(--paper-warm)" stroke="var(--rubric)" strokeWidth=".4" />
          <polygon points={pointRing(x, y, 1.2, 0.45, 4)} fill="var(--rubric)" opacity=".85" />
        </g>
      ))}

      {/* ─── CORNER BOSSES — concentric rings with rubric stars,
            with filigree tails curling inward ─────────────────── */}
      {[
        [6, 6, 1, 1],
        [94, 6, -1, 1],
        [6, 118, 1, -1],
        [94, 118, -1, -1],
      ].map(([x, y, sx, sy], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="3.3" fill="var(--paper-warm)" stroke="var(--rubric)" strokeWidth=".5" />
          <circle cx={x} cy={y} r="2" fill="none" stroke="var(--rubric)" strokeWidth=".28" opacity=".55" />
          <g
            style={{
              animation: `spinR ${200 + i * 23}s linear infinite`,
              transformOrigin: `${x}px ${y}px`,
            }}
          >
            <polygon points={pointRing(x, y, 2.1, 0.75, 4)} fill="var(--rubric)" opacity=".92" />
          </g>
          {/* tiny filigree tail curling into the panel */}
          <path
            d={`M${x + 2.6 * sx},${y + 2.6 * sy} Q${x + 6 * sx},${y + 4 * sy} ${x + 8.5 * sx},${y + 6 * sy}`}
            stroke="var(--rubric)"
            strokeWidth=".35"
            fill="none"
            opacity=".5"
            strokeLinecap="round"
          />
        </g>
      ))}

      {/* ─── INNER FILIGREE — triple-arc acanthus tendrils ────── */}
      <g stroke="var(--rubric)" strokeWidth=".42" fill="none" opacity=".62" strokeLinecap="round">
        {/* top-left */}
        <path d="M13,13 Q18,14 20,19" />
        <path d="M15.5,13.4 Q19,14.4 20.8,17.8" />
        <path d="M17.5,13.8 Q20,14.8 21.5,16.5" />
        {/* top-right */}
        <path d="M87,13 Q82,14 80,19" />
        <path d="M84.5,13.4 Q81,14.4 79.2,17.8" />
        <path d="M82.5,13.8 Q80,14.8 78.5,16.5" />
        {/* bottom-left */}
        <path d="M13,111 Q18,110 20,105" />
        <path d="M15.5,110.6 Q19,109.6 20.8,106.2" />
        <path d="M17.5,110.2 Q20,109.2 21.5,107.5" />
        {/* bottom-right */}
        <path d="M87,111 Q82,110 80,105" />
        <path d="M84.5,110.6 Q81,109.6 79.2,106.2" />
        <path d="M82.5,110.2 Q80,109.2 78.5,107.5" />
      </g>
      {[
        [20, 19], [80, 19], [20, 105], [80, 105],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r=".5" fill="var(--rubric)" opacity=".68" />
      ))}

      {/* ─── WEEKDAY INSCRIPTION BAND ───────────────────────────── */}
      <line x1="12" y1="28" x2="88" y2="28" stroke="var(--rubric)" strokeWidth=".4" opacity=".55" />
      <text
        x="50"
        y="23.5"
        fontFamily="var(--display)"
        fontSize="8.6"
        fill="var(--rubric)"
        textAnchor="middle"
        style={{
          fontVariant: "small-caps",
          letterSpacing: ".16em",
        }}
      >
        {weekday}
      </text>
      {/* Diamond flanks */}
      <polygon points="16,20 18.4,22.5 16,25 13.6,22.5" fill="var(--rubric)" opacity=".78" />
      <polygon points="84,20 86.4,22.5 84,25 81.6,22.5" fill="var(--rubric)" opacity=".78" />
      {/* Scroll terminators beyond the diamonds */}
      <path d="M12,22.5 Q9,20 8.5,16.5" stroke="var(--rubric)" strokeWidth=".35" fill="none" opacity=".55" strokeLinecap="round" />
      <path d="M88,22.5 Q91,20 91.5,16.5" stroke="var(--rubric)" strokeWidth=".35" fill="none" opacity=".55" strokeLinecap="round" />

      {/* ─── OUTER COMPASS-RING rotating slowly behind the numeral.
           Very slow (~180s per revolution) — never looks like "a
           spinning thing"; just lends a living drift to the eye. */}
      <g
        style={{
          animation: "spin 180s linear infinite",
          transformOrigin: "50px 66px",
        }}
      >
        <circle cx="50" cy="66" r="29" fill="none" stroke="var(--rubric)" strokeWidth=".22" opacity=".28" strokeDasharray="0.8,1.8" />
        {[
          [50, 37], [50, 95], [21, 66], [79, 66],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r=".85" fill="var(--rubric)" opacity=".55" />
        ))}
        {/* small diamond beads between the cardinals */}
        {[
          [29, 45], [71, 45], [29, 87], [71, 87],
        ].map(([x, y], i) => (
          <polygon key={i} points={pointRing(x, y, 0.9, 0.35, 4)} fill="var(--rubric)" opacity=".4" />
        ))}
      </g>

      {/* ─── OCTAGRAM behind the numeral — breathing ──────────── */}
      <g
        style={{
          animation: "sealBreathe 9s ease-in-out infinite",
          transformOrigin: "50px 66px",
        }}
      >
        <polygon
          points={pointRing(50, 66, 22, 8.2, 8)}
          fill="none"
          stroke="var(--rubric)"
          strokeWidth=".45"
          opacity={illuminated ? 0.58 : 0.4}
        />
        <polygon
          points={pointRing(50, 66, 15, 5.5, 8)}
          fill="var(--rubric)"
          opacity={illuminated ? 0.16 : 0.11}
        />
      </g>

      {/* ─── DAY NUMERAL ─────────────────────────────────────── */}
      <text
        x={j(50, 0.4)}
        y={j(78, 0.4)}
        fontFamily="var(--font-cinzel), 'Cormorant SC', Georgia, serif"
        fontSize="36"
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
      {/* Gilt highlights — flicker on independent slow cycles, as
          if lit by a candle. Very low-amplitude opacity oscillation. */}
      {[
        { cx: j(40, 0.5), cy: j(58, 0.5), r: 1,   op: 0.5,  dur: 7 },
        { cx: j(60, 0.5), cy: j(72, 0.5), r: 0.7, op: 0.38, dur: 9 },
        { cx: j(46, 0.4), cy: j(68, 0.4), r: 0.45, op: 0.3, dur: 11 },
        { cx: j(55, 0.4), cy: j(62, 0.4), r: 0.45, op: 0.3, dur: 13 },
      ].map((g, i) => (
        <circle
          key={i}
          cx={g.cx}
          cy={g.cy}
          r={g.r}
          fill="var(--paper)"
          opacity={g.op}
          style={{
            animation: `giltFlicker ${g.dur}s ease-in-out ${i * 1.7}s infinite`,
          }}
        />
      ))}

      {/* ─── MONTH INSCRIPTION BAND ─────────────────────────────── */}
      <line x1="12" y1="98" x2="88" y2="98" stroke="var(--rubric)" strokeWidth=".4" opacity=".55" />
      <text
        x="50"
        y="110"
        fontFamily="var(--italic)"
        fontSize="10"
        fill="var(--ink-light)"
        textAnchor="middle"
        fontStyle="italic"
        style={{ letterSpacing: ".04em" }}
      >
        {month}
      </text>

      {/* ─── SCROLLED FOOT — twin-arc with hanging pendant ─────── */}
      <g>
        <path d="M14,134 Q32,140 50,136 Q68,140 86,134" fill="none" stroke="var(--rubric)" strokeWidth=".7" opacity=".8" />
        <path d="M22,134 Q28,136 32,135" fill="none" stroke="var(--rubric)" strokeWidth=".36" opacity=".55" />
        <path d="M78,134 Q72,136 68,135" fill="none" stroke="var(--rubric)" strokeWidth=".36" opacity=".55" />
        <circle cx="50" cy="137" r="2.4" fill="var(--paper-warm)" stroke="var(--rubric)" strokeWidth=".5" />
        <polygon points={pointRing(50, 137, 1.6, 0.6, 4)} fill="var(--rubric)" opacity=".92" />
        <circle cx="38" cy="138" r=".8" fill="var(--rubric)" opacity=".65" />
        <circle cx="62" cy="138" r=".8" fill="var(--rubric)" opacity=".65" />
        <circle cx="31" cy="138.5" r=".5" fill="var(--rubric)" opacity=".45" />
        <circle cx="69" cy="138.5" r=".5" fill="var(--rubric)" opacity=".45" />
        {/* Hanging pendant — breathes on a very slow cycle. */}
        <g
          style={{
            animation: "pendantBreathe 13s ease-in-out infinite",
            transformOrigin: "50px 137px",
          }}
        >
          <line x1="50" y1="139" x2="50" y2="146" stroke="var(--rubric)" strokeWidth=".45" opacity=".7" />
          <polygon points="50,146 52.6,149.5 50,153 47.4,149.5" fill="var(--rubric)" opacity=".88" />
          <circle cx="50" cy="154" r=".55" fill="var(--rubric)" opacity=".6" />
        </g>
      </g>
    </svg>
  );
}
