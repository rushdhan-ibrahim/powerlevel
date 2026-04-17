"use client";

/**
 * THE MEMORY FIELD — vertical strings for the weeks of the year.
 * Each bead pinned to a string is a session's tonnage. The current
 * week's string is rubric. The strings sway as if hung from rafters.
 */

import { mulberry32 } from "@/lib/manuscript";
import { format, parseISO } from "date-fns";

type Cell = { date: string; count: number; tonnage?: number };

export function MemoryField({
  cells,
  weeks,
  seed = 311,
  prDates,
}: {
  cells: Cell[];
  weeks: number;
  seed?: number;
  /** Optional set of yyyy-MM-dd strings; days that match get a rubric ring
   * around their bead — the lifter wrote down a PR on this day. */
  prDates?: Set<string>;
}) {
  const rng = mulberry32(seed);

  const VB_W = 380;
  const VB_H = 240;
  const PAD_X = 20;
  const PAD_TOP = 24;
  const PAD_BOTTOM = 28;
  const stringWidth = (VB_W - PAD_X * 2) / weeks;
  const usableH = VB_H - PAD_TOP - PAD_BOTTOM;

  const tonnages = cells.filter((c) => (c.tonnage ?? 0) > 0).map((c) => c.tonnage!);
  const maxTonnage = Math.max(...tonnages, 1);

  const grid: Cell[][] = [];
  for (let w = 0; w < weeks; w++) {
    grid.push(cells.slice(w * 7, w * 7 + 7));
  }

  const todayKey = format(new Date(), "yyyy-MM-dd");
  const currentWeekIdx = grid.findIndex((week) => week.some((c) => c.date === todayKey));

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="240" aria-hidden="true">
      {/* horizontal "average" rule */}
      <line
        x1={PAD_X}
        y1={PAD_TOP + usableH / 2}
        x2={VB_W - PAD_X}
        y2={PAD_TOP + usableH / 2}
        stroke="var(--ink)"
        strokeWidth=".18"
        opacity=".15"
        strokeDasharray="3,4"
      />

      {grid.map((week, wi) => {
        const x = PAD_X + wi * stringWidth + stringWidth / 2;
        const isCurrent = wi === currentWeekIdx;
        const sway = (rng() - 0.5) * 1.4;
        const phase = wi % 5;

        return (
          <g
            key={wi}
            style={{
              transformOrigin: `${x}px ${PAD_TOP}px`,
              animation: `sway ${10 + phase * 1.5}s ease-in-out ${phase * 0.4}s infinite`,
              ["--sw" as string]: `${1 + sway}`,
            }}
          >
            {/* the string */}
            <line
              x1={x}
              y1={PAD_TOP}
              x2={x}
              y2={PAD_TOP + usableH}
              stroke={isCurrent ? "var(--rubric)" : "var(--ink)"}
              strokeWidth={isCurrent ? 0.55 : 0.32}
              opacity={isCurrent ? 0.7 : 0.38}
            />

            {/* top tie-off bar */}
            <line
              x1={x - 4}
              y1={PAD_TOP}
              x2={x + 4}
              y2={PAD_TOP}
              stroke={isCurrent ? "var(--rubric)" : "var(--ink)"}
              strokeWidth=".5"
              opacity=".7"
            />

            {/* the beads (one per day in the week, Mon→Sun) */}
            {week.map((day, di) => {
              if (day.count < 0) return null;
              const y = PAD_TOP + (di / 6.5) * usableH + 12;
              const tonnage = day.tonnage ?? 0;
              const isFuture = day.count === -1;
              const hasSession = day.count > 0;
              if (isFuture) return null;

              if (!hasSession) {
                return (
                  <circle
                    key={di}
                    cx={x}
                    cy={y}
                    r={1}
                    fill="var(--ink)"
                    opacity=".15"
                  />
                );
              }

              // sqrt scaling so the difference between a small and a
              // medium session is visually legible — linear scaling
              // squashed everything below the heaviest day into the
              // same dot.
              const norm = tonnage > 0 ? Math.sqrt(tonnage / maxTonnage) : 0.4;
              const radius = 2.2 + norm * 3.6;
              const isToday = day.date === todayKey;
              const isPR = prDates?.has(day.date) ?? false;

              return (
                <g key={di}>
                  <circle
                    cx={x}
                    cy={y}
                    r={radius + 2}
                    fill={isToday || isPR ? "var(--rubric)" : "var(--ink)"}
                    opacity=".08"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={radius}
                    fill={isToday ? "var(--rubric)" : "var(--ink)"}
                    opacity={isToday ? 0.92 : 0.78}
                  />
                  {isPR && (
                    <circle
                      cx={x}
                      cy={y}
                      r={radius + 3}
                      fill="none"
                      stroke="var(--rubric)"
                      strokeWidth=".7"
                      opacity=".95"
                    />
                  )}
                </g>
              );
            })}

            {/* terminal weight at bottom of string */}
            {isCurrent && (
              <circle
                cx={x}
                cy={PAD_TOP + usableH + 4}
                r={2.4}
                fill="var(--rubric)"
                opacity=".82"
              />
            )}
          </g>
        );
      })}

      {/* week-of-year marginalia at every fourth string */}
      {grid.map((week, wi) => {
        if (wi % 4 !== 0) return null;
        const x = PAD_X + wi * stringWidth + stringWidth / 2;
        const firstDay = week[0]?.date;
        if (!firstDay) return null;
        return (
          <text
            key={wi}
            x={x}
            y={VB_H - 10}
            fontFamily="var(--mono)"
            fontSize="7"
            fill="var(--ash-light)"
            opacity=".62"
            textAnchor="middle"
            letterSpacing=".05em"
          >
            {format(parseISO(firstDay), "M/d")}
          </text>
        );
      })}

      {/* hanging notation marginalia (top-left, top-right) */}
      <text
        x={PAD_X}
        y="14"
        fontFamily="var(--italic)"
        fontStyle="italic"
        fontSize="8"
        fill="var(--rubric)"
        opacity=".75"
      >
        each bead is a workout
      </text>
      <text
        x={VB_W - PAD_X}
        y="14"
        fontFamily="var(--italic)"
        fontStyle="italic"
        fontSize="8"
        fill="var(--ash)"
        opacity=".55"
        textAnchor="end"
      >
        bead size ∝ √(weight lifted)
      </text>
    </svg>
  );
}
