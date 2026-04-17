"use client";

/**
 * THE PILGRIM STAR — eight points, eight stations of recent record.
 * Each star-tip bears the lift's name in italic and its e1RM in
 * rubric. The brightest tip is the freshest record.
 */

import { mulberry32, polar, pointRing } from "@/lib/manuscript";
import { format } from "date-fns";

type PR = {
  exerciseName: string;
  date: Date;
  e1RM: number;
  improvement: number;
};

export function PilgrimStar({ prs, seed = 405 }: { prs: PR[]; seed?: number }) {
  const cx = 150;
  const cy = 150;
  const top = prs.slice(0, 8);
  const rng = mulberry32(seed + top.length);

  return (
    <svg viewBox="-46 -22 392 354" width="100%" height="300" aria-hidden="true">
      {/* outer wheel */}
      <g style={{ animation: "spin 150s linear infinite", transformOrigin: `${cx}px ${cy}px` }}>
        {[132, 100, 70].map((r, i) => (
          <circle
            key={r}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--ink)"
            strokeWidth={i === 0 ? 0.55 : 0.25}
            opacity=".55"
          />
        ))}
      </g>

      {/* the eight-point star */}
      <g style={{ animation: "breathe 13s ease-in-out infinite", transformOrigin: `${cx}px ${cy}px` }}>
        <polygon
          points={pointRing(cx, cy, 78, 26, 8)}
          fill="none"
          stroke="var(--ink)"
          strokeWidth=".85"
          opacity=".82"
        />
      </g>

      {/* spokes from center to star tips, with PR markers */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const [tipX, tipY] = polar(cx, cy, 124, a);
        const [innerX, innerY] = polar(cx, cy, 28, a);
        const pr = top[i];
        const filled = !!pr;

        return (
          <g key={i}>
            <line
              x1={innerX}
              y1={innerY}
              x2={tipX}
              y2={tipY}
              stroke="var(--ink)"
              strokeWidth={filled ? 0.45 : 0.2}
              opacity={filled ? 0.55 : 0.22}
            />
            {filled ? (
              <>
                <circle
                  cx={tipX + (rng() - 0.5) * 0.6}
                  cy={tipY + (rng() - 0.5) * 0.6}
                  r={i === 0 ? 4.2 : 3}
                  fill="var(--rubric)"
                  opacity={i === 0 ? 0.9 : 0.78}
                />
                {i === 0 && (
                  <circle
                    cx={tipX}
                    cy={tipY}
                    r={8}
                    fill="var(--rubric)"
                    opacity=".18"
                    style={{ animation: "pulse 4s ease-in-out infinite" }}
                  />
                )}
              </>
            ) : (
              <circle
                cx={tipX}
                cy={tipY}
                r={2}
                fill="none"
                stroke="var(--ink)"
                strokeWidth=".4"
                opacity=".3"
              />
            )}
          </g>
        );
      })}

      {/* central radiance */}
      <polygon
        points={pointRing(cx, cy, 20, 8, 8)}
        fill="var(--rubric)"
        opacity=".88"
      />
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="var(--paper)"
      />

      {/* labels around the star */}
      {top.map((pr, i) => {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        // Push labels at the diagonals slightly further out so the two
        // lines (lift name + weight) don't collide with the cardinal
        // labels above/below them.
        const isCardinal = i % 2 === 0; // 0=N, 2=E, 4=S, 6=W
        const labelR = isCardinal ? 144 : 156;
        const [labelX, labelY] = polar(cx, cy, labelR, a);
        // Anchor based on which side of the star the label sits.
        // Cardinal top/bottom labels center; left/right labels end/start.
        const dx = labelX - cx;
        const dy = labelY - cy;
        let anchor: "start" | "middle" | "end";
        if (Math.abs(dx) < 4) anchor = "middle";
        else if (dx < 0) anchor = "end";
        else anchor = "start";
        const above = dy < -8;
        const trimmed =
          pr.exerciseName.length > 18
            ? pr.exerciseName.slice(0, 17).trim() + "…"
            : pr.exerciseName;
        return (
          <g key={i}>
            <text
              x={labelX}
              y={labelY + (above ? -4 : 2)}
              fontFamily="var(--italic)"
              fontStyle="italic"
              fontSize="8"
              fill="var(--ash)"
              opacity=".88"
              textAnchor={anchor}
            >
              {trimmed.toLowerCase()}
            </text>
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
              {pr.e1RM} kg
              {pr.improvement > 0 && (
                <tspan dx="3" fill="var(--ash)" opacity=".7" fontSize="6.5">
                  +{pr.improvement}
                </tspan>
              )}
            </text>
          </g>
        );
      })}

      {top.length === 0 && (
        <text
          x="150"
          y="155"
          fontFamily="var(--italic)"
          fontStyle="italic"
          fontSize="10"
          fill="var(--ash)"
          opacity=".55"
          textAnchor="middle"
        >
          no records yet inscribed
        </text>
      )}
    </svg>
  );
}
