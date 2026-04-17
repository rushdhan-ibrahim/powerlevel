"use client";

/**
 * THE CHAIN BRUSH — a horizontal timeline of every logged workout
 * with two rubric pendants the user can drag to define a period.
 * A row of preset chips above snaps the brush to common ranges.
 *
 * Innovation over a date picker: continuous, contextual, you can
 * see the density of training right alongside the range you choose.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addDays, differenceInDays, format } from "date-fns";

export type Period = { start: Date; end: Date };

type Mark = { date: string; tonnage: number; sessions: number };

type Props = {
  marks: Mark[];        // every day with a workout (may include zero days for context)
  earliest: Date;       // earliest date the brush can reach
  latest: Date;         // typically today
  value: Period;
  onChange: (p: Period) => void;
};

const PRESETS: { key: string; label: string; days: number | "all" }[] = [
  { key: "7d",  label: "7 days",  days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
  { key: "365d", label: "1 year", days: 365 },
  { key: "all", label: "all",    days: "all" },
];

export function PeriodBrush({ marks, earliest, latest, value, onChange }: Props) {
  const VB_W = 800;
  const VB_H = 100;
  const PAD_X = 24;
  const usableW = VB_W - PAD_X * 2;
  const trackY = 56;
  const trackH = 22;

  const totalDays = Math.max(1, differenceInDays(latest, earliest));
  const dateToX = useCallback(
    (d: Date) => {
      const days = Math.max(0, Math.min(totalDays, differenceInDays(d, earliest)));
      return PAD_X + (days / totalDays) * usableW;
    },
    [earliest, totalDays, usableW],
  );

  const xToDate = useCallback(
    (x: number): Date => {
      const days = Math.round(((x - PAD_X) / usableW) * totalDays);
      const clamped = Math.max(0, Math.min(totalDays, days));
      return addDays(earliest, clamped);
    },
    [earliest, totalDays, usableW],
  );

  /* ─── density marks ───────────────────────────────────── */
  const maxTonnage = Math.max(1, ...marks.map((m) => m.tonnage));
  const markX = useMemo(
    () =>
      marks.map((m) => ({
        x: dateToX(new Date(m.date)),
        h: 4 + (m.tonnage / maxTonnage) * 18,
        sessions: m.sessions,
      })),
    [marks, dateToX, maxTonnage],
  );

  /* ─── interaction ─────────────────────────────────────── */
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{
    kind: "left" | "right" | "body";
    startClientX: number;
    startStart: Date;
    startEnd: Date;
  } | null>(null);

  const screenXToSvgX = useCallback(
    (clientX: number): number => {
      const svg = svgRef.current;
      if (!svg) return 0;
      const rect = svg.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * VB_W;
    },
    [],
  );

  const beginDrag = (e: React.MouseEvent, kind: "left" | "right" | "body") => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      kind,
      startClientX: e.clientX,
      startStart: value.start,
      startEnd: value.end,
    };
  };

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dxScreen = e.clientX - drag.startClientX;
      // convert pixel delta to days
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const pxPerDay = (rect.width - (PAD_X * 2 * (rect.width / VB_W))) / totalDays;
      const dDays = Math.round(dxScreen / pxPerDay);

      let nextStart = drag.startStart;
      let nextEnd = drag.startEnd;
      if (drag.kind === "left") {
        nextStart = addDays(drag.startStart, dDays);
        if (nextStart < earliest) nextStart = earliest;
        if (nextStart > nextEnd) nextStart = nextEnd;
      } else if (drag.kind === "right") {
        nextEnd = addDays(drag.startEnd, dDays);
        if (nextEnd > latest) nextEnd = latest;
        if (nextEnd < nextStart) nextEnd = nextStart;
      } else {
        const span = differenceInDays(drag.startEnd, drag.startStart);
        nextStart = addDays(drag.startStart, dDays);
        nextEnd = addDays(drag.startEnd, dDays);
        if (nextStart < earliest) {
          nextStart = earliest;
          nextEnd = addDays(earliest, span);
        }
        if (nextEnd > latest) {
          nextEnd = latest;
          nextStart = addDays(latest, -span);
        }
      }
      onChange({ start: nextStart, end: nextEnd });
    };

    const up = () => {
      dragRef.current = null;
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [earliest, latest, totalDays, onChange]);

  const onTrackClick = (e: React.MouseEvent) => {
    const x = screenXToSvgX(e.clientX);
    const clickedDate = xToDate(x);
    // snap nearest handle
    const distToStart = Math.abs(differenceInDays(clickedDate, value.start));
    const distToEnd = Math.abs(differenceInDays(clickedDate, value.end));
    if (distToStart <= distToEnd) {
      onChange({ start: clickedDate < value.end ? clickedDate : value.end, end: value.end });
    } else {
      onChange({ start: value.start, end: clickedDate > value.start ? clickedDate : value.start });
    }
  };

  const xStart = dateToX(value.start);
  const xEnd = dateToX(value.end);
  const brushW = Math.max(2, xEnd - xStart);

  /* ─── presets active state ────────────────────────────── */
  const activePreset = useMemo(() => {
    const today = new Date();
    const same = (a: Date, b: Date) => Math.abs(differenceInDays(a, b)) <= 1;
    if (same(value.end, today)) {
      const span = differenceInDays(value.end, value.start);
      if (same(value.start, earliest) && span === differenceInDays(latest, earliest)) return "all";
      if (Math.abs(span - 6) <= 1) return "7d";
      if (Math.abs(span - 29) <= 1) return "30d";
      if (Math.abs(span - 89) <= 1) return "90d";
      if (Math.abs(span - 364) <= 1) return "365d";
    }
    return null;
  }, [value, earliest, latest]);

  const applyPreset = (p: typeof PRESETS[number]) => {
    if (p.days === "all") {
      onChange({ start: earliest, end: latest });
      return;
    }
    onChange({ start: addDays(latest, -(p.days - 1)), end: latest });
  };

  return (
    <div>
      {/* PRESET CHIPS */}
      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 14,
          alignItems: "baseline",
        }}
      >
        {PRESETS.map((p, i) => (
          <span key={p.key} style={{ display: "inline-flex", alignItems: "baseline" }}>
            {i > 0 && (
              <span
                style={{
                  margin: "0 14px",
                  color: "var(--ash-light)",
                  fontFamily: "var(--italic)",
                  fontStyle: "italic",
                  fontSize: ".7rem",
                }}
              >
                ·
              </span>
            )}
            <button
              type="button"
              onClick={() => applyPreset(p)}
              style={{
                background: "transparent",
                border: "none",
                fontFamily: "var(--display)",
                fontVariant: "small-caps",
                fontSize: ".7rem",
                letterSpacing: ".18em",
                color: activePreset === p.key ? "var(--rubric)" : "var(--ash)",
                borderBottom:
                  activePreset === p.key ? "1px solid var(--rubric)" : "1px solid transparent",
                cursor: "pointer",
                padding: "2px 0",
                transition: "color .15s var(--ease)",
              }}
              onMouseEnter={(e) => {
                if (activePreset !== p.key) e.currentTarget.style.color = "var(--ink)";
              }}
              onMouseLeave={(e) => {
                if (activePreset !== p.key) e.currentTarget.style.color = "var(--ash)";
              }}
            >
              {p.label}
            </button>
          </span>
        ))}
      </div>

      {/* TIMELINE + BRUSH */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        height="100"
        style={{ display: "block" }}
        aria-label="Period selector"
      >
        {/* baseline */}
        <line
          x1={PAD_X}
          y1={trackY + trackH / 2}
          x2={VB_W - PAD_X}
          y2={trackY + trackH / 2}
          stroke="var(--ash-light)"
          strokeWidth=".6"
          opacity=".4"
        />

        {/* density marks (workouts) */}
        {markX.map((m, i) => (
          <line
            key={i}
            x1={m.x}
            y1={trackY + trackH / 2 - m.h / 2}
            x2={m.x}
            y2={trackY + trackH / 2 + m.h / 2}
            stroke="var(--ink)"
            strokeWidth=".7"
            opacity=".5"
          />
        ))}

        {/* clickable track */}
        <rect
          x={PAD_X}
          y={trackY - 6}
          width={usableW}
          height={trackH + 12}
          fill="transparent"
          onClick={onTrackClick}
          style={{ cursor: "crosshair" }}
        />

        {/* brush body */}
        <rect
          x={xStart}
          y={trackY}
          width={brushW}
          height={trackH}
          fill="var(--rubric)"
          fillOpacity={0.12}
          stroke="var(--rubric)"
          strokeWidth=".8"
          opacity={0.85}
          onMouseDown={(e) => beginDrag(e, "body")}
          style={{ cursor: "grab" }}
        />

        {/* left handle */}
        <g
          onMouseDown={(e) => beginDrag(e, "left")}
          style={{ cursor: "ew-resize" }}
        >
          <line
            x1={xStart}
            y1={trackY - 8}
            x2={xStart}
            y2={trackY + trackH + 8}
            stroke="var(--rubric)"
            strokeWidth="1.4"
            opacity=".95"
          />
          <circle cx={xStart} cy={trackY - 12} r={4.5} fill="var(--rubric)" />
        </g>

        {/* right handle */}
        <g
          onMouseDown={(e) => beginDrag(e, "right")}
          style={{ cursor: "ew-resize" }}
        >
          <line
            x1={xEnd}
            y1={trackY - 8}
            x2={xEnd}
            y2={trackY + trackH + 8}
            stroke="var(--rubric)"
            strokeWidth="1.4"
            opacity=".95"
          />
          <circle cx={xEnd} cy={trackY - 12} r={4.5} fill="var(--rubric)" />
        </g>

        {/* date labels under handles */}
        {(() => {
          const sameDay =
            format(value.start, "yyyy-MM-dd") === format(value.end, "yyyy-MM-dd");
          if (sameDay) {
            // Single day — render only one label, centered under the brush
            return (
              <text
                x={(xStart + xEnd) / 2}
                y={trackY + trackH + 22}
                fontFamily="var(--mono)"
                fontSize="9"
                fill="var(--ash)"
                textAnchor="middle"
                letterSpacing=".05em"
              >
                {format(value.start, "MMM d, yyyy")}
              </text>
            );
          }
          // Two labels — clamp them so they don't run off the edges, and
          // give them at least a small gutter from each other.
          const labelW = 70;
          const lx = Math.max(PAD_X, Math.min(xStart, VB_W - PAD_X - labelW * 2));
          const rx = Math.min(VB_W - PAD_X, Math.max(xEnd, lx + labelW));
          return (
            <>
              <text
                x={lx}
                y={trackY + trackH + 22}
                fontFamily="var(--mono)"
                fontSize="9"
                fill="var(--ash)"
                letterSpacing=".05em"
              >
                {format(value.start, "MMM d, yyyy")}
              </text>
              <text
                x={rx}
                y={trackY + trackH + 22}
                fontFamily="var(--mono)"
                fontSize="9"
                fill="var(--ash)"
                textAnchor="end"
                letterSpacing=".05em"
              >
                {format(value.end, "MMM d, yyyy")}
              </text>
            </>
          );
        })()}

        {/* span */}
        <text
          x={(xStart + xEnd) / 2}
          y={trackY - 18}
          fontFamily="var(--italic)"
          fontStyle="italic"
          fontSize="9"
          fill="var(--rubric)"
          textAnchor="middle"
          opacity=".9"
        >
          {dayLabel(differenceInDays(value.end, value.start) + 1)}
        </text>

        {/* boundary labels */}
        <text
          x={PAD_X}
          y={20}
          fontFamily="var(--mono)"
          fontSize="8"
          fill="var(--ash-light)"
          letterSpacing=".05em"
        >
          {format(earliest, "MMM yyyy")}
        </text>
        <text
          x={VB_W - PAD_X}
          y={20}
          fontFamily="var(--mono)"
          fontSize="8"
          fill="var(--ash-light)"
          textAnchor="end"
          letterSpacing=".05em"
        >
          {format(latest, "MMM yyyy")}
        </text>
      </svg>
    </div>
  );
}

function dayLabel(n: number): string {
  if (n <= 0) return "";
  if (n < 21) return `${n} day${n === 1 ? "" : "s"}`;
  if (n < 90) return `${Math.round(n / 7)} weeks`;
  if (n < 730) return `${Math.round(n / 30)} months`;
  return `${(n / 365).toFixed(1)} years`;
}
