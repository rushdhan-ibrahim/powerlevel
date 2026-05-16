"use client";

/**
 * THE STATIONS FRIEZE — a horizontal stained-glass strip across the
 * full plate width. Each "lancet panel" is one training phase
 * (build / maintain / detrain / ramp / off). Panel widths are
 * proportional to days. Reading left → right is reading the year.
 *
 * Hover or tap a panel to see its meta (date range, weeks, total km).
 * Phase tintures use opacity-graded `var(--rubric)` / `var(--ink)` so
 * no new colour tokens are introduced. The whole frieze sits inside
 * a hairline arched frame echoing a church-window cluster.
 */

import { useState } from "react";
import { format } from "date-fns";
import type { PhaseBand, PhaseLabel } from "@/lib/pilgrimage/insights";

const PHASE_TINT: Record<PhaseLabel, string> = {
  build:    "color-mix(in oklab, var(--rubric) 38%, transparent)",
  maintain: "color-mix(in oklab, var(--ink) 28%, transparent)",
  detrain:  "color-mix(in oklab, var(--ash-light) 60%, transparent)",
  ramp:     "color-mix(in oklab, var(--rubric) 22%, transparent)",
  off:      "color-mix(in oklab, var(--ash-light) 22%, transparent)",
};
const PHASE_HATCH: Record<PhaseLabel, string | null> = {
  build:    null,
  maintain: null,
  detrain:  "url(#frieze-hatch-detrain)",
  ramp:     null,
  off:      "url(#frieze-hatch-off)",
};

export function StationsFrieze({ bands }: { bands: PhaseBand[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (!bands.length) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: "var(--ash)", fontStyle: "italic" }}>
        no phases detected yet — the frieze fills as the weeks accumulate.
      </div>
    );
  }

  const totalDays = bands.reduce((a, b) => a + days(b.start, b.end), 0);
  const VB_W = 720;
  const VB_H = 140;
  const PAD_X = 16;
  const PAD_T = 28;
  const PAD_B = 38;
  const usableW = VB_W - PAD_X * 2;
  const usableH = VB_H - PAD_T - PAD_B;

  // Compute panel x positions
  let x = PAD_X;
  const panels = bands.map((b, i) => {
    const w = (days(b.start, b.end) / totalDays) * usableW;
    const panel = { ...b, x, w, idx: i };
    x += w;
    return panel;
  });

  // Year tick positions — render a small Roman-ish year marker where
  // a new year begins inside the frieze.
  const yearTicks: { x: number; year: number }[] = [];
  let lastYear = -1;
  for (const p of panels) {
    const y = p.start.getUTCFullYear();
    if (y !== lastYear) { yearTicks.push({ x: p.x, year: y }); lastYear = y; }
  }

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height={VB_H} aria-hidden="false">
      <defs>
        {/* diagonal hatch fill for detrain / off — like leaded glass */}
        <pattern id="frieze-hatch-detrain" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--ash)" strokeWidth=".35" opacity=".4" />
        </pattern>
        <pattern id="frieze-hatch-off" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="var(--ash-light)" strokeWidth=".25" opacity=".3" />
        </pattern>
      </defs>

      {/* outer frame — arched-top window cluster */}
      <path
        d={`M ${PAD_X - 4} ${PAD_T + usableH + 4}
            L ${PAD_X - 4} ${PAD_T - 8}
            Q ${PAD_X - 4} ${PAD_T - 18}, ${PAD_X + 6} ${PAD_T - 18}
            L ${VB_W - PAD_X - 6} ${PAD_T - 18}
            Q ${VB_W - PAD_X + 4} ${PAD_T - 18}, ${VB_W - PAD_X + 4} ${PAD_T - 8}
            L ${VB_W - PAD_X + 4} ${PAD_T + usableH + 4}
            Z`}
        fill="none"
        stroke="var(--ink)"
        strokeWidth=".4"
        opacity=".35"
      />

      {/* panels */}
      {panels.map((p) => {
        const isOpen = openIdx === p.idx;
        const hatch = PHASE_HATCH[p.phase];
        return (
          <g
            key={p.idx}
            onMouseEnter={() => setOpenIdx(p.idx)}
            onMouseLeave={() => setOpenIdx(null)}
            onClick={() => setOpenIdx((cur) => (cur === p.idx ? null : p.idx))}
            style={{ cursor: "pointer" }}
          >
            {/* leaded glass base */}
            <rect
              x={p.x}
              y={PAD_T}
              width={Math.max(0, p.w - 1)}
              height={usableH}
              fill={PHASE_TINT[p.phase]}
              opacity={isOpen ? 1 : 0.92}
            />
            {/* hatched overlay for detrain / off panels */}
            {hatch && (
              <rect
                x={p.x}
                y={PAD_T}
                width={Math.max(0, p.w - 1)}
                height={usableH}
                fill={hatch}
                opacity=".9"
              />
            )}
            {/* leading (hairline divider) on the right edge */}
            <line x1={p.x + p.w} y1={PAD_T} x2={p.x + p.w} y2={PAD_T + usableH} stroke="var(--ink)" strokeWidth=".5" opacity=".55" />
            {/* lancet arch tracery at the top of each panel */}
            <path
              d={`M ${p.x + 1} ${PAD_T}
                  Q ${p.x + p.w / 2} ${PAD_T - 6}, ${p.x + p.w - 1} ${PAD_T}`}
              fill="none"
              stroke="var(--ink)"
              strokeWidth=".4"
              opacity=".5"
            />

            {/* phase label inside panel when wide enough */}
            {p.w > 36 && (
              <text
                x={p.x + p.w / 2}
                y={PAD_T + usableH / 2 + 4}
                fontFamily="var(--display)"
                fontVariant="small-caps"
                fontSize="9"
                letterSpacing=".14em"
                fill="var(--paper)"
                textAnchor="middle"
                style={{ pointerEvents: "none", opacity: 0.95 }}
              >
                {p.phase}
              </text>
            )}
          </g>
        );
      })}

      {/* year ticks beneath */}
      {yearTicks.map((t, i) => (
        <g key={i}>
          <line x1={t.x} y1={PAD_T + usableH} x2={t.x} y2={PAD_T + usableH + 4} stroke="var(--ink)" strokeWidth=".4" opacity=".4" />
          <text x={t.x + 4} y={PAD_T + usableH + 14}
            fontFamily="var(--display)" fontVariant="small-caps"
            fontSize="8.5" letterSpacing=".18em"
            fill="var(--ash)" opacity=".75"
          >
            {t.year}
          </text>
        </g>
      ))}

      {/* hover meta band at the bottom */}
      {openIdx != null && (() => {
        const p = panels[openIdx];
        return (
          <text
            x={VB_W / 2} y={PAD_T + usableH + 28}
            fontFamily="var(--italic)" fontStyle="italic"
            fontSize="10.5" fill="var(--ink)"
            textAnchor="middle" opacity=".9"
          >
            {`${p.phase} · ${format(p.start, "d MMM").toLowerCase()} → ${format(p.end, "d MMM").toLowerCase()} · ${p.weeks} wk · ${p.totalKm.toFixed(1)} km`}
          </text>
        );
      })()}
    </svg>
  );
}

function days(a: Date, b: Date): number {
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1);
}
