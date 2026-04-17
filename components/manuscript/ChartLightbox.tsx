"use client";

/**
 * CHART LIGHTBOX — tap a chart (or its tiny expand affordance) to
 * lift it into a full-viewport overlay where axis labels are
 * legible, the rubric hairline has room to follow your thumb, and
 * pinch-zoom works natively.
 *
 * Best-practices baked in:
 *   - Full-bleed paper background matches the page aesthetic, not a
 *     generic black scrim.
 *   - Chart rotates nothing automatically — portrait-friendly;
 *     iPhone users can rotate to landscape manually if they want.
 *   - pinch-zoom works via `touch-action: pinch-zoom` on the inner
 *     scroll container; iOS handles the transform natively.
 *   - Scrollable inside the lightbox so a zoomed chart can be
 *     panned with one finger.
 *   - Tap the scrim (outside the chart surface) or the close
 *     button to dismiss. Escape also closes.
 *   - Locks body scroll with the same position:fixed iOS trick
 *     the MobileShell's bottom sheets use.
 */

import { ReactNode, useEffect, useRef, useState } from "react";

type Props = {
  title?: string;
  caption?: string;
  children: ReactNode;
  /** Optional larger version of the chart for fullscreen. If omitted,
   *  the same children are reused (they scale up responsively). */
  fullscreenChild?: ReactNode;
};

export function ChartLightbox({ title, caption, children, fullscreenChild }: Props) {
  const [open, setOpen] = useState(false);
  const surfaceRef = useRef<HTMLDivElement>(null);
  // Timestamp of the opening tap — used to suppress the ghost
  // pointerup/click that lands on the scrim immediately after the
  // expand button fires. Without this the lightbox opens and closes
  // in the same gesture.
  const openedAtRef = useRef(0);
  const tryClose = () => {
    if (Date.now() - openedAtRef.current < 350) return;
    setOpen(false);
  };

  // Lock body scroll while open — same technique as the mobile
  // bottom sheets (overflow:hidden alone isn't enough on iOS).
  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const b = document.body;
    const prev = { overflow: b.style.overflow, position: b.style.position, top: b.style.top, width: b.style.width };
    b.style.overflow = "hidden";
    b.style.position = "fixed";
    b.style.top = `-${scrollY}px`;
    b.style.width = "100%";
    return () => {
      b.style.overflow = prev.overflow;
      b.style.position = prev.position;
      b.style.top = prev.top;
      b.style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  // Escape to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* In-place chart + an "expand" affordance in the corner. The
          whole surface is clickable; tapping the affordance alone
          also works (and doesn't compete with the thumb-scrub if the
          user is dragging along the chart). */}
      <div className="chart-lightbox-anchor">
        {children}
        <button
          type="button"
          className="chart-lightbox-expand"
          aria-label="expand chart"
          onClick={(e) => {
            e.stopPropagation();
            openedAtRef.current = Date.now();
            setOpen(true);
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M1,5 V1 H5 M9,1 H13 V5 M13,9 V13 H9 M5,13 H1 V9" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {open && (
        <div
          className="chart-lightbox-scrim"
          onClick={tryClose}
        >
          <div
            ref={surfaceRef}
            className="chart-lightbox-surface"
            role="dialog"
            aria-modal="true"
            aria-label={title ?? "chart"}
            // Stop clicks bubbling to the scrim so taps INSIDE the
            // surface don't dismiss the lightbox.
            onClick={(e) => e.stopPropagation()}
          >
            <header className="chart-lightbox-head">
              <div className="chart-lightbox-head-text">
                {title && <div className="chart-lightbox-title">{title}</div>}
                {caption && <div className="chart-lightbox-caption">{caption}</div>}
              </div>
              <button
                type="button"
                className="chart-lightbox-close"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                }}
                aria-label="close"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path d="M3,3 L15,15 M15,3 L3,15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            </header>
            <div className="chart-lightbox-chart">
              {fullscreenChild ?? children}
            </div>
            <div className="chart-lightbox-hint">
              <span>pinch to zoom · drag to scrub · tap outside to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
