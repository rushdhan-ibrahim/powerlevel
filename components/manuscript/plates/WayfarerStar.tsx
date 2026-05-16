"use client";

/**
 * THE WAYFARER STAR — running's PR star, sibling to PilgrimStar.
 *
 * Four cardinal axes for the four canonical distances (1k N, 5k E,
 * 10k S, 3k W). Along each axis a chain of dots traces PR
 * progression in time — the further from centre, the more recent.
 * The outermost dot of each chain is the all-time best (rubric,
 * with a slow pulse on the most recently set one across all four).
 *
 * Echoes PilgrimStar deliberately: the same eight-point silhouette
 * spins behind, the central radiance and outer wheels are identical.
 * The fingerprint that says "running, not lifting" is the four-axis
 * spoke pattern and the pace formatting on the tips.
 */

import { polar, pointRing } from "@/lib/manuscript";
import { format } from "date-fns";

type Progression = { date: Date; paceSecPerKm: number; runId: string };

export function WayfarerStar({
  progression,
}: {
  progression: Record<1000 | 3000 | 5000 | 10000, Progression[]>;
}) {
  const cx = 150;
  const cy = 150;

  // Cardinal-order: N=1k, E=5k, S=10k, W=3k.
  // This is a deliberate aesthetic choice: 5k on the east axis (the
  // "spoken" direction) because the active race is a 5k, and 10k
  // anchored south as the heaviest commitment.
  const axes: { distanceM: 1000 | 3000 | 5000 | 10000; angle: number; label: string }[] = [
    { distanceM: 1000, angle: -Math.PI / 2,                  label: "1 km" },
    { distanceM: 5000, angle: 0,                              label: "5 km" },
    { distanceM: 10000, angle: Math.PI / 2,                   label: "10 km" },
    { distanceM: 3000, angle: Math.PI,                        label: "3 km" },
  ];

  // Determine the freshest PR (across all distances) so we can put
  // the soft pulse on the one most-recently set.
  const allLatest = axes
    .map((a) => progression[a.distanceM].at(-1))
    .filter((x): x is Progression => !!x);
  const freshest = allLatest.length
    ? allLatest.reduce((a, b) => (a.date > b.date ? a : b))
    : null;

  const fmtPace = (s: number) => {
    const m = Math.floor(s / 60);
    const r = Math.round(s - m * 60);
    return `${m}:${String(r).padStart(2, "0")}`;
  };

  return (
    <svg viewBox="-46 -22 392 354" width="100%" height="300" aria-hidden="true">
      {/* outer wheels — same family as PilgrimStar but at slightly
          different radii so they read as cousins, not duplicates */}
      <g style={{ animation: "spinR 180s linear infinite", transformOrigin: `${cx}px ${cy}px` }}>
        {[140, 110, 80, 50].map((r, i) => (
          <circle
            key={r}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--ink)"
            strokeWidth={i === 0 ? 0.55 : 0.22}
            opacity={i === 0 ? 0.55 : 0.32}
            strokeDasharray={i === 2 ? "2,5" : undefined}
          />
        ))}
      </g>

      {/* a faint eight-point silhouette behind, breathing — the
          shared visual fingerprint with PilgrimStar */}
      <g
        style={{
          animation: "breathe 14s ease-in-out infinite",
          transformOrigin: `${cx}px ${cy}px`,
        }}
      >
        <polygon
          points={pointRing(cx, cy, 82, 24, 8)}
          fill="none"
          stroke="var(--ink)"
          strokeWidth=".4"
          opacity=".18"
        />
      </g>

      {/* central rubric radiance */}
      <polygon
        points={pointRing(cx, cy, 18, 7, 4)}
        fill="var(--rubric)"
        opacity=".9"
      />
      <circle cx={cx} cy={cy} r={3.6} fill="var(--paper)" />

      {/* four roads — one per distance */}
      {axes.map((a) => {
        const chain = progression[a.distanceM];
        const [tipX, tipY] = polar(cx, cy, 128, a.angle);
        const [innerX, innerY] = polar(cx, cy, 26, a.angle);

        return (
          <g key={a.distanceM}>
            {/* the road (spoke) */}
            <line
              x1={innerX}
              y1={innerY}
              x2={tipX}
              y2={tipY}
              stroke="var(--ink)"
              strokeWidth={chain.length ? 0.45 : 0.2}
              opacity={chain.length ? 0.55 : 0.22}
            />

            {/* progression beads — older near centre, newer further out.
                Position evenly along the spoke; size grows toward the tip. */}
            {chain.length > 1 && chain.slice(0, -1).map((p, idx) => {
              // Normalise position 0..1 over the spoke, leaving the tip for the all-time best.
              const t = chain.length > 1 ? (idx + 1) / chain.length : 0;
              const r = 32 + t * 90;
              const [x, y] = polar(cx, cy, r, a.angle);
              const size = 1.4 + t * 1.1;
              return (
                <circle
                  key={p.runId}
                  cx={x}
                  cy={y}
                  r={size}
                  fill="var(--ink)"
                  opacity={0.25 + t * 0.35}
                />
              );
            })}

            {/* the all-time best at the tip */}
            {chain.length > 0 && (() => {
              const pr = chain[chain.length - 1];
              const isFreshest = freshest && pr.runId === freshest.runId;
              return (
                <>
                  {isFreshest && (
                    <circle
                      cx={tipX}
                      cy={tipY}
                      r={9}
                      fill="var(--rubric)"
                      opacity=".18"
                      style={{ animation: "pulse 4s ease-in-out infinite" }}
                    />
                  )}
                  <circle
                    cx={tipX}
                    cy={tipY}
                    r={isFreshest ? 4.6 : 3.6}
                    fill="var(--rubric)"
                    opacity={isFreshest ? 0.95 : 0.82}
                  />
                </>
              );
            })()}

            {/* empty-spoke marker if no PRs yet for this distance */}
            {chain.length === 0 && (
              <circle
                cx={tipX}
                cy={tipY}
                r={2.4}
                fill="none"
                stroke="var(--ink)"
                strokeWidth=".4"
                opacity=".28"
              />
            )}

            {/* labels around the tips: distance (italic) + pace (rubric mono) */}
            {(() => {
              const dx = tipX - cx;
              const dy = tipY - cy;
              let anchor: "start" | "middle" | "end";
              if (Math.abs(dx) < 4) anchor = "middle";
              else if (dx < 0) anchor = "end";
              else anchor = "start";
              const above = dy < -8;
              const offsetR = Math.abs(dx) < 4 ? 18 : 14;
              const [labelX, labelY] = polar(cx, cy, 128 + offsetR, a.angle);
              const pr = chain[chain.length - 1];
              return (
                <g>
                  <text
                    x={labelX}
                    y={labelY + (above ? -4 : 2)}
                    fontFamily="var(--italic)"
                    fontStyle="italic"
                    fontSize="8.5"
                    fill="var(--ash)"
                    opacity=".88"
                    textAnchor={anchor}
                  >
                    {a.label}
                  </text>
                  {pr && (
                    <text
                      x={labelX}
                      y={labelY + (above ? 5 : 11)}
                      fontFamily="var(--mono)"
                      fontSize="9"
                      fill="var(--rubric)"
                      opacity=".95"
                      textAnchor={anchor}
                      letterSpacing=".02em"
                    >
                      {fmtPace(pr.paceSecPerKm)}/km
                      <tspan
                        dx="3"
                        fill="var(--ash)"
                        opacity=".65"
                        fontSize="6.5"
                      >
                        {format(pr.date, "MMM yy").toLowerCase()}
                      </tspan>
                    </text>
                  )}
                </g>
              );
            })()}
          </g>
        );
      })}

      {/* no records at all — manuscript silence */}
      {allLatest.length === 0 && (
        <text
          x={cx}
          y={cy + 5}
          fontFamily="var(--italic)"
          fontStyle="italic"
          fontSize="10"
          fill="var(--ash)"
          opacity=".55"
          textAnchor="middle"
        >
          no roads walked yet
        </text>
      )}
    </svg>
  );
}
