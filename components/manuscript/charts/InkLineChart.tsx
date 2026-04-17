"use client";

/**
 * INK LINE CHART — a traditional XY line chart rendered in the
 * manuscript vocabulary. Hairline axes. Oldstyle tabular numerals
 * on ticks. Thin ink curve. Rubric diamond marks personal-best
 * peaks; a breathing rubric dot sits on the current value with an
 * italic marginalia label to the right.
 *
 * Hovering shows a thin rubric hairline at the nearest point and
 * a small marginalia tooltip with the exact value + date.
 *
 * Used for e1RM-over-time, weekly tonnage, bodyweight, and any
 * other single-series time chart.
 */

import { useMemo, useRef, useState } from "react";
import { format } from "date-fns";

export type LinePoint = {
  x: string | number | Date; // x-value (usually a date ISO string)
  y: number;                 // y-value
  isPR?: boolean;            // mark with a rubric diamond
  label?: string;            // optional marginalia for this point
};

type Props = {
  series: LinePoint[];
  yLabel?: string;
  height?: number;
  yUnit?: string;            // e.g. "kg"
  xFormat?: (x: Date) => string;
  emptyLabel?: string;
  /** When true, keep y == 0 points in the series. Default false because
   * weight charts use 0 as a sentinel for "missing"; counting charts
   * (e.g., PRs per month) need 0 to render as the floor. */
  allowZeros?: boolean;
};

