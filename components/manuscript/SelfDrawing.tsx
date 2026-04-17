"use client";

import { useEffect, useRef } from "react";

/**
 * Wraps an SVG and animates every <path class="drw">, <line class="drw">,
 * <circle class="drw">, etc. into existence on mount. Each shape's
 * stroke draws itself over ~2.2s, with a small per-element stagger.
 */
export function SelfDrawing({
  children,
  className,
  viewBox,
  width,
  height,
  durationMs = 2200,
}: {
  children: React.ReactNode;
  className?: string;
  viewBox: string;
  width?: number | string;
  height?: number | string;
  durationMs?: number;
}) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const targets = Array.from(svg.querySelectorAll<SVGGeometryElement>(".drw"));
    targets.forEach((node, i) => {
      try {
        const len = node.getTotalLength();
        if (!isFinite(len) || len <= 0) return;
        node.style.strokeDasharray = String(len);
        node.style.strokeDashoffset = String(len);
        node.style.transition = `stroke-dashoffset ${durationMs}ms var(--ease) ${i * 30}ms`;
      } catch {
        /* no-op */
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            targets.forEach((node) => {
              node.style.strokeDashoffset = "0";
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 },
    );
    observer.observe(svg);
    return () => observer.disconnect();
  }, [durationMs]);

  return (
    <svg
      ref={ref}
      viewBox={viewBox}
      width={width}
      height={height}
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
