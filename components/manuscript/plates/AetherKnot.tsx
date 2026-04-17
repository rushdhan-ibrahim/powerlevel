"use client";

/**
 * THE AETHER KNOT — a Lissajous braid that returns to its origin.
 * A wandering tracer rides the curve. Used as ornament between
 * sections and at empty spaces in the folio.
 */

import { useEffect, useRef } from "react";
import { sampledPath, polar } from "@/lib/manuscript";

export function AetherKnot({ size = 200, seed = 30 }: { size?: number; seed?: number }) {
  const tracerRef = useRef<SVGCircleElement>(null);
  const cx = 100;
  const cy = 60;

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (((now - start) * 0.00007) + seed * 0.11) % 1;
      const a = t * Math.PI * 2;
      const x = cx + 70 * Math.sin(a);
      const y = cy + 36 * Math.sin(a) * Math.cos(a);
      const node = tracerRef.current;
      if (node) {
        node.setAttribute("cx", x.toFixed(2));
        node.setAttribute("cy", y.toFixed(2));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seed]);

  const pathA = sampledPath((t) => {
    const a = t * Math.PI * 2;
    return [cx + 70 * Math.sin(a), cy + 36 * Math.sin(a) * Math.cos(a)];
  }, 220);
  const pathB = sampledPath((t) => {
    const a = t * Math.PI * 2;
    return [
      cx + 50 * Math.sin(a + Math.PI / 2),
      cy + 22 * Math.sin(a + Math.PI / 2) * Math.cos(a + Math.PI / 2),
    ];
  }, 180);

  return (
    <svg viewBox="0 0 200 120" width={size} height={(size * 120) / 200} aria-hidden="true">
      {/* axis hairlines */}
      <line x1="20" y1={cy} x2="180" y2={cy} stroke="var(--ink)" strokeWidth=".18" opacity=".18" />
      <line x1={cx} y1="14" x2={cx} y2="106" stroke="var(--ink)" strokeWidth=".18" opacity=".18" />

      <path d={pathA} fill="none" stroke="var(--ink)" strokeWidth=".75" opacity=".88" />
      <path d={pathB} fill="none" stroke="var(--ink)" strokeWidth=".3" opacity=".4" />

      {/* fixed nodes around the knot */}
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        const [x, y] = polar(cx, cy, 56, a);
        return <circle key={i} cx={x} cy={y} r={1.4} fill="var(--ink)" opacity=".55" />;
      })}

      <circle ref={tracerRef} cx={cx + 70} cy={cy} r={2.6} fill="var(--rubric)" opacity=".95" />
    </svg>
  );
}