export function InkLineChart({
  series,
  yLabel,
  height = 220,
  yUnit,
  xFormat = (d) => format(d, "MMM yy").toLowerCase(),
  emptyLabel = "not enough data yet",
  allowZeros = false,
}: Props) {
  const VB_W = 800;
  const VB_H = 280;
  const PAD_L = 58;
  const PAD_R = 88;
  const PAD_T = 30;
  const PAD_B = 46;

  const usableW = VB_W - PAD_L - PAD_R;
  const usableH = VB_H - PAD_T - PAD_B;

  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const normalizedPoints = useMemo(() => {
    return series
      .map((p) => ({
        ...p,
        xDate: p.x instanceof Date ? p.x : new Date(p.x),
      }))
      .filter((p) => !isNaN(p.xDate.getTime()))
      // Drop zero/negative y so a missing/garbage data point doesn't
      // collapse the line to the floor and mislead the eye — unless
      // the caller has opted in to zero (e.g. count-based charts).
      .filter((p) => (allowZeros ? p.y >= 0 : p.y > 0))
      .sort((a, b) => a.xDate.getTime() - b.xDate.getTime());
  }, [series, allowZeros]);

  if (normalizedPoints.length === 0) {
    return (
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height={height} aria-hidden="true">
        <text
          x={VB_W / 2}
          y={VB_H / 2}
          fontFamily="var(--italic)"
          fontStyle="italic"
          fontSize="12"
          fill="var(--ash)"
          textAnchor="middle"
          opacity=".7"
        >
          {emptyLabel}
        </text>
      </svg>
    );
  }

  const yValues = normalizedPoints.map((p) => p.y);
  const yMin = Math.min(...yValues, 0);
  const yMaxRaw = Math.max(...yValues, 1);
  // pad top so the line doesn't graze the ceiling
  const yMax = yMaxRaw + (yMaxRaw - yMin) * 0.1 + 1;

  const xMin = normalizedPoints[0].xDate.getTime();
  const xMax = normalizedPoints[normalizedPoints.length - 1].xDate.getTime();
  const xSpan = Math.max(xMax - xMin, 1000 * 60 * 60 * 24);

  const xOf = (d: Date) =>
    PAD_L + ((d.getTime() - xMin) / xSpan) * usableW;
  const yOf = (v: number) =>
    PAD_T + usableH - ((v - yMin) / (yMax - yMin)) * usableH;

  const ticks = niceTicks(yMin, yMax, 5);
  const xTicks = chooseXTicks(normalizedPoints.map((p) => p.xDate), 6);

  const linePath = normalizedPoints
    .map((p, i) => `${i === 0 ? "M" : "L"}${xOf(p.xDate).toFixed(1)},${yOf(p.y).toFixed(1)}`)
    .join(" ");

  const peak = normalizedPoints.reduce(
    (best, p) => (p.y > best.y ? p : best),
    normalizedPoints[0],
  );
  const current = normalizedPoints[normalizedPoints.length - 1];

  // Map an SVG-x value back to the nearest data-point index.
  const handleMove = (evt: React.MouseEvent<SVGRectElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const local = pt.matrixTransform(ctm.inverse());
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < normalizedPoints.length; i++) {
      const dx = Math.abs(xOf(normalizedPoints[i].xDate) - local.x);
      if (dx < bestDist) {
        bestDist = dx;
        bestIdx = i;
      }
    }
    setHoverIdx(bestIdx);
  };

  const hovered = hoverIdx != null ? normalizedPoints[hoverIdx] : null;
  const hoverX = hovered ? xOf(hovered.xDate) : 0;
  const hoverY = hovered ? yOf(hovered.y) : 0;
  // Flip the tooltip to the left of the hairline if it would overflow on the right.
  const tipPlaceLeft = hoverX > PAD_L + usableW * 0.66;
  const tipDx = tipPlaceLeft ? -86 : 8;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      height={height}
      style={{ touchAction: "none" }}
    >
      {/* y-axis rule */}
      <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PAD_T + usableH} stroke="var(--ink)" strokeWidth=".5" opacity=".55" />

      {/* y-axis label (rotated) */}
      {yLabel && (
        <text
          x={16}
          y={PAD_T + usableH / 2}
          fontFamily="var(--italic)"
          fontStyle="italic"
          fontSize="10"
          fill="var(--ash)"
          textAnchor="middle"
          transform={`rotate(-90, 16, ${PAD_T + usableH / 2})`}
        >
          {yLabel}
        </text>
      )}

      {/* horizontal grid + y-ticks */}
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={PAD_L}
            y1={yOf(t)}
            x2={PAD_L + usableW}
            y2={yOf(t)}
            stroke="var(--ink)"
            strokeWidth=".2"
            opacity=".15"
            strokeDasharray="2,4"
          />
          <text
            x={PAD_L - 8}
            y={yOf(t) + 3.5}
            fontFamily="var(--mono)"
            fontSize="10"
            fill="var(--ash)"
            textAnchor="end"
            style={{ fontVariantNumeric: "oldstyle-nums tabular-nums" }}
          >
            {t}
          </text>
        </g>
      ))}

      {/* x-axis rule */}
      <line
        x1={PAD_L}
        y1={PAD_T + usableH}
        x2={PAD_L + usableW}
        y2={PAD_T + usableH}
        stroke="var(--ink)"
        strokeWidth=".5"
        opacity=".55"
      />

      {/* x-tick marks + labels */}
      {xTicks.map((tick, i) => (
        <g key={i}>
          <line
            x1={xOf(tick)}
            y1={PAD_T + usableH}
            x2={xOf(tick)}
            y2={PAD_T + usableH + 4}
            stroke="var(--ink)"
            strokeWidth=".35"
            opacity=".6"
          />
          <text
            x={xOf(tick)}
            y={PAD_T + usableH + 18}
            fontFamily="var(--italic)"
            fontStyle="italic"
            fontSize="10"
            fill="var(--ash)"
            textAnchor="middle"
          >
            {xFormat(tick)}
          </text>
        </g>
      ))}

      {/* the line itself */}
      {normalizedPoints.length > 1 && (
        <path d={linePath} fill="none" stroke="var(--ink)" strokeWidth="1" opacity=".85" />
      )}

      {/* points — non-PR as small ink dots, PR as rubric diamonds */}
      {normalizedPoints.map((p, i) => {
        const x = xOf(p.xDate);
        const y = yOf(p.y);
        if (p.isPR) {
          return (
            <polygon
              key={i}
              points={`${x},${y - 4} ${x + 3.2},${y} ${x},${y + 4} ${x - 3.2},${y}`}
              fill="var(--rubric)"
              opacity=".92"
            />
          );
        }
        return <circle key={i} cx={x} cy={y} r={1.8} fill="var(--ink)" opacity=".65" />;
      })}

      {/* peak label (above the peak point) — hidden while hovering to reduce clutter */}
      {peak && hovered == null && (
        <g>
          <line
            x1={xOf(peak.xDate)}
            y1={yOf(peak.y) - 8}
            x2={xOf(peak.xDate)}
            y2={yOf(peak.y) - 24}
            stroke="var(--rubric)"
            strokeWidth=".4"
            opacity=".55"
          />
          <text
            x={xOf(peak.xDate)}
            y={yOf(peak.y) - 30}
            fontFamily="var(--mono)"
            fontSize="10"
            fill="var(--rubric)"
            textAnchor="middle"
            style={{ fontVariantNumeric: "oldstyle-nums tabular-nums" }}
          >
            peak · {Math.round(peak.y)}{yUnit ? ` ${yUnit}` : ""}
          </text>
        </g>
      )}

      {/* current value — rubric dot with italic label trailing right (hidden while hovering) */}
      {hovered == null && (
        <g>
          <circle
            cx={xOf(current.xDate)}
            cy={yOf(current.y)}
            r={6}
            fill="var(--rubric)"
            opacity=".18"
            style={{ animation: "pulse 4s ease-in-out infinite" }}
          />
          <circle cx={xOf(current.xDate)} cy={yOf(current.y)} r={3.2} fill="var(--rubric)" opacity=".95" />
          <line
            x1={xOf(current.xDate) + 6}
            y1={yOf(current.y)}
            x2={xOf(current.xDate) + 28}
            y2={yOf(current.y)}
            stroke="var(--rubric)"
            strokeWidth=".4"
            opacity=".45"
          />
          <text
            x={xOf(current.xDate) + 34}
            y={yOf(current.y) + 3.5}
            fontFamily="var(--mono)"
            fontSize="11"
            fill="var(--rubric)"
            style={{ fontVariantNumeric: "oldstyle-nums tabular-nums" }}
          >
            {Math.round(current.y)}{yUnit ? ` ${yUnit}` : ""}
          </text>
          <text
            x={xOf(current.xDate) + 34}
            y={yOf(current.y) + 15}
            fontFamily="var(--italic)"
            fontStyle="italic"
            fontSize="9"
            fill="var(--ash)"
          >
            {format(current.xDate, "MMM d")}
          </text>
        </g>
      )}

      {/* HOVER LAYER — vertical hairline + highlighted point + tooltip */}
      {hovered && (
        <g pointerEvents="none">
          <line
            x1={hoverX}
            y1={PAD_T}
            x2={hoverX}
            y2={PAD_T + usableH}
            stroke="var(--rubric)"
            strokeWidth=".5"
            opacity=".55"
            strokeDasharray="2,3"
          />
          <circle cx={hoverX} cy={hoverY} r={5} fill="var(--rubric)" opacity=".22" />
          <circle cx={hoverX} cy={hoverY} r={2.6} fill="var(--rubric)" />
          {/* tooltip card */}
          <g transform={`translate(${(hoverX + tipDx).toFixed(1)}, ${(hoverY - 24).toFixed(1)})`}>
            <rect
              x={0}
              y={0}
              width={78}
              height={32}
              fill="var(--paper)"
              stroke="var(--rubric)"
              strokeWidth=".5"
              opacity=".97"
            />
            <text
              x={6}
              y={13}
              fontFamily="var(--mono)"
              fontSize="11"
              fill="var(--rubric)"
              style={{ fontVariantNumeric: "oldstyle-nums tabular-nums" }}
            >
              {hovered.y % 1 === 0 ? hovered.y : hovered.y.toFixed(1)}
              {yUnit ? ` ${yUnit}` : ""}
              {hovered.isPR ? " ◆" : ""}
            </text>
            <text
              x={6}
              y={25}
              fontFamily="var(--italic)"
              fontStyle="italic"
              fontSize="9"
              fill="var(--ash)"
            >
              {format(hovered.xDate, "MMM d, yyyy").toLowerCase()}
            </text>
          </g>
        </g>
      )}

      {/* INTERACTION CAPTURE — must be last so it sits on top of everything */}
      <rect
        x={PAD_L}
        y={PAD_T}
        width={usableW}
        height={usableH}
        fill="transparent"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
      />
    </svg>
  );
}

