"use client";

/**
 * ILLUMINATED INITIAL — a proper drop-cap with the gravity of an
 * illuminated manuscript opening. Shares the vocabulary of the
 * IlluminatedDayBadge so one language carries throughout the codex:
 *
 *   CAP-STAR     breathing 8-point rose crowning the pediment, with
 *                two filigree curls swaying mirror-wise below it
 *   PEDIMENT     tiered triangle (large / paper-cut / small-filled)
 *                on a double rule with a dot-chain between, flanked
 *                by concentric-ring bosses and outward scrolls
 *   OUTER FRAME  four nested frames: main hairline, crosshatch,
 *                inner hairline, dashed inner-inner; dot-chains
 *                along the long edges
 *   MID-EDGE     four small rubric diamonds (top/bottom/left/right)
 *                each on its own slow breath
 *   CORNERS      concentric-ring bosses with counter-rotating
 *                4-point rubric stars + filigree tails into the panel
 *   FILIGREE     triple-arc acanthus tendrils in each inner corner
 *                with terminal dots
 *   COMPASS      dashed rubric ring around the octagram, studded
 *                with cardinal dots and diamond beads; rotates very
 *                slowly (180 s / revolution)
 *   OCTAGRAM     breathing 8-point star behind the letter
 *   LETTER       blackletter in paper-colour; gilt glints flicker
 *                independently on 7-13 s cycles
 *   FOOT         twin-arc scrolled flourish with pendant hanging
 *                below, gently swaying
 *
 * Stays strictly monochrome — rubric + ink + paper + ash. All
 * cycles 7–220 s, sub-conscious but lets the page feel like
 * living vellum.
 */

import { mulberry32, pointRing } from "@/lib/manuscript";

type Props = {
  letter: string;
  seed?: number;
  size?: number;
};

