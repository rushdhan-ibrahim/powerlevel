"use client";

/**
 * THE CHAPLET — a rosary of beads, one for each lift in the user's
 * regular practice. Bead size encodes session count; filled beads
 * are recently practiced, hollow beads are stagnant. Larger beads
 * mark every ninth station, as in the prayer cycle.
 */

import Link from "next/link";
import { mulberry32, polar, pointRing } from "@/lib/manuscript";

type Lift = {
  normalizedName: string;
  displayName: string;
  sessions: number;
  bestE1RM: number;
  daysSinceLast: number;
};

export function Chaplet({ lifts, seed = 222 }: { lifts: Lift[]; seed?: number }) {
  const cx = 150;
  const cy = 140;
  const ringR = 100;
  const rng = mulberry32(seed);

  const top = lifts.slice(0, 12);
  const maxSessions = Math.max(...top.map((l) => l.sessions), 1);

  if (top.length === 0) {
    return <EmptyChaplet />;
  }

  return (
    <svg viewBox="-20 -10 340 340" width="100%" height="300" aria-hidden="true">
      {/* the slow rotation of the chaplet ring */}
      <g style={{ animation: "spin 220s linear infinite", transformOrigin: `${cx}px ${cy}px` }}>
        <circle
          cx={cx}
          cy={cy}
          r={ringR}
          fill="none"
          stroke="var(--ink)"
          strokeWidth=".5"
          opacity=".42"
        />

        {top.map((lift, i) => {
          const angle = (i / top.length) * Math.PI * 2 - Math.PI / 2;
          const [x, y] = polar(cx, cy, ringR, angle);
          const norm = lift.sessions / maxSessions;
          const baseR = 2.4 + norm * 4.2;
          const stale = lift.daysSinceLast > 28;
          const isMilestone = i % 4 === 0;
          const r = isMilestone ? baseR + 1.5 : baseR;

          return (
            <g key={lift.normalizedName}>
              <circle
                cx={x + (rng() - 0.5) * 0.6}
                cy={y + (rng() - 0.5) * 0.6}
                r={r}
                fill={stale ? "none" : isMilestone ? "var(--rubric)" : "var(--ink)"}
                stroke={stale ? "var(--ink)" : isMilestone ? "var(--rubric)" : "var(--ink)"}
                strokeWidth={stale ? 0.5 : isMilestone ? 0.5 : 0.18}
                opacity={stale ? 0.45 : 0.88}
              />
              {/* bead glow for current PR holder */}
              {i === 0 && (
                <circle
                  cx={x}
                  cy={y}
                  r={r + 2.5}
                  fill="var(--rubric)"
                  opacity=".15"
                  style={{ animation: "pulse 5s ease-in-out infinite" }}
                />
              )}
            </g>
          );
        })}
      </g>

      {/* counter-rotating inner mark */}
      <g style={{ animation: "spinR 130s linear infinite", transformOrigin: `${cx}px ${cy}px` }}>
        <polygon
          points={pointRing(cx, cy, 38, 14, 8)}
          fill="none"
          stroke="var(--ink)"
          strokeWidth=".5"
          opacity=".55"
        />
      </g>

      {/* central seal */}
      <g style={{ animation: "breathe 9s ease-in-out infinite", transformOrigin: `${cx}px ${cy}px` }}>
        <polygon
          points={pointRing(cx, cy, 14, 5.4, 8)}
          fill="var(--rubric)"
          opacity=".82"
        />
      </g>

      {/* the hanging chain */}
      <g style={{ animation: "sway 14s ease-in-out infinite", transformOrigin: `${cx}px ${cy + ringR}px`, ["--sw" as string]: "1.4" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <g key={i}>
            <line
              x1={cx}
              y1={cy + ringR + 6 + i * 12}
              x2={cx}
              y2={cy + ringR + 14 + i * 12}
              stroke="var(--ink)"
              strokeWidth=".4"
              opacity=".68"
            />
            <circle
              cx={cx}
              cy={cy + ringR + 18 + i * 12}
              r={i === 4 ? 5.5 : 1.8}
              fill={i === 4 ? "var(--rubric)" : "var(--ink)"}
              opacity={i === 4 ? 0.85 : 0.7}
            />
          </g>
        ))}
      </g>

      {/* lift names as marginalia (only top 6 to avoid crowding) */}
      {top.slice(0, 6).map((lift, i) => {
        const angle = (i / top.length) * Math.PI * 2 - Math.PI / 2;
        const [tx, ty] = polar(cx, cy, ringR + 18, angle);
        const flip = tx < cx;
        return (
          <text
            key={lift.normalizedName}
            x={tx}
            y={ty + 3}
            fontFamily="var(--italic)"
            fontStyle="italic"
            fontSize="8"
            fill="var(--ash)"
            opacity=".82"
            textAnchor={flip ? "end" : "start"}
          >
            {lift.displayName.toLowerCase()}
          </text>
        );
      })}
    </svg>
  );
}

function EmptyChaplet() {
  const cx = 150;
  const cy = 140;
  return (
    <svg viewBox="-20 -10 340 340" width="100%" height="300" aria-hidden="true">
      <g style={{ animation: "spin 200s linear infinite", transformOrigin: `${cx}px ${cy}px` }}>
        <circle cx={cx} cy={cy} r={100} fill="none" stroke="var(--ink)" strokeWidth=".4" opacity=".25" />
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const x = cx + 100 * Math.cos(angle);
          const y = cy + 100 * Math.sin(angle);
          return (
            <circle key={i} cx={x} cy={y} r={2.4} fill="none" stroke="var(--ink)" strokeWidth=".35" opacity=".4" />
          );
        })}
      </g>
      <text
        x="150"
        y={cy + 4}
        fontFamily="var(--italic)"
        fontStyle="italic"
        fontSize="11"
        fill="var(--ash)"
        opacity=".5"
        textAnchor="middle"
      >
        beads waiting to be strung
      </text>
    </svg>
  );
}
