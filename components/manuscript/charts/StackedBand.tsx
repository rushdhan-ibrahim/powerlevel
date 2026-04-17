"use client";

/**
 * STACKED BAND — rep-range distribution per week. Each vertical
 * bar represents a week; segments within are strength / hypertrophy
 * / metabolic proportions. Ink for the dominant rep-range; ash for
 * the secondary; rubric accent on the user's most recent week.
 */

import { format, parseISO } from "date-fns";

export type StackedWeek = {
  week: string; // ISO date string (week starting)
  strength: number;
  hypertrophy: number;
  metabolic: number;
};

export function StackedBand({ data, height = 180 }: { data: StackedWeek[]; height?: number }) {
  const VB_W = 800;
  const VB_H = 220;
  const PAD_L = 48;
  const PAD_R = 24;
  const PAD_T = 18;
  const PAD_B = 40;

  const usableW = VB_W - PAD_L - PAD_R;
  const usableH = VB_H - PAD_T - PAD_B;

  if (data.length === 0) {
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
          no rep-range distribution yet
        </text>
      </svg>
    );
  }

  const barWidth = (usableW / data.length) * 0.7;
  const stride = usableW / data.length;

  const totals = data.map((d) => d.strength + d.hypertrophy + d.metabolic);
  const globalMax = Math.max(...totals, 1);

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height={height} aria-hidden="true">
      {/* baseline */}
      <line
        x1={PAD_L}
        y1={PAD_T + usableH}
        x2={PAD_L + usableW}
        y2={PAD_T + usableH}
        stroke="var(--ink)"
        strokeWidth=".5"
        opacity=".55"
      />

      {/* y-axis with tick marks for clarity */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <g key={t}>
          <line
            x1={PAD_L - 4}
            y1={PAD_T + (1 - t) * usableH}
            x2={PAD_L + usableW}
            y2={PAD_T + (1 - t) * usableH}
            stroke="var(--ink)"
            strokeWidth=".18"
            opacity={t === 0 ? 0 : 0.14}
            strokeDasharray="2,4"
          />
          <text
            x={PAD_L - 8}
            y={PAD_T + (1 - t) * usableH + 3.5}
            fontFamily="var(--mono)"
            fontSize="10"
            fill="var(--ash)"
            textAnchor="end"
            style={{ fontVariantNumeric: "oldstyle-nums tabular-nums" }}
          >
            {Math.round(t * globalMax)}
          </text>
        </g>
      ))}

      {data.map((d, i) => {
        const total = totals[i];
        const x = PAD_L + i * stride + (stride - barWidth) / 2;
        const hFull = (total / globalMax) * usableH;
        let cursorY = PAD_T + usableH - hFull;
        const isLast = i === data.length - 1;

        const segments: { h: number; fill: string; stroke: string }[] = [];
        if (total > 0) {
          segments.push({
            h: (d.strength / globalMax) * usableH,
            fill: isLast ? "var(--rubric)" : "var(--ink)",
            stroke: "none",
          });
          segments.push({
            h: (d.hypertrophy / globalMax) * usableH,
            fill: isLast ? "var(--rubric)" : "var(--ink)",
            stroke: "none",
          });
          segments.push({
            h: (d.metabolic / globalMax) * usableH,
            fill: isLast ? "var(--rubric)" : "var(--ash)",
            stroke: "none",
          });
        }

        // assigned opacities so the three ranges read distinctly
        const OPS = isLast ? [0.92, 0.55, 0.25] : [0.85, 0.5, 0.22];

        return (
          <g key={d.week}>
            {segments.map((s, si) => {
              if (s.h === 0) return null;
              const top = cursorY;
              cursorY += s.h;
              return (
                <rect
                  key={si}
                  x={x}
                  y={top}
                  width={barWidth}
                  height={s.h}
                  fill={s.fill}
                  opacity={OPS[si]}
                />
              );
            })}

            {i % 3 === 0 || isLast ? (
              <text
                x={x + barWidth / 2}
                y={PAD_T + usableH + 14}
                fontFamily="var(--mono)"
                fontSize="9"
                fill={isLast ? "var(--rubric)" : "var(--ash)"}
                textAnchor="middle"
                style={{ fontVariantNumeric: "oldstyle-nums tabular-nums" }}
              >
                {format(parseISO(d.week), "M/d")}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* legend */}
      <g transform={`translate(${PAD_L + 4}, ${PAD_T + 2})`}>
        <LegendSwatch x={0} label="strength" opacity={0.85} fill="var(--ink)" />
        <LegendSwatch x={96} label="hypertrophy" opacity={0.5} fill="var(--ink)" />
        <LegendSwatch x={200} label="metabolic" opacity={0.3} fill="var(--ash)" />
      </g>
    </svg>
  );
}

function LegendSwatch({
  x,
  label,
  opacity,
  fill,
}: {
  x: number;
  label: string;
  opacity: number;
  fill: string;
}) {
  return (
    <g transform={`translate(${x}, 0)`}>
      <rect x="0" y="0" width="10" height="10" fill={fill} opacity={opacity} />
      <text
        x={14}
        y={9}
        fontFamily="var(--italic)"
        fontStyle="italic"
        fontSize="10"
        fill="var(--ash)"
      >
        {label}
      </text>
    </g>
  );
}
