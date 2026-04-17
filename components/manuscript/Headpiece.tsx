"use client";

import { useEffect, useRef } from "react";

/**
 * Decorative SVG divider with self-drawing rubric diamonds.
 * On mount the strokes draw themselves; every 30s they redraw.
 */
export function Headpiece({ delay = 0 }: { delay?: number }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    svg.querySelectorAll<SVGPathElement>("path").forEach((path, i) => {
      try {
        const len = path.getTotalLength();
        path.style.strokeDasharray = String(len);
        path.style.strokeDashoffset = String(len);
        path.style.setProperty("--len", String(len));
        const drawDur = 1.5;
        const stagger = i * 0.12;
        path.style.animation =
          `hpDraw ${drawDur}s var(--ease) ${delay + stagger}s forwards, ` +
          `hpRedraw 30s var(--ease) ${delay + 4 + stagger}s infinite`;
      } catch {
        // some shapes (filled diamond) lack a measurable length; leave them.
      }
    });
  }, [delay]);

  return (
    <div className="headpiece">
      <svg
        ref={ref}
        viewBox="0 0 240 14"
        width="240"
        height="14"
        aria-hidden="true"
      >
        <path d="M0,7 L90,7" stroke="var(--ink)" strokeWidth=".3" opacity=".18" fill="none" />
        <path d="M150,7 L240,7" stroke="var(--ink)" strokeWidth=".3" opacity=".18" fill="none" />
        <path d="M92,2 L98,7 L92,12" stroke="var(--ink)" strokeWidth=".4" opacity=".3" fill="none" />
        <path d="M148,2 L142,7 L148,12" stroke="var(--ink)" strokeWidth=".4" opacity=".3" fill="none" />
        <path d="M108,0 L114,7 L108,14 L102,7 Z" stroke="var(--rubric)" strokeWidth=".5" opacity=".4" fill="none" />
        <path d="M132,0 L138,7 L132,14 L126,7 Z" stroke="var(--rubric)" strokeWidth=".5" opacity=".4" fill="none" />
        <path d="M120,0 L126,7 L120,14 L114,7 Z" stroke="var(--rubric)" strokeWidth=".6" opacity=".5" fill="none" />
        <path d="M120,3 L123,7 L120,11 L117,7 Z" fill="var(--rubric)" opacity=".25" />
      </svg>
    </div>
  );
}
