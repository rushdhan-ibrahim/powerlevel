"use client";

/**
 * CHAIN SLIDER — a single-handle horizontal slider in the manuscript
 * vocabulary. Hairline track, oldstyle numerals on the end labels and
 * a few interior tick marks, a rubric pendant on the current value
 * with a small chain hanging from it. Drag the pendant or click any-
 * where on the track to set the value. Keyboard left/right adjusts
 * by step.
 *
 * Intended to be a joy to use — never a finnicky range input.
 */

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  /** Optional value formatter for tick labels and the floating pendant label. */
  format?: (v: number) => string;
  /** Optional helper marks displayed as small ticks on the track. */
  marks?: number[];
  /** Whether to label the min/max under the track. */
  showEnds?: boolean;
};

export function ChainSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  format = (v) => String(Math.round(v)),
  marks,
  showEnds = true,
}: Props) {
  const VB_W = 800;
  const VB_H = 110;
  const PAD_L = 28;
  const PAD_R = 28;
  const trackY = 52;
  const usableW = VB_W - PAD_L - PAD_R;

  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState(false);

  const safeMax = Math.max(max, min + step);
  const clamped = Math.min(Math.max(value, min), safeMax);
  const xOf = (v: number) => PAD_L + ((v - min) / (safeMax - min)) * usableW;
  const valueOf = (x: number) => {
    const fraction = (x - PAD_L) / usableW;
    const raw = min + fraction * (safeMax - min);
    return snapToStep(raw, min, safeMax, step);
  };

  const screenXToSvgX = useCallback((clientX: number): number => {
    const svg = svgRef.current;
    if (!svg) return 0;
    const rect = svg.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * VB_W;
  }, []);

  const setFromClientX = useCallback(
    (clientX: number) => {
      const x = screenXToSvgX(clientX);
      const v = valueOf(x);
      onChange(v);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [screenXToSvgX, min, safeMax, step, onChange],
  );

  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => setFromClientX(e.clientX);
    const up = () => setDragging(false);
    const tmove = (e: TouchEvent) => {
      if (e.touches[0]) setFromClientX(e.touches[0].clientX);
    };
    const tend = () => setDragging(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", tmove, { passive: true });
    window.addEventListener("touchend", tend);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", tmove);
      window.removeEventListener("touchend", tend);
    };
  }, [dragging, setFromClientX]);

  const onTrackClick = (e: React.MouseEvent) => setFromClientX(e.clientX);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(Math.max(min, snapToStep(clamped - step, min, safeMax, step)));
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(Math.min(safeMax, snapToStep(clamped + step, min, safeMax, step)));
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange(min);
    } else if (e.key === "End") {
      e.preventDefault();
      onChange(safeMax);
    }
  };

  const x = xOf(clamped);
  const tickValues = marks ?? autoTicks(min, safeMax, 6);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      height={VB_H}
      role="slider"
      aria-valuemin={min}
      aria-valuemax={safeMax}
      aria-valuenow={clamped}
      tabIndex={0}
      onKeyDown={onKeyDown}
      style={{ display: "block", outline: "none", cursor: "pointer" }}
    >
      {/* baseline track */}
      <line
        x1={PAD_L}
        y1={trackY}
        x2={PAD_L + usableW}
        y2={trackY}
        stroke="var(--ink)"
        strokeWidth=".55"
        opacity=".55"
      />

      {/* tick marks */}
      {tickValues.map((t) => {
        const tx = xOf(t);
        return (
          <g key={t}>
            <line
              x1={tx}
              y1={trackY - 4}
              x2={tx}
              y2={trackY + 4}
              stroke="var(--ink)"
              strokeWidth=".25"
              opacity=".4"
            />
            <text
              x={tx}
              y={trackY + 18}
              fontFamily="var(--mono)"
              fontSize="9"
              fill="var(--ash)"
              textAnchor="middle"
              style={{ fontVariantNumeric: "oldstyle-nums tabular-nums" }}
            >
              {format(t)}
            </text>
          </g>
        );
      })}

      {/* min / max boundary labels */}
      {showEnds && (
        <>
          <text
            x={PAD_L}
            y={20}
            fontFamily="var(--italic)"
            fontStyle="italic"
            fontSize="9"
            fill="var(--ash)"
            opacity=".6"
          >
            {format(min)}
          </text>
          <text
            x={PAD_L + usableW}
            y={20}
            fontFamily="var(--italic)"
            fontStyle="italic"
            fontSize="9"
            fill="var(--ash)"
            opacity=".6"
            textAnchor="end"
          >
            {format(safeMax)}
          </text>
        </>
      )}

      {/* hit area for clicks */}
      <rect
        x={PAD_L}
        y={trackY - 16}
        width={usableW}
        height={32}
        fill="transparent"
        onClick={onTrackClick}
      />

      {/* the pendant */}
      <g
        onMouseDown={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onTouchStart={(e) => {
          if (e.touches[0]) setFromClientX(e.touches[0].clientX);
          setDragging(true);
        }}
        style={{ cursor: dragging ? "grabbing" : "grab" }}
      >
        {/* hanging chain (4 small links) */}
        <line
          x1={x}
          y1={trackY}
          x2={x}
          y2={trackY + 18}
          stroke="var(--rubric)"
          strokeWidth=".55"
          opacity=".7"
        />
        {/* a little glow */}
        <circle
          cx={x}
          cy={trackY + 24}
          r={9}
          fill="var(--rubric)"
          opacity=".15"
          style={{ animation: "pulse 4s ease-in-out infinite" }}
        />
        {/* the bead */}
        <circle cx={x} cy={trackY + 24} r={6} fill="var(--rubric)" opacity=".95" />
        <circle cx={x} cy={trackY + 24} r={2.4} fill="var(--paper-warm)" />
        {/* current value label above */}
        <text
          x={x}
          y={trackY - 14}
          fontFamily="var(--mono)"
          fontSize="13"
          fill="var(--rubric)"
          textAnchor="middle"
          style={{ fontVariantNumeric: "oldstyle-nums tabular-nums" }}
        >
          {format(clamped)}
        </text>
      </g>
    </svg>
  );
}

function snapToStep(v: number, min: number, max: number, step: number): number {
  if (step <= 0) return v;
  const snapped = Math.round((v - min) / step) * step + min;
  return Math.min(max, Math.max(min, Math.round(snapped * 100) / 100));
}

function autoTicks(min: number, max: number, target: number): number[] {
  const range = max - min;
  if (range <= 0) return [min];
  const rough = range / target;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const error = rough / pow;
  let step: number;
  if (error >= 7.5) step = 10 * pow;
  else if (error >= 3) step = 5 * pow;
  else if (error >= 1.5) step = 2 * pow;
  else step = pow;
  const niceMin = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = niceMin; v <= max + 1e-9; v += step) ticks.push(Math.round(v));
  return ticks;
}
