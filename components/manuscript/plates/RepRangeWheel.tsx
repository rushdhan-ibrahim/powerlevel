"use client";

/**
 * A wheel of three bands — strength, hypertrophy, metabolic —
 * sized by their share of working sets. The most-used band
 * is marked in rubric. An annular ring, not a pie, so the
 * center remains available for a rubric numeral summary.
 */

import { polar } from "@/lib/manuscript";

type Props = {
  strengthPct: number;
  hypertrophyPct: number;
  metabolicPct: number;
  total: number;
};

export function RepRangeWheel({
  strengthPct,
  hypertrophyPct,
  metabolicPct,
  total,
}: Props) {
  const cx = 150;
  const cy = 150;
  const rOuter = 108;
  const rInner = 74;

  const segments = [
    { label: "Strength", reps: "1–5", pct: strengthPct, color: "var(--rubric)" },
    { label: "Hypertrophy", reps: "6–12", pct: hypertrophyPct, color: "var(--ink)" },
    { label: "Metabolic", reps: "13+", pct: metabolicPct, color: "var(--ash)" },
  ];

  // dominant segment for rubric emphasis
  const dominant = [...segments].sort((a, b) => b.pct - a.pct)[0];

  let cursor = -Math.PI / 2;
  const arcs = segments.map((seg) => {
    const span = (seg.pct / 100) * Math.PI * 2;
    const start = cursor;
    const end = cursor + span;
    cursor = end;
    return { ...seg, start, end, span };
  });

  return (
    <svg viewBox="0 0 300 300" width="100%" height="280" aria-hidden="true">
      {/* outer tick ring, slow rotation */}
      <g style={{ animation: "spin 180s linear infinite", transformOrigin: `${cx}px ${cy}px` }}>
        <circle cx={cx} cy={cy} r={132} fill="none" stroke="var(--ink)" strokeWidth=".4" opacity=".35" />
        <circle
          cx={cx}
          cy={cy}
          r={124}
          fill="none"
          stroke="var(--ink)"
          strokeWidth=".18"
          opacity=".2"
          strokeDasharray="2,5"
        />
        {Array.from({ length: 20 }, (_, i) => {
          const a = (i / 20) * Math.PI * 2 - Math.PI / 2;
          const [x1, y1] = polar(cx, cy, 128, a);
          const [x2, y2] = polar(cx, cy, 120, a);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--ink)"
              strokeWidth={i % 5 === 0 ? 0.45 : 0.22}
              opacity={i % 5 === 0 ? 0.55 : 0.3}
            />
          );
        })}
      </g>

      {/* the three annular segments */}
      {arcs.map((seg, i) => {
        if (seg.pct === 0) return null;
        const pad = 0.015; // small gap between segments
        const start = seg.start + pad;
        const end = seg.end - pad;
        const large = end - start > Math.PI ? 1 : 0;
        const [x1o, y1o] = polar(cx, cy, rOuter, start);
        const [x2o, y2o] = polar(cx, cy, rOuter, end);
        const [x1i, y1i] = polar(cx, cy, rInner, end);
        const [x2i, y2i] = polar(cx, cy, rInner, start);
        const d = [
          `M${x1o.toFixed(2)},${y1o.toFixed(2)}`,
          `A${rOuter},${rOuter} 0 ${large} 1 ${x2o.toFixed(2)},${y2o.toFixed(2)}`,
          `L${x1i.toFixed(2)},${y1i.toFixed(2)}`,
          `A${rInner},${rInner} 0 ${large} 0 ${x2i.toFixed(2)},${y2i.toFixed(2)}`,
          "Z",
        ].join(" ");
        const isDominant = seg.label === dominant.label;
        return (
          <g key={i}>
            <path
              d={d}
              fill={seg.color}
              fillOpacity={isDominant ? 0.85 : 0.28}
              stroke={seg.color}
              strokeWidth={isDominant ? 0.6 : 0.35}
              opacity={0.95}
            />
          </g>
        );
      })}

      {/* segment labels on the outside */}
      {arcs.map((seg, i) => {
        if (seg.pct === 0) return null;
        const mid = (seg.start + seg.end) / 2;
        const [lx, ly] = polar(cx, cy, rOuter + 14, mid);
        const anchor = lx < cx - 4 ? "end" : lx > cx + 4 ? "start" : "middle";
        return (
          <g key={`l-${i}`}>
            <text
              x={lx}
              y={ly - 2}
              fontFamily="var(--italic)"
              fontStyle="italic"
              fontSize="9"
              fill="var(--ash)"
              textAnchor={anchor}
              opacity=".9"
            >
              {seg.label.toLowerCase()}
              <tspan
                dx="4"
                fontFamily="var(--mono)"
                fontStyle="normal"
                fontSize="7.5"
                fill="var(--ash-light)"
              >
                {seg.reps}
              </tspan>
            </text>
            <text
              x={lx}
              y={ly + 10}
              fontFamily="var(--mono)"
              fontSize="10"
              fill={seg.label === dominant.label ? "var(--rubric)" : "var(--ink-light)"}
              textAnchor={anchor}
              letterSpacing=".02em"
            >
              {seg.pct}%
            </text>
          </g>
        );
      })}

      {/* central summary */}
      <g style={{ animation: "breathe 10s ease-in-out infinite", transformOrigin: `${cx}px ${cy}px` }}>
        <circle
          cx={cx}
          cy={cy}
          r={rInner - 4}
          fill="var(--paper)"
          stroke="var(--ink)"
          strokeWidth=".3"
          opacity=".55"
        />
      </g>
      <text
        x={cx}
        y={cy - 6}
        fontFamily="var(--mono)"
        fontSize="24"
        fill="var(--ink)"
        textAnchor="middle"
        letterSpacing="-.02em"
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 12}
        fontFamily="var(--display)"
        fontVariant="small-caps"
        fontSize="8"
        fill="var(--ash)"
        textAnchor="middle"
        letterSpacing=".14em"
      >
        working sets
      </text>
      <text
        x={cx}
        y={cy + 26}
        fontFamily="var(--italic)"
        fontStyle="italic"
        fontSize="8"
        fill="var(--ash-light)"
        textAnchor="middle"
      >
        last 28 days
      </text>
    </svg>
  );
}
