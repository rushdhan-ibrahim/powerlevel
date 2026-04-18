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
import { createPortal } from "react-dom";

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
  // Gate the portal until we're mounted client-side — avoids any
  // hydration/SSR confusion around document.body access.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  // Timestamp of the opening tap — used to suppress the ghost
  // pointerup/click that lands on the scrim immediately after the
  // expand button fires. Without this the lightbox opens and closes
  // in the same gesture.
  const openedAtRef = useRef(0);
  const tryClose = () => {
    if (Date.now() - openedAtRef.current < 350) return;
    setOpen(false);
  };

  // Pinch-zoom + pan state. iOS PWAs don't allow native viewport
  // pinch even without maximum-scale; we have to drive it ourselves
  // with webkit GestureEvents + single-finger touch drag.
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const baseScaleRef = useRef(1);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);

  // Reset transform whenever the lightbox closes.
  useEffect(() => {
    if (!open) {
      setScale(1);
      setTx(0);
      setTy(0);
    }
  }, [open]);

  // Attach pinch + drag handlers while open. GestureEvent is a WebKit
  // extension — on non-iOS these listeners are no-ops.
  useEffect(() => {
    const el = chartRef.current;
    if (!el || !open) return;
    const onGestureStart = (e: Event) => {
      e.preventDefault();
      baseScaleRef.current = scale;
    };
    const onGestureChange = (e: Event) => {
      e.preventDefault();
      const next = Math.max(
        1,
        Math.min(4, baseScaleRef.current * (e as unknown as { scale: number }).scale),
      );
      setScale(next);
      if (next === 1) {
        setTx(0);
        setTy(0);
      }
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || scale === 1) return;
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1 || scale === 1 || !lastTouchRef.current) return;
      e.preventDefault();
      const dx = e.touches[0].clientX - lastTouchRef.current.x;
      const dy = e.touches[0].clientY - lastTouchRef.current.y;
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setTx((v) => v + dx);
      setTy((v) => v + dy);
    };
    const onTouchEnd = () => {
      lastTouchRef.current = null;
    };
    el.addEventListener("gesturestart", onGestureStart as EventListener);
    el.addEventListener("gesturechange", onGestureChange as EventListener);
    el.addEventListener("gestureend", onGestureStart as EventListener);
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    return () => {
      el.removeEventListener("gesturestart", onGestureStart as EventListener);
      el.removeEventListener("gesturechange", onGestureChange as EventListener);
      el.removeEventListener("gestureend", onGestureStart as EventListener);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [open, scale]);

  // Double-tap the chart to reset zoom.
  const onChartDoubleClick = () => {
    setScale(1);
    setTx(0);
    setTy(0);
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
      {/* The whole chart surface is the tap target on mobile. Click
          fires only when pointerdown + pointerup happen close in
          space + time, so a drag-scrub on the underlying chart stays
          separate from a tap-to-expand gesture. */}
      <div
        className="chart-lightbox-anchor"
        onClick={() => {
          openedAtRef.current = Date.now();
          setOpen(true);
        }}
        role="button"
        tabIndex={0}
        aria-label={title ? `expand ${title}` : "expand chart"}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openedAtRef.current = Date.now();
            setOpen(true);
          }
        }}
      >
        {children}
      </div>

      {open &&
        mounted &&
        createPortal(
          /* Portal to document.body — the scrim's z-index:80 is only
             meaningful at the top of the stacking context. Plate wraps
             charts in a `relative z-[1]` div, which would otherwise trap
             the scrim below the folio and tab bar. */
          <div className="chart-lightbox-scrim" onClick={tryClose}>
            <div
              ref={surfaceRef}
              className="chart-lightbox-surface"
              role="dialog"
              aria-modal="true"
              aria-label={title ?? "chart"}
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
              <div
                className="chart-lightbox-chart"
                ref={chartRef}
                onDoubleClick={onChartDoubleClick}
              >
                <div
                  className="chart-lightbox-chart-inner"
                  style={{
                    transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
                    transformOrigin: "center center",
                    transition: scale === 1 ? "transform .25s var(--ease)" : "none",
                  }}
                >
                  {fullscreenChild ?? children}
                </div>
              </div>
              <div className="chart-lightbox-hint">
                <span>
                  {scale > 1
                    ? "drag to pan · double-tap to reset · tap outside to close"
                    : "pinch to zoom · double-tap to reset · tap outside to close"}
                </span>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
