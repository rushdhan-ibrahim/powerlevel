"use client";

/**
 * THE PILGRIM'S KALENDAR — daily km laid out as a horizontal medieval
 * kalendar. Columns = ISO weeks, rows = days (Mon..Sun). Each cell's
 * fill saturates with kilometres run. Today's column is rubric;
 * yesterday and the day before keep a hairline rule above them so the
 * current week always reads as the right edge.
 *
 * Cousin to MemoryField (which hangs strings with beads for lifting
 * tonnage). This is the running equivalent — same paper, same ink,
 * different geometry.
 */

import { format, getISOWeek, parseISO } from "date-fns";
import { roman } from "@/lib/manuscript";

type Day = { date: string; km: number; runs: number };

export function PilgrimsKalendar({ days }: { days: Day[] }) {
  if (!days.length) {
    return (
      <svg viewBox="0 0 380 200" width="100%" height="200" aria-hidden="true">
        <text
          x={190}
          y={104}
          fontFamily="var(--italic)"
          fontStyle="italic"
          fontSize={11}
          fill="var(--ash)"
          opacity={0.55}
          textAnchor="middle"
        >
          the kalendar opens when the first run is logged
        </text>
      </svg>
    );
  }

  // Snap window: start on the Monday on/before the first day; end on
  // the Sunday on/after the last day. Always 7 rows.
  const first = parseISO(days[0].date);
  const last  = parseISO(days[days.length - 1].date);
  const startDow = (first.getDay() + 6) % 7; // Mon = 0
  const start = new Date(first); start.setDate(first.getDate() - startDow);
  const endDow = (last.getDay() + 6) % 7;
  const end   = new Date(last);  end.setDate(last.getDate() + (6 - endDow));
  const DAY_MS = 86_400_000;
  const totalDays = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
  const weeks = Math.ceil(totalDays / 7);

  const byDate = new Map(days.map((d) => [d.date, d]));
  const maxKm = Math.max(...days.map((d) => d.km), 1);
  const todayKey = format(new Date(), "yyyy-MM-dd");

  // Geometry
  const VB_W = 380;
  const VB_H = 200;
  const PAD_L = 26;        // room for day-of-week glyphs
  const PAD_R = 6;
  const PAD_T = 30;        // room for month labels
  const PAD_B = 12;
  const usableW = VB_W - PAD_L - PAD_R;
  const usableH = VB_H - PAD_T - PAD_B;
  const cellW = usableW / weeks;
  const cellH = usableH / 7;
  const cellSize = Math.min(cellW, cellH) * 0.8;
  const cellGap = (Math.min(cellW, cellH) - cellSize) / 2;

  // Pre-compute month boundaries so labels land at the first column
  // of each new month.
  const monthLabels: { col: number; month: string }[] = [];
  let lastMonthKey = "";
  for (let col = 0; col < weeks; col++) {
    const colDate = new Date(start.getTime() + col * 7 * DAY_MS);
    const key = format(colDate, "yyyy-MM");
    if (key !== lastMonthKey) {
      monthLabels.push({ col, month: format(colDate, "MMM").toLowerCase() });
      lastMonthKey = key;
    }
  }

  // Ink saturation by km level — paper → ink-25 → ink-55 → rubric.
  const saturationFor = (km: number, isToday: boolean) => {
    if (km <= 0) return "color-mix(in oklab, var(--ink) 5%, transparent)";
    if (isToday) return "var(--rubric)";
    if (km > maxKm * 0.66) return "color-mix(in oklab, var(--rubric) 75%, transparent)";
    if (km > maxKm * 0.33) return "color-mix(in oklab, var(--rubric) 50%, transparent)";
    return "color-mix(in oklab, var(--rubric) 25%, transparent)";
  };

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height={240} aria-hidden="true">
      {/* hairline frame */}
      <rect
        x={PAD_L - 4}
        y={PAD_T - 4}
        width={usableW + 8}
        height={usableH + 8}
        fill="none"
        stroke="var(--ink)"
        strokeWidth=".22"
        opacity=".25"
      />

      {/* month labels (display small-caps) along the top */}
      {monthLabels.map((m, i) => (
        <text
          key={i}
          x={PAD_L + m.col * cellW + cellW / 2}
          y={PAD_T - 10}
          fontFamily="var(--display)"
          fontSize="7.5"
          letterSpacing=".18em"
          fill="var(--ash)"
          textAnchor="middle"
          opacity=".85"
        >
          {m.month}
        </text>
      ))}

      {/* day-of-week initials down the left */}
      {["M", "T", "W", "T", "F", "S", "S"].map((dow, i) => (
        <text
          key={`dow-${i}`}
          x={PAD_L - 10}
          y={PAD_T + i * cellH + cellH / 2 + 2.5}
          fontFamily="var(--display)"
          fontSize="6.5"
          letterSpacing=".12em"
          fill="var(--ash-light)"
          textAnchor="middle"
          opacity=".7"
        >
          {dow}
        </text>
      ))}

      {/* cells */}
      {Array.from({ length: weeks }).flatMap((_, col) => {
        const colDate = new Date(start.getTime() + col * 7 * DAY_MS);
        const isCurrentWeek = (() => {
          const todayIso = todayKey;
          for (let i = 0; i < 7; i++) {
            const d = new Date(colDate.getTime() + i * DAY_MS);
            if (format(d, "yyyy-MM-dd") === todayIso) return true;
          }
          return false;
        })();

        return Array.from({ length: 7 }).map((_, row) => {
          const d = new Date(colDate.getTime() + row * DAY_MS);
          const iso = format(d, "yyyy-MM-dd");
          const cell = byDate.get(iso);
          const km = cell?.km ?? 0;
          const isToday = iso === todayKey;
          const fill = saturationFor(km, isToday);
          const cellX = PAD_L + col * cellW + cellGap;
          const cellY = PAD_T + row * cellH + cellGap;

          return (
            <g key={`${col}-${row}`}>
              <rect
                x={cellX}
                y={cellY}
                width={cellSize}
                height={cellSize}
                rx={0.6}
                fill={fill}
                opacity={isToday ? 0.95 : 0.85}
              >
                <title>{`${iso} · ${km.toFixed(1)} km`}</title>
              </rect>
              {isToday && (
                <rect
                  x={cellX - 0.6}
                  y={cellY - 0.6}
                  width={cellSize + 1.2}
                  height={cellSize + 1.2}
                  rx={1}
                  fill="none"
                  stroke="var(--rubric)"
                  strokeWidth=".8"
                  opacity=".95"
                />
              )}
            </g>
          );
        });
      })}

      {/* rubric brace under the current week — anchors the eye */}
      {(() => {
        // Find current-week column
        const today = new Date();
        const todayCol = Math.floor((today.getTime() - start.getTime()) / (7 * DAY_MS));
        if (todayCol < 0 || todayCol >= weeks) return null;
        const braceX = PAD_L + todayCol * cellW + cellW / 2;
        const braceY = PAD_T + usableH + 4;
        return (
          <g>
            <line
              x1={braceX - cellW * 0.45}
              y1={braceY}
              x2={braceX + cellW * 0.45}
              y2={braceY}
              stroke="var(--rubric)"
              strokeWidth=".7"
              opacity=".85"
            />
            <text
              x={braceX}
              y={braceY + 8}
              fontFamily="var(--mono)"
              fontSize="6.5"
              letterSpacing=".06em"
              fill="var(--rubric)"
              textAnchor="middle"
              opacity=".85"
            >
              {`wk ${roman(getISOWeek(today)).toLowerCase()}`}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}
