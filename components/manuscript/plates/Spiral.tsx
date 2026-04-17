"use client";

/**
 * THE SPIRAL OF ACCUMULATION — golden spiral that grows tighter as
 * it returns. Used for per-exercise progression illuminations and
 * for narrative ornament. The φ marker sits at the eye.
 */

import { sampledPath } from "@/lib/manuscript";

export function Spiral() {
  const cx = 150;
  const cy = 110;
  const arcs = [
    { r: 100, x1: cx - 30, y1: cy + 20, x2: cx - 80, y2: cy - 80 },
    { r: 62, x1: cx - 80, y1: cy - 80, x2: cx + 60, y2: cy - 20 },
    { r: 38, x1: cx + 60, y1: cy - 20, x2: cx + 20, y2: cy + 20 },
    { r: 24, x1: cx + 20, y1: cy + 20, x2: cx - 5, y2: cy - 5 },
  ];
  return (
    <svg viewBox="0 0 300 220" width="100%" height="220" aria-hidden="true">
      <g style={{ animation: "breathe 12s ease-in-out infinite", transformOrigin: `${cx}px ${cy}px` }}>
        {arcs.map((a, i) => (
          <path
            key={i}
            d={`M${a.x1},${a.y1} A${a.r},${a.r} 0 0 0 ${a.x2},${a.y2}`}
            fill="none"
            stroke="var(--ink)"
            strokeWidth={(0.6 - 0.1 * i).toFixed(2)}
            opacity={0.5 + i * 0.08}
          />
        ))}
        <circle cx={cx - 10} cy={cy - 5} r={3} fill="var(--ink)" opacity=".5" />
        <text
          x={cx - 10}
          y={cy + 8}
          fontFamily="var(--italic)"
          fontStyle="italic"
          fontSize="9"
          fill="var(--rubric)"
          opacity=".55"
          textAnchor="middle"
        >
          φ
        </text>
      </g>
    </svg>
  );
}
