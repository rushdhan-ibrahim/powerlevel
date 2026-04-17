"use client";

/**
 * THE HARMONOGRAPH — a damped Lissajous figure whose curve traces
 * itself in over the first few seconds. Pure ornament, used at
 * section breaks where extra weight is wanted.
 */

import { useEffect, useRef } from "react";
import { sampledPath } from "@/lib/manuscript";

export function Harmonograph({
  size = 200,
  f1 = 3.001,
  f2 = 2,
  d1 = 0.003,
  d2 = 0.004,
}: {
  size?: number;
  f1?: number;
  f2?: number;
  d1?: number;
  d2?: number;
}) {
  const ref = useRef<SVGPathElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    try {
      const len = node.getTotalLength();
      node.style.strokeDasharray = String(len);
      node.style.strokeDashoffset = String(len);
      node.style.transition = "stroke-dashoffset 4500ms cubic-bezier(.25,.1,.25,1)";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          node.style.strokeDashoffset = "0";
        });
      });
    } catch {
      /* no-op */
    }
  }, [f1, f2, d1, d2]);

  const cx = 100;
  const cy = 100;
  const path = sampledPath((t) => {
    const a = t * 80 * Math.PI;
    const x = cx + 80 * Math.sin(f1 * a) * Math.exp(-d1 * a);
    const y = cy + 70 * Math.sin(f2 * a) * Math.exp(-d2 * a);
    return [x, y];
  }, 2000);

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden="true">
      <circle cx={cx} cy={cy} r={88} fill="none" stroke="var(--ash)" strokeWidth=".25" opacity=".35" />
      <line x1={cx - 88} y1={cy} x2={cx + 88} y2={cy} stroke="var(--ash)" strokeWidth=".18" opacity=".25" />
      <line x1={cx} y1={cy - 88} x2={cx} y2={cy + 88} stroke="var(--ash)" strokeWidth=".18" opacity=".25" />
      <path
        ref={ref}
        d={path}
        fill="none"
        stroke="var(--ink)"
        strokeWidth=".4"
        opacity=".75"
      />
      <circle cx={cx} cy={cy} r={2.4} fill="var(--rubric)" opacity=".85" />
    </svg>
  );
}
