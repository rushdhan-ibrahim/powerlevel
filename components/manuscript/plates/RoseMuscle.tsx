"use client";

/**
 * THE ROSE WINDOW — eight petals for eight muscle groups.
 * Petal radius scales with the working sets accumulated in
 * the last lunation. The cathedral's gaze is symmetrical
 * because the body should be too.
 */

import { mulberry32, polar, pointRing } from "@/lib/manuscript";

type Group = { group: string; sets: number; tonnage: number };

const PETAL_ORDER = [
  "Chest",
  "Triceps",
  "Quads",
  "Calves",
  "Hamstrings",
  "Back",
  "Biceps",
  "Shoulders",
];

export function RoseMuscle({ data, seed = 137 }: { data: Group[]; seed?: number }) {
  const cx = 150;
  const cy = 150;
  const rng = mulberry32(seed);

  // Re-order to interleave push/pull around the rose
  const lookup = new Map(data.map((d) => [d.group, d]));
  const ordered = PETAL_ORDER.map(
    (g) => lookup.get(g) ?? { group: g, sets: 0, tonnage: 0 },
  );

  const maxSets = Math.max(...ordered.map((g) => g.sets), 1);
  // Petals at adjacent positions (45° apart) at distance ~72 will start
  // overlapping once radius > ~28. Capping max keeps the rose readable
  // even when one muscle dominates the week.
  const minPetal = 16;
  const maxPetal = 32;

  return (
    <svg viewBox="-20 -20 340 340" width="100%" height="280" aria-hidden="true">
      {/* outer tracery — slow turn */}
      <g style={{ animation: "spin 110s linear infinite", transformOrigin: `${cx}px ${cy}px` }}>
        {[136, 118, 92].map((r, i) => (
          <circle
            key={r}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--ink)"
            strokeWidth={i === 0 ? 0.6 : 0.3}
            opacity=".55"
          />
        ))}
        {/* hairline outer dashes */}
        <circle
          cx={cx}
          cy={cy}
          r={144}
          fill="none"
          stroke="var(--ink)"
          strokeWidth=".18"
          opacity=".18"
          strokeDasharray="1.5,5"
        />
      </g>

      {/* spokes */}
      {ordered.map((_, i) => {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const [x1, y1] = polar(cx, cy, 26, a);
        const [x2, y2] = polar(cx, cy, 134, a);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--ink)"
            strokeWidth={i % 2 === 0 ? 0.4 : 0.22}
            opacity={i % 2 === 0 ? 0.42 : 0.24}
          />
        );
      })}

      {/* the petals — counter-rotating */}
      <g style={{ animation: "spinR 140s linear infinite", transformOrigin: `${cx}px ${cy}px` }}>
        {ordered.map((g, i) => {
          const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
          // sqrt: a "low" petal still shows real mass next to a "heavy" one.
          const norm = g.sets > 0 ? Math.sqrt(g.sets / maxSets) : 0;
          const radius = g.sets > 0
            ? minPetal + norm * (maxPetal - minPetal)
            : minPetal * 0.7;
          const distance = 60 + norm * 12;
          const [x, y] = polar(cx, cy, distance, a);
          const isHeavy = norm > 0.66;
          return (
            <g key={g.group}>
              <circle
                cx={x + (rng() - 0.5) * 0.8}
                cy={y + (rng() - 0.5) * 0.8}
                r={radius}
                fill={isHeavy ? "var(--rubric)" : "var(--ink)"}
                fillOpacity={isHeavy ? 0.06 : 0.025}
                stroke={isHeavy ? "var(--rubric)" : "var(--ink)"}
                strokeWidth={isHeavy ? 0.7 : 0.5}
                opacity={g.sets === 0 ? 0.22 : 0.85}
              />
              {g.sets > 0 && (
                <circle
                  cx={x}
                  cy={y}
                  r={1.6 + norm * 1.4}
                  fill={isHeavy ? "var(--rubric)" : "var(--ink)"}
                  opacity=".82"
                />
              )}
            </g>
          );
        })}
      </g>

      {/* central seal */}
      <g style={{ animation: "breathe 11s ease-in-out infinite", transformOrigin: `${cx}px ${cy}px` }}>
        <polygon
          points={pointRing(cx, cy, 22, 9, 8)}
          fill="none"
          stroke="var(--rubric)"
          strokeWidth=".75"
          opacity=".82"
        />
        <polygon
          points={pointRing(cx, cy, 14, 5.4, 8)}
          fill="var(--rubric)"
          opacity=".4"
        />
      </g>

      {/* labels */}
      {ordered.map((g, i) => {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const [x, y] = polar(cx, cy, 154, a);
        return (
          <text
            key={g.group}
            x={x}
            y={y + 3}
            fontFamily="var(--italic)"
            fontStyle="italic"
            fontSize="8.5"
            fill="var(--ash)"
            opacity={g.sets > 0 ? 0.85 : 0.4}
            textAnchor="middle"
          >
            {g.group.toLowerCase()}
            {g.sets > 0 && (
              <tspan dx="3" fontFamily="var(--mono)" fill="var(--ink-light)" fontStyle="normal" opacity=".7">
                · {g.sets}
              </tspan>
            )}
          </text>
        );
      })}
    </svg>
  );
}
