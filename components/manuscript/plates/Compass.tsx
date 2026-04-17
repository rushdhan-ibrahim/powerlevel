"use client";

/**
 * THE COMPASS ROSE — decorative ornament. Two counter-rotating
 * wheels with cardinal spokes. Used between sections.
 */

import { polar } from "@/lib/manuscript";

export function Compass({ size = 220 }: { size?: number }) {
  const c = 110;
  const cy = 110;
  return (
    <svg viewBox="0 0 220 220" width={size} height={size} aria-hidden="true">
      <g style={{ animation: "spin 120s linear infinite", transformOrigin: `${c}px ${cy}px` }}>
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
          const [x, y] = polar(c, cy, 86, a);
          return (
            <line
              key={i}
              x1={c}
              y1={cy}
              x2={x}
              y2={y}
              stroke="var(--ink)"
              strokeWidth={i % 4 === 0 ? 0.5 : i % 2 === 0 ? 0.3 : 0.15}
              opacity={i % 4 === 0 ? 0.5 : 0.25}
            />
          );
        })}
        <circle cx={c} cy={cy} r={86} fill="none" stroke="var(--ink)" strokeWidth=".3" opacity=".25" />
      </g>
      <g style={{ animation: "spinR 80s linear infinite", transformOrigin: `${c}px ${cy}px` }}>
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          const [x, y] = polar(c, cy, 35, a);
          return (
            <polygon
              key={i}
              points={`${c},${cy} ${x},${y}`}
              fill="none"
              stroke="var(--ink)"
              strokeWidth=".4"
              opacity=".3"
            />
          );
        })}
      </g>
      <circle cx={c} cy={cy} r={5} fill="var(--rubric)" opacity=".45" />
    </svg>
  );
}