export function Initial({ letter, seed, size }: Props) {
  const baseSeed = seed ?? (letter.charCodeAt(0) * 31 + 7);
  const rng = mulberry32(baseSeed);
  const j = (v: number, a = 1) => v + (rng() - 0.5) * a;
  const hatchId = `init-hatch-${baseSeed}`;
  const hatchId2 = `init-hatch2-${baseSeed}`;
  // The `.initial` stylesheet rule owns sizing responsively
  // (desktop 104×124, mobile 94×112). Only fall back to an inline
  // style when a caller explicitly asks for a custom size.
  const sizeStyle =
    size != null ? { width: size, height: size * 1.2 } : undefined;

  // Dot-chain along an edge (rubric dots)
  const dotChain = (x1: number, y1: number, x2: number, y2: number, n: number, r = 0.3, op = 0.5) => {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      out.push(
        <circle
          key={`${x1}-${y1}-${i}`}
          cx={x1 + (x2 - x1) * t}
          cy={y1 + (y2 - y1) * t}
          r={r}
          fill="var(--paper)"
          opacity={op}
        />,
      );
    }
    return out;
  };

  return (
    <span className="initial" style={sizeStyle}>
      <svg
        viewBox="-8 -16 80 96"
        width="100%"
        height="100%"
        aria-hidden="true"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* crosshatch pattern for the panel background — paper
              threads over the dark ink field */}
          <pattern id={hatchId} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="4" stroke="var(--paper)" strokeWidth=".35" opacity=".18" />
          </pattern>
          <pattern id={hatchId2} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <line x1="0" y1="0" x2="0" y2="4" stroke="var(--paper)" strokeWidth=".25" opacity=".1" />
          </pattern>
        </defs>

        {/* ─── CAP-STAR — 8-point rubric rose crowning everything.
             Moved closer to the panel (y = -14 instead of -20) so it
             reads as attached to the tablet rather than floating free. */}
        <g style={{ animation: "sealBreathe 11s ease-in-out infinite", transformOrigin: "32px -14px" }}>
          <polygon points={pointRing(32, -14, 2.4, 1, 8)} fill="var(--rubric)" opacity=".9" />
          <circle cx="32" cy="-14" r=".7" fill="var(--paper)" />
        </g>
        {/* A short rubric stem linking the cap-star to the pediment
             below, so they read as one architectural unit. */}
        <line x1="32" y1="-12" x2="32" y2="-9" stroke="var(--rubric)" strokeWidth=".4" opacity=".6" />
        {/* Rising curls, each sways mirror-wise (tighter arcs) */}
        <g style={{ animation: "dayCurlSwayL 14s ease-in-out infinite", transformOrigin: "28px -10px" }}>
          <path d="M30,-13 Q27,-12 27,-9" stroke="var(--rubric)" strokeWidth=".3" fill="none" opacity=".6" strokeLinecap="round" />
        </g>
        <g style={{ animation: "dayCurlSwayR 14s ease-in-out infinite", transformOrigin: "36px -10px" }}>
          <path d="M34,-13 Q37,-12 37,-9" stroke="var(--rubric)" strokeWidth=".3" fill="none" opacity=".6" strokeLinecap="round" />
        </g>

        {/* ─── PEDIMENT — tiered rubric cap, tightened vertical ─── */}
        <g>
          <polygon points="24,-8 32,-3 40,-8" fill="var(--rubric)" opacity=".95" />
          <polygon points="27,-6 32,-2.5 37,-6" fill="var(--ink)" />
          <polygon points="28.5,-5 32,-3 35.5,-5" fill="var(--rubric)" opacity=".92" />
          {/* Double-rule base */}
          <line x1="10" y1="-1.2" x2="54" y2="-1.2" stroke="var(--rubric)" strokeWidth=".7" opacity=".8" />
          <line x1="14" y1=".2"   x2="50" y2=".2"   stroke="var(--rubric)" strokeWidth=".28" opacity=".4" />
          {dotChain(17, -.5, 47, -.5, 9, 0.26, 0.5)}
          {/* Flanking bosses */}
          {[6, 58].map((cx, i) => (
            <g
              key={i}
              style={{
                animation: `sealBreathe ${14 + i * 1.5}s ease-in-out ${i * 2}s infinite`,
                transformOrigin: `${cx}px -1.2px`,
              }}
            >
              <circle cx={cx} cy="-1.2" r="1.9" fill="var(--ink)" stroke="var(--rubric)" strokeWidth=".45" />
              <circle cx={cx} cy="-1.2" r="1.2" fill="none" stroke="var(--rubric)" strokeWidth=".25" opacity=".6" />
              <polygon points={pointRing(cx, -1.2, 1.3, 0.5, 4)} fill="var(--rubric)" opacity=".9" />
            </g>
          ))}
          <path d="M2,-1.2 Q-1,-1 -1.5,1" stroke="var(--rubric)" strokeWidth=".3" fill="none" opacity=".55" strokeLinecap="round" />
          <path d="M62,-1.2 Q65,-1 65.5,1" stroke="var(--rubric)" strokeWidth=".3" fill="none" opacity=".55" strokeLinecap="round" />
        </g>

        {/* ─── OUTER FRAME — solid ink panel with nested borders ── */}
        <rect x="0" y="0" width="64" height="64" fill="var(--ink)" rx="1.2" />
        <rect x="2" y="2" width="60" height="60" fill={`url(#${hatchId})`} />
        <rect x="2" y="2" width="60" height="60" fill={`url(#${hatchId2})`} />
        {/* Outer hairline border */}
        <rect x="1.5" y="1.5" width="61" height="61" fill="none" stroke="var(--paper)" strokeWidth=".6" opacity=".85" />
        {/* Middle double rule */}
        <rect x="4" y="4" width="56" height="56" fill="none" stroke="var(--paper)" strokeWidth=".35" opacity=".48" />
        <rect x="5.5" y="5.5" width="53" height="53" fill="none" stroke="var(--paper)" strokeWidth=".2" opacity=".3" strokeDasharray="1,1.6" />
        {/* Dot-chains along the top + bottom inner edge */}
        {dotChain(9, 4.3, 55, 4.3, 14, 0.26, 0.4)}
        {dotChain(9, 59.7, 55, 59.7, 14, 0.26, 0.4)}

        {/* ─── MID-EDGE ORNAMENTS on each frame side ─────────────── */}
        {[
          [32, 1.5, 14],  // top
          [32, 62.5, 15], // bottom
          [1.5, 32, 16],  // left
          [62.5, 32, 17], // right
        ].map(([x, y, dur], i) => (
          <g
            key={i}
            style={{
              animation: `sealBreathe ${dur}s ease-in-out ${i * 2.5}s infinite`,
              transformOrigin: `${x}px ${y}px`,
            }}
          >
            <polygon points={pointRing(x, y, 1.6, 0.55, 4)} fill="var(--ink)" stroke="var(--paper)" strokeWidth=".3" />
            <polygon points={pointRing(x, y, 1, 0.38, 4)} fill="var(--rubric)" opacity=".9" />
          </g>
        ))}

        {/* ─── CORNER BOSSES — counter-rotating stars + filigree ── */}
        {[
          [5.5, 5.5, 1, 1],
          [58.5, 5.5, -1, 1],
          [5.5, 58.5, 1, -1],
          [58.5, 58.5, -1, -1],
        ].map(([x, y, sx, sy], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="2.4" fill="var(--ink)" stroke="var(--paper)" strokeWidth=".35" opacity=".92" />
            <circle cx={x} cy={y} r="1.5" fill="none" stroke="var(--paper)" strokeWidth=".22" opacity=".55" />
            <g
              style={{
                animation: `spinR ${210 + i * 19}s linear infinite`,
                transformOrigin: `${x}px ${y}px`,
              }}
            >
              <polygon points={pointRing(x, y, 1.8, 0.7, 4)} fill="var(--rubric)" opacity=".9" />
            </g>
            {/* filigree tail into the panel */}
            <path
              d={`M${x + 1.9 * sx},${y + 1.9 * sy} Q${x + 4.5 * sx},${y + 3 * sy} ${x + 6.5 * sx},${y + 4.5 * sy}`}
              stroke="var(--paper)"
              strokeWidth=".3"
              fill="none"
              opacity=".5"
              strokeLinecap="round"
            />
          </g>
        ))}

        {/* ─── INNER FILIGREE — triple-arc acanthus tendrils ───── */}
        <g stroke="var(--paper)" strokeWidth=".4" fill="none" opacity=".5" strokeLinecap="round">
          {/* top-left */}
          <path d="M9,9 Q12,10 14,13" />
          <path d="M11,9.3 Q13,10.3 14.8,12" />
          <path d="M12.5,9.5 Q14,10.5 15.2,11.5" />
          {/* top-right */}
          <path d="M55,9 Q52,10 50,13" />
          <path d="M53,9.3 Q51,10.3 49.2,12" />
          <path d="M51.5,9.5 Q50,10.5 48.8,11.5" />
          {/* bottom-left */}
          <path d="M9,55 Q12,54 14,51" />
          <path d="M11,54.7 Q13,53.7 14.8,52" />
          <path d="M12.5,54.5 Q14,53.5 15.2,52.5" />
          {/* bottom-right */}
          <path d="M55,55 Q52,54 50,51" />
          <path d="M53,54.7 Q51,53.7 49.2,52" />
          <path d="M51.5,54.5 Q50,53.5 48.8,52.5" />
        </g>
        {[
          [14, 13], [50, 13], [14, 51], [50, 51],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r=".4" fill="var(--paper)" opacity=".65" />
        ))}

        {/* ─── COMPASS RING rotating slowly behind the letter ───── */}
        <g
          style={{
            animation: "spin 180s linear infinite",
            transformOrigin: "32px 32px",
          }}
        >
          <circle cx="32" cy="32" r="26" fill="none" stroke="var(--paper)" strokeWidth=".2" opacity=".28" strokeDasharray="1.2,2.4" />
          {[
            [32, 6], [32, 58], [6, 32], [58, 32],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r=".65" fill="var(--paper)" opacity=".5" />
          ))}
          {[
            [14, 14], [50, 14], [14, 50], [50, 50],
          ].map(([x, y], i) => (
            <polygon key={i} points={pointRing(x, y, 0.75, 0.3, 4)} fill="var(--paper)" opacity=".3" />
          ))}
        </g>

        {/* ─── OCTAGRAM — breathing rubric star behind the letter ─ */}
        <g style={{ animation: "sealBreathe 8s ease-in-out infinite", transformOrigin: "32px 32px" }}>
          <polygon
            points={pointRing(32, 32, 22, 9, 8)}
            fill="none"
            stroke="var(--rubric)"
            strokeWidth=".4"
            opacity=".55"
          />
          <polygon
            points={pointRing(32, 32, 14, 5, 8)}
            fill="var(--rubric)"
            opacity=".18"
          />
        </g>

        {/* ─── THE LETTER — Gothic blackletter, paper-coloured ──── */}
        <text
          x={j(32, 0.4)}
          y={j(50, 0.4)}
          fontSize="46"
          fontWeight="400"
          fill="var(--paper)"
          textAnchor="middle"
          className="initial-letter"
          style={{
            fontFamily: "var(--font-blackletter), 'UnifrakturMaguntia', Georgia, serif",
            letterSpacing: "0",
          }}
        >
          {letter}
        </text>
        {/* Gilt glints — flicker on independent cycles like candle-lit
            gold leaf highlights on the carved letter. */}
        {[
          { cx: j(23, 0.5), cy: j(20, 0.5), r: 1.1, op: 0.5,  dur: 7 },
          { cx: j(42, 0.5), cy: j(42, 0.5), r: 0.8, op: 0.4,  dur: 9 },
          { cx: j(27, 0.4), cy: j(36, 0.4), r: 0.5, op: 0.3,  dur: 11 },
          { cx: j(38, 0.4), cy: j(26, 0.4), r: 0.5, op: 0.3,  dur: 13 },
        ].map((g, i) => (
          <circle
            key={i}
            cx={g.cx}
            cy={g.cy}
            r={g.r}
            fill="var(--paper)"
            opacity={g.op}
            style={{
              animation: `giltFlicker ${g.dur}s ease-in-out ${i * 1.8}s infinite`,
            }}
          />
        ))}

        {/* ─── SCROLLED FOOT — tightened closer to the panel so the
             hanging pendant stays within the Initial's visual box ── */}
        <g>
          <path d="M10,67 Q22,70 32,68 Q42,70 54,67" fill="none" stroke="var(--rubric)" strokeWidth=".55" opacity=".75" />
          <path d="M16,67 Q20,68 23,68" fill="none" stroke="var(--rubric)" strokeWidth=".3" opacity=".55" />
          <path d="M48,67 Q44,68 41,68" fill="none" stroke="var(--rubric)" strokeWidth=".3" opacity=".55" />
          <circle cx="32" cy="68.8" r="1.5" fill="var(--ink)" stroke="var(--rubric)" strokeWidth=".4" />
          <polygon points={pointRing(32, 68.8, 1.1, 0.4, 4)} fill="var(--rubric)" opacity=".9" />
          <circle cx="24" cy="69" r=".55" fill="var(--rubric)" opacity=".65" />
          <circle cx="40" cy="69" r=".55" fill="var(--rubric)" opacity=".65" />
          <circle cx="19" cy="69.3" r=".35" fill="var(--rubric)" opacity=".45" />
          <circle cx="45" cy="69.3" r=".35" fill="var(--rubric)" opacity=".45" />
          {/* Pendant — shorter so it stays within the viewBox */}
          <g
            style={{
              animation: "pendantBreathe 13s ease-in-out infinite",
              transformOrigin: "32px 68.8px",
            }}
          >
            <line x1="32" y1="70" x2="32" y2="73" stroke="var(--rubric)" strokeWidth=".4" opacity=".7" />
            <polygon points="32,73 33.6,75 32,77 30.4,75" fill="var(--rubric)" opacity=".85" />
          </g>
        </g>
      </svg>
    </span>
  );
}
