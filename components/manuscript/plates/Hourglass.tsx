"use client";

/**
 * THE HOURGLASS — a pinched vessel with falling sand grains.
 * Decorative plate, used as ornament between sections and as a
 * symbol for time-based exercises.
 */

import { useEffect, useRef } from "react";
import { mulberry32 } from "@/lib/manuscript";

export function Hourglass({ size = 140, seed = 49 }: { size?: number; seed?: number }) {
  const grainsRef = useRef<SVGGElement>(null);
  const rng = mulberry32(seed);

  // pre-jitter starting positions for grains so they look organic
  const grainSeeds = Array.from({ length: 9 }, () => ({
    phase: rng(),
    drift: (rng() - 0.5) * 4,
    size: 1 + rng() * 0.8,
  }));

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const dt = (now - start) * 0.00018;
      const node = grainsRef.current;
      if (node) {
        const children = Array.from(node.children) as SVGCircleElement[];
        children.forEach((c, i) => {
          const seed = grainSeeds[i];
          const phase = (dt + seed.phase) % 1;
          const y = 36 + phase * 60;
          const x = 75 + Math.sin(phase * Math.PI * 4 + i) * 3 + seed.drift * (1 - phase);
          c.setAttribute("cx", x.toFixed(2));
          c.setAttribute("cy", y.toFixed(2));
          c.setAttribute("opacity", phase < 0.92 ? "0.7" : "0.15");
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [grainSeeds]);

  return (
    <svg viewBox="0 0 150 200" width={size} height={(size * 200) / 150} aria-hidden="true">
      {/* top and bottom rims */}
      <line x1="36" y1="14" x2="114" y2="14" stroke="var(--ink)" strokeWidth=".9" opacity=".82" />
      <line x1="36" y1="186" x2="114" y2="186" stroke="var(--ink)" strokeWidth=".9" opacity=".82" />

      {/* vessel walls */}
      <path
        d="M36,14 C36,70 60,80 65,100 C60,120 36,130 36,186"
        fill="none"
        stroke="var(--ink)"
        strokeWidth=".7"
        opacity=".75"
      />
      <path
        d="M114,14 C114,70 90,80 85,100 C90,120 114,130 114,186"
        fill="none"
        stroke="var(--ink)"
        strokeWidth=".7"
        opacity=".75"
      />

      {/* upper sand pile (residual) */}
      <path
        d="M40,18 L110,18 L88,52 C82,58 68,58 62,52 Z"
        fill="var(--ink)"
        opacity=".18"
      />

      {/* lower sand pile (growing — but static here) */}
      <path
        d="M40,184 L110,184 L92,160 C85,154 65,154 58,160 Z"
        fill="var(--ink)"
        opacity=".22"
      />

      {/* neck pinch markers */}
      <circle cx="75" cy="100" r="2.2" fill="none" stroke="var(--rubric)" strokeWidth=".4" opacity=".7" />

      {/* falling grains */}
      <g ref={grainsRef}>
        {grainSeeds.map((g, i) => (
          <circle key={i} cx="75" cy="40" r={g.size} fill="var(--ink)" opacity=".7" />
        ))}
      </g>
    </svg>
  );
}