/* ─── nice ticks helper ──────────────────────────────────── */

function niceTicks(min: number, max: number, target: number): number[] {
  const range = max - min;
  if (range <= 0) return [Math.round(max)];
  const rough = range / target;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const error = rough / pow;
  let step: number;
  if (error >= 7.5) step = 10 * pow;
  else if (error >= 3) step = 5 * pow;
  else if (error >= 1.5) step = 2 * pow;
  else step = pow;
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + 1e-9; v += step) ticks.push(Math.round(v));
  return ticks;
}

function chooseXTicks(dates: Date[], target: number): Date[] {
  if (dates.length === 0) return [];
  if (dates.length <= target) return dates;
  // Pick `target` dates whose calendar months are distinct so the rendered
  // tick labels (which usually show MMM yy) don't appear duplicated.
  const seen = new Set<string>();
  const out: Date[] = [];
  const step = Math.max(1, Math.floor((dates.length - 1) / (target - 1)));
  for (let i = 0; i < dates.length && out.length < target; i += step) {
    const d = dates[i];
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(d);
  }
  // Always include the most-recent date as the rightmost tick.
  const last = dates[dates.length - 1];
  const lastKey = `${last.getFullYear()}-${last.getMonth()}`;
  if (!seen.has(lastKey)) out.push(last);
  return out;
}
