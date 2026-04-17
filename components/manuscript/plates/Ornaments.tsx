"use client";

/**
 * Inline section ornaments — small SVG marks that punctuate prose
 * with more presence than the text-only Ornament dividers. Each is
 * around 90–140px wide and quietly animated.
 */

import { polar, pointRing } from "@/lib/manuscript";

/** Two interlocking diamonds with a rubric centre. */
export function OrnamentDiamondPair({ size = 120 }: { size?: number }) {
  return (
    <svg viewBox="0 0 200 50" width={size} height={(size * 50) / 200} aria-hidden="true">
      <line x1="0" y1="25" x2="60" y2="25" stroke="var(--ink)" strokeWidth=".35" opacity=".25" />
      <line x1="140" y1="25" x2="200" y2="25" stroke="var(--ink)" strokeWidth=".35" opacity=".25" />
      <polygon points="76,25 88,10 100,25 88,40" fill="none" stroke="var(--ink)" strokeWidth=".55" opacity=".7" />
      <polygon points="100,25 112,10 124,25 112,40" fill="none" stroke="var(--ink)" strokeWidth=".55" opacity=".7" />
      <polygon
        points="100,15 106,25 100,35 94,25"
        fill="var(--rubric)"
        opacity=".85"
        style={{ animation: "pulse 5s ease-in-out infinite" }}
      />
    </svg>
  );
}

/** A small spinning compass rose. */
export function OrnamentRose({ size = 90 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <g style={{ animation: "spin 80s linear infinite", transformOrigin: "50px 50px" }}>
        <circle cx="50" cy="50" r="42" fill="none" stroke="var(--ink)" strokeWidth=".3" opacity=".4" />
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
          const [x, y] = polar(50, 50, 42, a);
          return (
            <line
              key={i}
              x1="50"
              y1="50"
              x2={x}
              y2={y}
              stroke="var(--ink)"
              strokeWidth={i % 4 === 0 ? 0.5 : 0.18}
              opacity={i % 4 === 0 ? 0.55 : 0.22}
            />
          );
        })}
      </g>
      <polygon points={pointRing(50, 50, 14, 5, 4)} fill="var(--rubric)" opacity=".85" />
    </svg>
  );
}

/** A breathing quatrefoil — four overlapping circles. */
export function OrnamentQuatrefoil({ size = 90 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <g style={{ animation: "breathe 10s ease-in-out infinite", transformOrigin: "50px 50px" }}>
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((a, i) => {
          const [cx, cy] = polar(50, 50, 16, a);
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="20"
              fill="none"
              stroke="var(--ink)"
              strokeWidth=".5"
              opacity=".75"
            />
          );
        })}
      </g>
      <circle cx="50" cy="50" r="3" fill="var(--rubric)" opacity=".9" />
    </svg>
  );
}

/** Three small rotating beads. */
export function OrnamentTriad({ size = 60 }: { size?: number }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} aria-hidden="true">
      <g style={{ animation: "spin 30s linear infinite", transformOrigin: "40px 40px" }}>
        {Array.from({ length: 3 }).map((_, i) => {
          const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
          const [x, y] = polar(40, 40, 24, a);
          return <circle key={i} cx={x} cy={y} r="3" fill="var(--rubric)" opacity=".85" />;
        })}
      </g>
      <circle cx="40" cy="40" r="1.4" fill="var(--ink)" opacity=".7" />
    </svg>
  );
}
