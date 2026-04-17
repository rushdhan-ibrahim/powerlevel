import { cn } from "@/lib/cn";
import { ChartLightbox } from "./ChartLightbox";

/**
 * The plate frame. Top-left rubric numeral, top-right italic title,
 * SVG content beneath, italic caption below. Optional ghost code underlay.
 *
 * When `expandable` is set, a small rubric expand button appears on the
 * plate's top-right corner on mobile — tapping it lifts the chart into
 * a full-viewport ChartLightbox where axis labels, tooltips and gesture
 * targets all have room. No-op on desktop, where the plate already
 * fills enough pixels to be legible.
 */
export function Plate({
  numeral,
  title,
  caption,
  code,
  children,
  className,
  size = "default",
  expandable = false,
}: {
  numeral: string;
  title: string;
  caption?: React.ReactNode;
  code?: string;
  children: React.ReactNode;
  className?: string;
  size?: "default" | "tall" | "wide";
  expandable?: boolean;
}) {
  const inner = (
    <>
      <span className="plate-n">{numeral}</span>
      <span className="plate-t">{title}</span>
      {code && <pre className="plate-code">{code}</pre>}
      {/* The `.plate svg` global rule sets z-index:1 on the chart so it
          sits above the ghost code underlay (z:0). A wrapper stacking
          context here would trap the lightbox scrim beneath the folio. */}
      {expandable ? (
        <ChartLightbox
          title={title}
          caption={typeof caption === "string" ? caption : undefined}
        >
          {children}
        </ChartLightbox>
      ) : (
        children
      )}
      {caption && <figcaption className="plate-c">{caption}</figcaption>}
    </>
  );
  return (
    <figure
      className={cn(
        "plate",
        size === "tall" && "min-h-[360px]",
        size === "wide" && "min-h-[200px]",
        className,
      )}
    >
      {inner}
    </figure>
  );
}
