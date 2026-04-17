"use client";

/**
 * ILLUMINATED INITIAL — a proper drop-cap with the gravity of an
 * illuminated manuscript opening. Nested borders with corner
 * bosses; crosshatched ink background behind a paper-coloured
 * letter; a breathing rubric star-polygon ornamenting the void
 * behind the glyph; small rubric pediment and scrolled foot
 * extending slightly above and below the panel.
 *
 * The component is purely presentational — accepts just a letter
 * (single character). Variants are selected by a seed so repeats
 * across long scrolls still feel hand-drawn.
 */

import { mulberry32, polar, pointRing } from "@/lib/manuscript";

type Props = {
  letter: string;
  seed?: number;
  size?: number;
};

export function Initial({ letter, seed, size = 68 }: Props) {
  const baseSeed = seed ?? (letter.charCodeAt(0) * 31 + 7);
  const rng = mulberry32(baseSeed);

  // slight jitter on a few positions so no two initials feel identical
  const j = (v: number, a = 1) => v + (rng() - 0.5) * a;

  return (
    <span className="initial" style={{ width: size, height: size * 1.18 }}>
      <svg
        viewBox="0 -10 64 74"
        width="100%"
        height="100%"
        aria-hidden="true"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* crosshatch pattern for the panel background */}
          <pattern id={`hatch-${baseSeed}`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="4" stroke="var(--paper)" strokeWidth=".35" opacity=".18" />
          </pattern>
          <pattern id={`hatch2-${baseSeed}`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <line x1="0" y1="0" x2="0" y2="4" stroke="var(--paper)" strokeWidth=".25" opacity=".1" />
          </pattern>
        </defs>

        {/* TOP PEDIMENT — rubric tab extending above the panel */}
        <g>
          <polygon
            points="28,-6 32,-10 36,-6"
            fill="var(--rubric)"
            opacity=".85"
          />
          <line x1="20" y1="-4" x2="44" y2="-4" stroke="var(--rubric)" strokeWidth=".6" opacity=".7" />
          <circle cx="16" cy="-4" r="1.2" fill="var(--rubric)" opacity=".85" />
          <circle cx="48" cy="-4" r="1.2" fill="var(--rubric)" opacity=".85" />
        </g>

        {/* OUTER FRAME — solid ink panel */}
        <rect x="0" y="0" width="64" height="64" fill="var(--ink)" rx="1" />

        {/* CROSSHATCH BACKGROUND (two directions) */}
        <rect x="2" y="2" width="60" height="60" fill={`url(#hatch-${baseSeed})`} />
        <rect x="2" y="2" width="60" height="60" fill={`url(#hatch2-${baseSeed})`} />

        {/* OUTER HAIRLINE BORDER (paper-coloured, fine) */}
        <rect x="1.5" y="1.5" width="61" height="61" fill="none" stroke="var(--paper)" strokeWidth=".6" opacity=".85" />

        {/* MIDDLE BORDER — double rule */}
        <rect x="4" y="4" width="56" height="56" fill="none" stroke="var(--paper)" strokeWidth=".35" opacity=".45" />
        <rect x="5.5" y="5.5" width="53" height="53" fill="none" stroke="var(--paper)" strokeWidth=".2" opacity=".28" />

        {/* CORNER BOSSES — rubric 4-point stars in each corner of the middle border */}
        {[
          [5.5, 5.5],
          [58.5, 5.5],
          [5.5, 58.5],
          [58.5, 58.5],
        ].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="2.2" fill="var(--ink)" stroke="var(--paper)" strokeWidth=".3" opacity=".9" />
            <polygon
              points={pointRing(x, y, 1.8, 0.7, 4)}
              fill="var(--rubric)"
              opacity=".9"
            />
          </g>
        ))}

        {/* INNER FLOURISH CORNERS — delicate paper-coloured arcs in each inner corner */}
        <path
          d="M9,9 Q12,10 14,13"
          fill="none"
          stroke="var(--paper)"
          strokeWidth=".4"
          opacity=".55"
        />
        <path
          d="M55,9 Q52,10 50,13"
          fill="none"
          stroke="var(--paper)"
          strokeWidth=".4"
          opacity=".55"
        />
        <path
          d="M9,55 Q12,54 14,51"
          fill="none"
          stroke="var(--paper)"
          strokeWidth=".4"
          opacity=".55"
        />
        <path
          d="M55,55 Q52,54 50,51"
          fill="none"
          stroke="var(--paper)"
          strokeWidth=".4"
          opacity=".55"
        />

        {/* BREATHING RUBRIC STAR behind the letter */}
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

        {/* SUBTLE SPINNING OUTER RING */}
        <g style={{ animation: "spin 120s linear infinite", transformOrigin: "32px 32px" }}>
          <circle cx="32" cy="32" r="26" fill="none" stroke="var(--paper)" strokeWidth=".18" opacity=".22" strokeDasharray="1.2,3" />
        </g>

        {/* THE LETTER — Gothic blackletter at centre, paper-coloured */}
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

        {/* tiny paper-coloured glints suggesting gilded highlight on the letter */}
        <circle cx={j(23, 0.4)} cy={j(20, 0.4)} r="1" fill="var(--paper)" opacity=".45" />
        <circle cx={j(42, 0.4)} cy={j(42, 0.4)} r=".7" fill="var(--paper)" opacity=".35" />

        {/* BOTTOM SCROLLED FOOT — rubric flourish */}
        <g>
          <path
            d="M14,68 Q32,71 50,68"
            fill="none"
            stroke="var(--rubric)"
            strokeWidth=".55"
            opacity=".7"
          />
          <circle cx="32" cy="69.5" r="1.4" fill="var(--rubric)" opacity=".85" />
          {[...Array(4)].map((_, i) => {
            const a = -Math.PI / 2 + (i - 1.5) * 0.2;
            const [px, py] = polar(32, 69.5, 6, a);
            return <circle key={i} cx={px} cy={py + 1} r=".6" fill="var(--rubric)" opacity=".6" />;
          })}
        </g>
      </svg>
    </span>
  );
}
