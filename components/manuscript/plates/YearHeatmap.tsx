"use client";

/**
 * YEAR HEATMAP — a 53-week grid of training intensity, in the manuscript
 * vocabulary. Each cell is a day; cell colour deepens with kg lifted.
 * Rest days are paper; rendered in ink shades.
 */

import { format, parseISO } from "date-fns";
import { useState } from "react";

type Cell = { date: string; tonnage: number; sessions: number };

export function YearHeatmap({ cells }: { cells: Cell[] }) {
  const VB_W = 760;
  const VB_H = 160;
  const PAD_L = 32;
  const PAD_T = 30;
  const PAD_B = 22;
  const usableH = VB_H - PAD_T - PAD_B;
  const cellSize = Math.max(8, Math.floor(usableH / 7) - 1);
  const stride = cellSize + 1.5;

  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Build a 7-row grid: row = weekday (Mon=0…Sun=6); column = ISO week.
  // We assume cells are ordered oldest→newest and span exactly the
  // window we want plotted.
  const maxT = Math.max(...cells.map((c) => c.tonnage), 1);
  // A simple bucket → opacity ramp. Empty/rest days use ash; trained
  // days deepen to rubric in line with the manuscript palette.
  const opacityFor = (tonnage: number) => {
    if (tonnage <= 0) return 0.07;
    const norm = Math.sqrt(tonnage / maxT); // sqrt for visible mid-range
    return 0.18 + norm * 0.78;
  };

  // Group into columns by ISO week-start (Mon).
  type Col = { weekStart: Date; days: { idx: number; cell: Cell; weekday: number }[] };
  const cols: Col[] = [];
  cells.forEach((c, idx) => {
    const d = parseISO(c.date);
    const day = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
    if (day === 0 || cols.length === 0) {
      cols.push({ weekStart: d, days: [] });
    }
    cols[cols.length - 1].days.push({ idx, cell: c, weekday: day });
  });

  const hover = hoverIdx != null ? cells[hoverIdx] : null;

  // Month labels — first column whose week-start lands in a new month gets
  // labelled, so the labels never overlap.
  const monthLabels: { x: number; label: string }[] = [];
  let lastMonth = -1;
  cols.forEach((col, ci) => {
    const m = col.weekStart.getMonth();
    if (m !== lastMonth) {
      monthLabels.push({
        x: PAD_L + ci * stride,
        label: format(col.weekStart, "MMM").toLowerCase(),
      });
      lastMonth = m;
    }
  });

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      height={VB_H}
      style={{ touchAction: "none" }}
    >
      {/* weekday labels (M, W, F) */}
      {[
        { y: 0, label: "m" },
        { y: 2, label: "w" },
        { y: 4, label: "f" },
      ].map((d) => (
        <text
          key={d.label}
          x={PAD_L - 6}
          y={PAD_T + d.y * stride + cellSize - 1}
          fontFamily="var(--italic)"
          fontStyle="italic"
          fontSize="8"
          fill="var(--ash)"
          textAnchor="end"
          opacity=".7"
        >
          {d.label}
        </text>
      ))}

      {/* month labels */}
      {monthLabels.map((m, i) => (
        <text
          key={`${m.label}-${i}`}
          x={m.x}
          y={PAD_T - 8}
          fontFamily="var(--italic)"
          fontStyle="italic"
          fontSize="9"
          fill="var(--ash)"
          opacity=".75"
        >
          {m.label}
        </text>
      ))}

      {/* the grid */}
      {cols.map((col, ci) =>
        col.days.map((dd) => {
          const x = PAD_L + ci * stride;
          const y = PAD_T + dd.weekday * stride;
          const isHover = hoverIdx === dd.idx;
          const fill = dd.cell.sessions > 0 ? "var(--rubric)" : "var(--ink)";
          return (
            <rect
              key={dd.cell.date}
              x={x}
              y={y}
              width={cellSize}
              height={cellSize}
              fill={fill}
              opacity={opacityFor(dd.cell.tonnage)}
              stroke={isHover ? "var(--ink)" : "none"}
              strokeWidth=".7"
              onMouseEnter={() => setHoverIdx(dd.idx)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{ cursor: "pointer" }}
            />
          );
        }),
      )}

      {/* legend (right side) */}
      <g transform={`translate(${VB_W - 100}, ${VB_H - 12})`}>
        <text
          x={-6}
          y={5}
          fontFamily="var(--italic)"
          fontStyle="italic"
          fontSize="8"
          fill="var(--ash)"
          textAnchor="end"
          opacity=".75"
        >
          less
        </text>
        {[0, 0.18, 0.42, 0.7, 0.95].map((op, i) => (
          <rect
            key={i}
            x={i * 11}
            y={0}
            width={9}
            height={9}
            fill="var(--rubric)"
            opacity={op || 0.07}
          />
        ))}
        <text
          x={62}
          y={5}
          fontFamily="var(--italic)"
          fontStyle="italic"
          fontSize="8"
          fill="var(--ash)"
          opacity=".75"
        >
          more
        </text>
      </g>

      {/* hover tooltip */}
      {hover && (
        <g pointerEvents="none">
          <rect
            x={PAD_L}
            y={PAD_T + 7 * stride + 4}
            width={250}
            height={16}
            fill="var(--paper)"
            stroke="var(--rubric)"
            strokeWidth=".5"
            opacity=".96"
          />
          <text
            x={PAD_L + 6}
            y={PAD_T + 7 * stride + 15}
            fontFamily="var(--mono)"
            fontSize="9"
            fill="var(--ink)"
            style={{ fontVariantNumeric: "oldstyle-nums tabular-nums" }}
          >
            {format(parseISO(hover.date), "EEE MMM d, yyyy").toLowerCase()}
            {" · "}
            {hover.sessions === 0
              ? "rest day"
              : `${Math.round(hover.tonnage).toLocaleString()} kg lifted`}
          </text>
        </g>
      )}
    </svg>
  );
}
