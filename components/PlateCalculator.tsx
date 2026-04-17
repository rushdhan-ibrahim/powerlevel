"use client";

/**
 * PLATE CALCULATOR — given a target weight on the bar, work out the
 * cleanest combination of plates per side. Renders the bar visually
 * in the manuscript ink-and-rubric vocabulary.
 */

import { useMemo, useState } from "react";

const DEFAULT_BAR = 20; // kg, standard Olympic men's bar
// Standard Olympic plates in kg, heaviest first.
const STANDARD_PLATES_KG: number[] = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5];
const STANDARD_PLATES_LB: number[] = [45, 35, 25, 10, 5, 2.5];

// Visual heights so the bigger plates render bigger but stay readable.
const PLATE_HEIGHT_KG: Record<number, number> = {
  25: 92, 20: 84, 15: 72, 10: 56, 5: 38, 2.5: 26, 1.25: 18, 0.5: 12,
};
const PLATE_HEIGHT_LB: Record<number, number> = {
  45: 92, 35: 80, 25: 68, 10: 50, 5: 36, 2.5: 22,
};
// Color of the plate face (manuscript palette — rubric for "heavy", ink for the rest).
const PLATE_COLOR: Record<number, { fill: string; stroke: string }> = {
  25:   { fill: "var(--rubric)", stroke: "var(--rubric)" },
  20:   { fill: "var(--ink)",    stroke: "var(--ink)" },
  15:   { fill: "var(--ink-light)", stroke: "var(--ink)" },
  10:   { fill: "var(--ash)",    stroke: "var(--ink)" },
  5:    { fill: "var(--ash-light)", stroke: "var(--ink)" },
  2.5:  { fill: "var(--paper)", stroke: "var(--ink)" },
  1.25: { fill: "var(--paper)", stroke: "var(--ink)" },
  0.5:  { fill: "var(--paper)", stroke: "var(--ink)" },
  45:   { fill: "var(--rubric)", stroke: "var(--rubric)" },
  35:   { fill: "var(--ink)",    stroke: "var(--ink)" },
};

/** Greedy plate-loading: largest plate first, until the side is filled. */
function loadPlates(perSide: number, plates: number[]): number[] {
  const out: number[] = [];
  let remaining = perSide;
  for (const p of plates) {
    while (remaining + 1e-6 >= p) {
      out.push(p);
      remaining -= p;
    }
  }
  return out;
}

export function PlateCalculator() {
  const [unit, setUnit] = useState<"kg" | "lb">("kg");
  const [target, setTarget] = useState<string>("100");
  const [bar, setBar] = useState<string>(unit === "kg" ? "20" : "45");

  const plateSet = unit === "kg" ? STANDARD_PLATES_KG : STANDARD_PLATES_LB;
  const heights = unit === "kg" ? PLATE_HEIGHT_KG : PLATE_HEIGHT_LB;

  const numericTarget = Number(target) || 0;
  const numericBar = Number(bar) || 0;
  const perSide = Math.max(0, (numericTarget - numericBar) / 2);
  const plates = useMemo(
    () => (perSide > 0 ? loadPlates(perSide, plateSet) : []),
    [perSide, plateSet],
  );
  const loaded = numericBar + plates.reduce((a, b) => a + b, 0) * 2;
  const remainder = Math.max(0, numericTarget - loaded);

  const setUnitAndBar = (next: "kg" | "lb") => {
    setUnit(next);
    setBar(next === "kg" ? "20" : "45");
  };

  return (
    <div
      className="plate"
      style={{ padding: 28, display: "flex", flexDirection: "column", gap: 18 }}
    >
      <span className="plate-n">i</span>
      <span className="plate-t">load the bar</span>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16,
          marginTop: 10,
        }}
      >
        <label style={{ display: "block" }}>
          <span className="input-label">target on the bar</span>
          <input
            type="number"
            step={unit === "kg" ? "0.5" : "1"}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="input numerals"
            placeholder="—"
          />
        </label>
        <label style={{ display: "block" }}>
          <span className="input-label">bar weight</span>
          <input
            type="number"
            step="0.5"
            value={bar}
            onChange={(e) => setBar(e.target.value)}
            className="input numerals"
          />
        </label>
        <label style={{ display: "block" }}>
          <span className="input-label">units</span>
          <select
            value={unit}
            onChange={(e) => setUnitAndBar(e.target.value as "kg" | "lb")}
            className="input"
          >
            <option value="kg">kilograms</option>
            <option value="lb">pounds</option>
          </select>
        </label>
      </div>

      <BarVisual plates={plates} unit={unit} heights={heights} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginTop: 4,
        }}
      >
        <Stat label="per side" value={perSide.toFixed(2).replace(/\.0+$/, "")} unit={unit} />
        <Stat label="loaded" value={loaded.toString()} unit={unit} />
        <Stat
          label="remainder"
          value={remainder.toFixed(2).replace(/\.0+$/, "")}
          unit={unit}
          warn={remainder > 0}
        />
      </div>

      <div className="marginalia" style={{ marginTop: 6, lineHeight: 1.55 }}>
        Greedy fill — heaviest plate first. If a remainder is shown, your standard
        plate set can&rsquo;t hit the target exactly; round up or load fractional plates.
        Plates per side, listed heaviest to lightest:{" "}
        <span
          className="numerals"
          style={{ color: "var(--ink)", fontStyle: "normal" }}
        >
          {plates.length === 0 ? "—" : plates.join(" + ")}
        </span>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  warn,
}: {
  label: string;
  value: string;
  unit: string;
  warn?: boolean;
}) {
  return (
    <div
      style={{
        padding: "12px 14px",
        border: "1px solid var(--rule)",
        background: "var(--paper-warm)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--display)",
          fontVariant: "small-caps",
          fontSize: ".58rem",
          letterSpacing: ".16em",
          color: "var(--ash)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: "1.5rem",
          color: warn ? "var(--rubric)" : "var(--ink)",
          fontVariantNumeric: "oldstyle-nums tabular-nums",
          marginTop: 2,
        }}
      >
        {value}
        <span style={{ fontSize: ".7rem", color: "var(--ash)", marginLeft: 6 }}>
          {unit}
        </span>
      </div>
    </div>
  );
}

