"use client";

/**
 * THE VESICA — two circles, one interior almond. Pure decoration,
 * used between sections of contemplative weight.
 */

import { pointRing, polar } from "@/lib/manuscript";

export function Vesica({ size = 200 }: { size?: number }) {
  const cx = 100;
  const cy = 100;
  const r = 58;
  const overlap = 32;
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden="true">
      <g style={{ animation: "breathe 12s ease-in-out infinite", transformOrigin: `${cx}px ${cy}px` }}>
        <circle cx={cx - overlap} cy={cy} r={r} fill="none" stroke="var(--ink)" strokeWidth=".55" opacity=".75" />
        <circle cx={cx + overlap} cy={cy} r={r} fill="none" stroke="var(--ink)" strokeWidth=".55" opacity=".75" />
      </g>
      <polygon
        points={pointRing(cx, cy, 12, 4.5, 8)}
        fill="var(--rubric)"
        opacity=".7"
        style={{ animation: "pulse 5s ease-in-out infinite", transformOrigin: `${cx}px ${cy}px` }}
      />
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((a, i) => {
        const [x, y] = polar(cx, cy, 76, a);
        return <circle key={i} cx={x} cy={y} r={1.6} fill="var(--ink)" opacity=".55" />;
      })}
    </svg>
  );
}
