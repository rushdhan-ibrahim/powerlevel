"use client";

/**
 * THE CATENARY — a hanging chain that traces the user's e1RM curve.
 * The chain naturally encodes accumulation: it dips where rest fell,
 * rises where the body rebuilt. A faint rubric parabola compares.
 */

import { sampledPath } from "@/lib/manuscript";

type Point = { x: number; y: number };

export function Catenary({ values, seed: _seed = 145 }: { values: number[]; seed?: number }) {
  const VB_W = 380;
  const VB_H = 220;
  const PAD_X = 28;
  const PAD_TOP = 30;
  const PAD_BOTTOM = 36;
  const usableW = VB_W - PAD_X * 2;
  const usableH = VB_H - PAD_TOP - PAD_BOTTOM;

  if (values.length < 2) {
    return (
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="220" aria-hidden="true">
        <text x={VB_W / 2} y={VB_H / 2} fontFamily="var(--italic)" fontStyle="italic" fontSize="11" fill="var(--ash)" opacity=".55" textAnchor="middle">
          two points are needed for a chain
        </text>
      </svg>
    );
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, 1);

  const points: Point[] = values.map((v, i) => ({
    x: PAD_X + (i / Math.max(values.length - 1, 1)) * usableW,
    y: PAD_TOP + (1 - (v - min) / span) * usableH,
  }));

  // smooth path through points using simple cardinal spline
  const path = (() => {
    let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] ?? points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] ?? p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  })();

  // a faint dashed parabolic comparison
  const parabola = sampledPath((t) => {
    const x = PAD_X + t * usableW;
    const dx = (t - 0.5) * 2;
    const y = PAD_TOP + usableH - (1 - dx * dx) * usableH * 0.55 - 12;
    return [x, y];
  }, 80);

  const peakIndex = values.indexOf(Math.max(...values));
  const peakPt = points[peakIndex];

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="220" aria-hidden="true">
      {/* baseline */}
      <line
        x1={PAD_X}
        y1={VB_H - PAD_BOTTOM + 6}
        x2={VB_W - PAD_X}
        y2={VB_H - PAD_BOTTOM + 6}
        stroke="var(--ink)"
        strokeWidth=".18"
        opacity=".25"
      />

      {/* ghost parabola */}
      <path d={parabola} fill="none" stroke="var(--rubric)" strokeWidth=".25" opacity=".15" strokeDasharray="3,3" />

      {/* the chain itself */}
      <path d={path} fill="none" stroke="var(--ink)" strokeWidth=".55" opacity=".82" />

      {/* beads at every joint */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === peakIndex ? 3 : i === points.length - 1 ? 2.4 : 1.4}
          fill={i === peakIndex || i === points.length - 1 ? "var(--rubric)" : "var(--ink)"}
          opacity={i === peakIndex || i === points.length - 1 ? 0.92 : 0.6}
        />
      ))}

      {/* peak label */}
      {peakPt && (
        <text
          x={peakPt.x}
          y={peakPt.y - 8}
          fontFamily="var(--mono)"
          fontSize="8"
          fill="var(--rubric)"
          opacity=".85"
          textAnchor="middle"
        >
          {Math.round(values[peakIndex])}
        </text>
      )}

      <text
        x={PAD_X}
        y="14"
        fontFamily="var(--italic)"
        fontStyle="italic"
        fontSize="8"
        fill="var(--ash)"
        opacity=".7"
      >
        the chain remembers every dip and recovery
      </text>
    </svg>
  );
}
