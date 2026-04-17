"use client";

/**
 * CHAPTER PAGER — horizontal swipe navigation between chapters on
 * mobile; vertical stack on desktop. The reading metaphor changes
 * with the device: on a desktop folio you read top-to-bottom; on
 * a phone you turn pages left-to-right.
 *
 * Layout
 *   mobile  flex-row, scroll-snap-x, each child = one viewport-wide
 *           slide. A sticky rubric indicator at top shows the current
 *           chapter as a dot-pagination row + chapter label; tap a
 *           dot to jump.
 *   desktop flex-column, no snap, no overflow — renders as one
 *           continuous scroll so the existing desktop design is
 *           untouched.
 */

import { Children, ReactNode, useEffect, useRef, useState } from "react";

type ChapterLabel = {
  n: string;       // roman numeral, lowercased ("i", "ii", …)
  title: string;   // "Records", "Balance & volume", …
};

type Props = {
  labels: ChapterLabel[];
  children: ReactNode;
};

export function ChapterPager({ labels, children }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const slideCount = Children.count(children);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const w = el.clientWidth;
        if (w <= 0) return;
        const i = Math.round(el.scrollLeft / w);
        setActive(Math.max(0, Math.min(slideCount - 1, i)));
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
    };
  }, [slideCount]);

  const goTo = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const w = el.clientWidth;
    el.scrollTo({ left: w * i, behavior: "smooth" });
  };

  const current = labels[active];

  return (
    <div className="chapter-pager">
      <div className="chapter-pager-indicator mobile-only" aria-hidden="true">
        <div className="chapter-pager-dots">
          {labels.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={`chapter-pager-dot ${active === i ? "is-active" : ""}`}
              aria-label={`go to chapter ${labels[i].n}`}
            />
          ))}
        </div>
        {current && (
          <div className="chapter-pager-label">
            <span className="chapter-pager-label-n">§{current.n}</span>
            <span className="chapter-pager-label-sep">·</span>
            <span className="chapter-pager-label-title">{current.title}</span>
          </div>
        )}
      </div>
      <div ref={scrollRef} className="chapter-pager-scroll">
        {Children.map(children, (child, i) => (
          <div
            key={i}
            className="chapter-slide"
            data-active={active === i ? "true" : "false"}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
