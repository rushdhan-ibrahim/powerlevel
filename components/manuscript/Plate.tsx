import { cn } from "@/lib/cn";

/**
 * The plate frame. Top-left rubric numeral, top-right italic title,
 * SVG content beneath, italic caption below. Optional ghost code underlay.
 */
export function Plate({
  numeral,
  title,
  caption,
  code,
  children,
  className,
  size = "default",
}: {
  numeral: string;
  title: string;
  caption?: React.ReactNode;
  code?: string;
  children: React.ReactNode;
  className?: string;
  size?: "default" | "tall" | "wide";
}) {
  return (
    <figure
      className={cn(
        "plate",
        size === "tall" && "min-h-[360px]",
        size === "wide" && "min-h-[200px]",
        className,
      )}
    >
      <span className="plate-n">{numeral}</span>
      <span className="plate-t">{title}</span>
      {code && <pre className="plate-code">{code}</pre>}
      <div className="relative z-[1]">{children}</div>
      {caption && <figcaption className="plate-c">{caption}</figcaption>}
    </figure>
  );
}