function BarVisual({
  plates,
  unit,
  heights,
}: {
  plates: number[];
  unit: "kg" | "lb";
  heights: Record<number, number>;
}) {
  const VB_W = 760;
  const VB_H = 140;
  const cy = VB_H / 2;
  const sleeveLen = 200;
  // Lay plates on each side from inside (against the collar) out.
  const plateThickness = (p: number) => 8 + Math.min(p, 25) * 0.5;
  let leftX = VB_W / 2 - 24; // inner edge of left sleeve
  let rightX = VB_W / 2 + 24; // inner edge of right sleeve
  const leftPlates = plates.map((p) => {
    const t = plateThickness(p);
    leftX -= t;
    return { p, x: leftX, t };
  });
  const rightPlates = plates.map((p) => {
    const t = plateThickness(p);
    const x = rightX;
    rightX += t;
    return { p, x, t };
  });

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      height={VB_H}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* the bar's central shaft */}
      <rect
        x={VB_W / 2 - 230}
        y={cy - 4}
        width={460}
        height={8}
        fill="var(--ink-light)"
        stroke="var(--ink)"
        strokeWidth=".5"
      />
      {/* knurling marks */}
      {Array.from({ length: 14 }).map((_, i) => (
        <line
          key={i}
          x1={VB_W / 2 - 200 + i * 30}
          y1={cy - 4}
          x2={VB_W / 2 - 200 + i * 30}
          y2={cy + 4}
          stroke="var(--ink)"
          strokeWidth=".3"
          opacity=".4"
        />
      ))}
      {/* collars */}
      {[VB_W / 2 - 26, VB_W / 2 + 18].map((x) => (
        <rect
          key={x}
          x={x}
          y={cy - 12}
          width={8}
          height={24}
          fill="var(--ink)"
          stroke="var(--ink)"
        />
      ))}
      {/* outer sleeves */}
      <rect
        x={VB_W / 2 - 26 - sleeveLen}
        y={cy - 5}
        width={sleeveLen}
        height={10}
        fill="var(--paper-warm)"
        stroke="var(--ink)"
        strokeWidth=".4"
      />
      <rect
        x={VB_W / 2 + 26}
        y={cy - 5}
        width={sleeveLen}
        height={10}
        fill="var(--paper-warm)"
        stroke="var(--ink)"
        strokeWidth=".4"
      />

      {/* plates */}
      {[...leftPlates, ...rightPlates].map((pl, i) => {
        const h = heights[pl.p] ?? 60;
        const c = PLATE_COLOR[pl.p] ?? { fill: "var(--ink)", stroke: "var(--ink)" };
        return (
          <g key={i}>
            <rect
              x={pl.x}
              y={cy - h / 2}
              width={pl.t}
              height={h}
              rx={2}
              fill={c.fill}
              stroke={c.stroke}
              strokeWidth=".5"
              opacity=".96"
            />
            <text
              x={pl.x + pl.t / 2}
              y={cy + h / 2 + 14}
              fontFamily="var(--mono)"
              fontSize="9"
              fill="var(--ash)"
              textAnchor="middle"
              style={{ fontVariantNumeric: "oldstyle-nums tabular-nums" }}
            >
              {pl.p}
            </text>
          </g>
        );
      })}

      {/* unit hint */}
      <text
        x={VB_W - 12}
        y={VB_H - 8}
        fontFamily="var(--italic)"
        fontStyle="italic"
        fontSize="9"
        fill="var(--ash)"
        textAnchor="end"
        opacity=".7"
      >
        plates labelled in {unit}
      </text>
    </svg>
  );
}
