"use client";

/**
 * THE ORRERY OF e1RM — a session's estimated one-rep max becomes
 * an orbital body. Time progresses clockwise from the apex;
 * radius from the center scales with the e1RM achieved that day.
 *
 * Each new personal record is marked by a rubric diamond pinned
 * to the firmament. The outer ring turns once per ninety seconds.
 */

import { useEffect, useRef } from "react";
import { mulberry32, polar, jitter, sampledPath, pointRing } from "@/lib/manuscript";

type Session = { date: Date; e1RM: number };

export function OrreryE1RM({
  history,
  seed = 42,
}: {
  history: Session[];
  seed?: number;
}) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    svg.querySelectorAll<SVGGeometryElement>(".drw").forEach((node, i) => {
      try {
        const len = node.getTotalLength();
        if (!isFinite(len) || len <= 0) return;
        node.style.strokeDasharray = String(len);
        node.style.strokeDashoffset = String(len);
        node.style.transition = `stroke-dashoffset 1800ms var(--ease) ${i * 24}ms`;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            node.style.strokeDashoffset = "0";
          });
        });
      } catch {
        /* no-op */
      }
    });
  }, [history.length]);

  const cx = 150;
  const cy = 150;
  const rng = mulberry32(seed + history.length);

  if (history.length === 0) {
    return <EmptyOrrery />;
  }

  const e1RMs = history.map((h) => h.e1RM).filter((n) => n > 0);
  const maxE = Math.max(...e1RMs, 1);
  const minE = Math.min(...e1RMs, 0);
  const span = Math.max(maxE - minE, 1);

  const baseRadius = 32;
  const maxRadius = 116;

  // PR detection — walk chronologically, mark each new high.
  let runningMax = 0;
  const points = history.map((h, i) => {
    const isPR = h.e1RM > runningMax;
    if (isPR) runningMax = h.e1RM;
    const norm = (h.e1RM - minE) / span;
    const r = baseRadius + norm * (maxRadius - baseRadius);
    const angle = -Math.PI / 2 + (i / Math.max(history.length, 1)) * Math.PI * 2;
    const [x, y] = polar(cx, cy, r, angle);
    return { x, y, r, angle, isPR, e1RM: h.e1RM, date: h.date };
  });

  // Connecting trace — chronological orbit of all sessions
  const tracePath = sampledPath(
    (t) => {
      const exact = t * (points.length - 1);
      const i = Math.floor(exact);
      const f = exact - i;
      if (i >= points.length - 1) return [points[points.length - 1].x, points[points.length - 1].y];
      const a = points[i];
      const b = points[i + 1];
      return [a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f];
    },
    Math.min(history.length * 4, 200),
  );

  return (
    <svg ref={ref} viewBox="0 0 300 300" width="100%" height="280" aria-hidden="true">
      {/* outer rotating wheel */}
      <g
        style={{
          animation: "spin 90s linear infinite",
          transformOrigin: `${cx}px ${cy}px`,
        }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={jitter(rng, 132, 1.2)}
          fill="none"
          stroke="var(--ink)"
          strokeWidth=".5"
          opacity=".55"
          className="drw"
        />
        <circle
          cx={cx}
          cy={cy}
          r={128}
          fill="none"
          stroke="var(--ink)"
          strokeWidth=".18"
          opacity=".22"
          strokeDasharray="2,5"
        />
        {/* hourly tick marks */}
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
          const [x1, y1] = polar(cx, cy, 128, a);
          const [x2, y2] = polar(cx, cy, i % 6 === 0 ? 120 : 124, a);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--ink)"
              strokeWidth={i % 6 === 0 ? 0.5 : 0.25}
              opacity={i % 6 === 0 ? 0.55 : 0.28}
            />
          );
        })}
      </g>

      {/* counter-rotating inner cardinal axes */}
      <g
        style={{
          animation: "spinR 140s linear infinite",
          transformOrigin: `${cx}px ${cy}px`,
        }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={jitter(rng, maxRadius, 1)}
          fill="none"
          stroke="var(--ink)"
          strokeWidth=".22"
          opacity=".18"
          className="drw"
        />
        <line
          x1={cx - maxRadius}
          y1={cy}
          x2={cx + maxRadius}
          y2={cy}
          stroke="var(--ink)"
          strokeWidth=".15"
          opacity=".15"
        />
        <line
          x1={cx}
          y1={cy - maxRadius}
          x2={cx}
          y2={cy + maxRadius}
          stroke="var(--ink)"
          strokeWidth=".15"
          opacity=".15"
        />
      </g>

      {/* the trace — all sessions joined into a single orbit */}
      <path
        d={tracePath}
        fill="none"
        stroke="var(--ink)"
        strokeWidth=".4"
        opacity=".42"
        className="drw"
      />

      {/* each session as a body in the field */}
      {points.map((p, i) => (
        <g key={i}>
          {p.isPR ? (
            <polygon
              points={`${p.x},${p.y - 4.5} ${p.x + 3},${p.y} ${p.x},${p.y + 4.5} ${p.x - 3},${p.y}`}
              fill="var(--rubric)"
              opacity=".88"
              style={{
                transformOrigin: `${p.x}px ${p.y}px`,
                animation: i === points.length - 1 ? "pulse 4.5s ease-in-out infinite" : undefined,
              }}
            />
          ) : (
            <circle cx={p.x} cy={p.y} r={1.6 + (p.e1RM / maxE) * 1.2} fill="var(--ink)" opacity=".62" />
          )}
        </g>
      ))}

      {/* central radiance — current best */}
      <g style={{ animation: "breathe 9s ease-in-out infinite", transformOrigin: `${cx}px ${cy}px` }}>
        <polygon
          points={pointRing(cx, cy, 14, 5.4, 8)}
          fill="var(--rubric)"
          opacity=".82"
        />
        <circle
          cx={cx}
          cy={cy}
          r={22}
          fill="none"
          stroke="var(--rubric)"
          strokeWidth=".25"
          opacity=".22"
          style={{ animation: "pulse 5s ease-in-out infinite" }}
        />
      </g>

      {/* marginalia */}
      <text
        x="150"
        y="20"
        fontFamily="var(--italic)"
        fontStyle="italic"
        fontSize="8"
        fill="var(--ash)"
        opacity=".7"
        textAnchor="middle"
      >
        time runs clockwise from the apex
      </text>
      <text
        x="290"
        y="290"
        fontFamily="var(--mono)"
        fontSize="7.5"
        fill="var(--rubric)"
        opacity=".82"
        textAnchor="end"
        letterSpacing=".06em"
      >
        ◆ records · ● sessions
      </text>
      <text
        x="10"
        y="290"
        fontFamily="var(--mono)"
        fontSize="7.5"
        fill="var(--ash)"
        opacity=".62"
        letterSpacing=".06em"
      >
        n = {history.length}
      </text>
    </svg>
  );
}

function EmptyOrrery() {
  const cx = 150;
  const cy = 150;
  return (
    <svg viewBox="0 0 300 300" width="100%" height="280" aria-hidden="true">
      <g style={{ animation: "spin 120s linear infinite", transformOrigin: `${cx}px ${cy}px` }}>
        {[120, 90, 60, 30].map((r, i) => (
          <circle
            key={r}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--ink)"
            strokeWidth={i === 0 ? 0.4 : 0.2}
            opacity=".25"
            strokeDasharray={i === 0 ? undefined : "2,5"}
          />
        ))}
      </g>
      <text
        x="150"
        y="155"
        fontFamily="var(--italic)"
        fontStyle="italic"
        fontSize="11"
        fill="var(--ash)"
        opacity=".55"
        textAnchor="middle"
      >
        the field awaits its first body
      </text>
    </svg>
  );
}
