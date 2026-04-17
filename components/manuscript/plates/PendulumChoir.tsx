"use client";

/**
 * THE PENDULUM CHOIR — twelve weeks, twelve pendulums hung from a beam.
 * The length of each pendulum encodes that week's tonnage. The bobs
 * swing at slightly differing periods, as is the law of the choir.
 * The most recent week's bob is rubric.
 */

import { mulberry32 } from "@/lib/manuscript";
import { format, parseISO } from "date-fns";

type Datum = { week: string; tonnage: number; sessions: number };

export function PendulumChoir({ data, seed = 88 }: { data: Datum[]; seed?: number }) {
  const rng = mulberry32(seed);

  const VB_W = 380;
  const VB_H = 240;
  const PAD_X = 24;
  const BEAM_Y = 24;
  const minLen = 26;
  const maxLen = 168;

  const tonnages = data.map((d) => d.tonnage);
  const maxT = Math.max(...tonnages, 1);

  const stride = (VB_W - PAD_X * 2) / Math.max(data.length - 1, 1);

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="240" aria-hidden="true">
      {/* the beam */}
      <line
        x1={PAD_X - 8}
        y1={BEAM_Y}
        x2={VB_W - PAD_X + 8}
        y2={BEAM_Y}
        stroke="var(--ink)"
        strokeWidth=".5"
        opacity=".55"
      />
      {/* beam fasteners */}
      <circle cx={PAD_X - 6} cy={BEAM_Y} r={1.6} fill="var(--ink)" opacity=".5" />
      <circle cx={VB_W - PAD_X + 6} cy={BEAM_Y} r={1.6} fill="var(--ink)" opacity=".5" />

      {/* the choir */}
      {data.map((d, i) => {
        const x = PAD_X + i * stride;
        const isCurrent = i === data.length - 1;
        // sqrt scaling so a "small" week doesn't shrink to nothing next
        // to a heavy one — gives every week some visible mass.
        const norm = d.tonnage > 0 ? Math.sqrt(d.tonnage / maxT) : 0;
        const len = d.tonnage > 0 ? minLen + norm * (maxLen - minLen) : minLen;
        const period = 4 + (i % 5) * 0.7 + rng() * 0.6;
        const angle = 8 - (i % 4) * 0.8;
        const bobR = d.tonnage > 0 ? 2.6 + norm * 4.5 : 1.8;

        return (
          <g
            key={d.week}
            style={{
              transformOrigin: `${x}px ${BEAM_Y}px`,
              animation: `pendulum ${period.toFixed(2)}s ease-in-out infinite`,
              ["--a" as string]: `${-angle}deg`,
              ["--b" as string]: `${angle}deg`,
            }}
          >
            <line
              x1={x}
              y1={BEAM_Y}
              x2={x}
              y2={BEAM_Y + len}
              stroke={isCurrent ? "var(--rubric)" : "var(--ink)"}
              strokeWidth={isCurrent ? 0.4 : 0.3}
              opacity={d.tonnage > 0 ? (isCurrent ? 0.7 : 0.55) : 0.25}
            />
            {/* breath halo on current bob */}
            {isCurrent && d.tonnage > 0 && (
              <circle
                cx={x}
                cy={BEAM_Y + len}
                r={bobR + 3.5}
                fill="var(--rubric)"
                opacity=".12"
                style={{ animation: "pulse 4s ease-in-out infinite" }}
              />
            )}
            <circle
              cx={x}
              cy={BEAM_Y + len}
              r={bobR}
              fill={isCurrent ? "var(--rubric)" : "var(--ink)"}
              opacity={d.tonnage > 0 ? (isCurrent ? 0.92 : 0.65) : 0.25}
            />
          </g>
        );
      })}

      {/* week labels — every 3rd */}
      {data.map((d, i) => {
        if (i % 3 !== 0 && i !== data.length - 1) return null;
        const x = PAD_X + i * stride;
        return (
          <text
            key={d.week}
            x={x}
            y={VB_H - 6}
            fontFamily="var(--mono)"
            fontSize="7"
            fill="var(--ash-light)"
            opacity=".7"
            textAnchor="middle"
            letterSpacing=".05em"
          >
            {format(parseISO(d.week), "M/d")}
          </text>
        );
      })}

      {/* marginalia */}
      <text
        x={PAD_X}
        y="14"
        fontFamily="var(--italic)"
        fontStyle="italic"
        fontSize="8"
        fill="var(--rubric)"
        opacity=".75"
      >
        the choir of weeks
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
        length ∝ √(weight lifted)
      </text>
    </svg>
  );
}
