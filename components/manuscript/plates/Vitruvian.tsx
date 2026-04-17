"use client";

/**
 * THE VITRUVIAN FIGURE — an abstract anatomical silhouette with
 * muscle zones illuminated by working-set volume. Not a realistic
 * body; a manuscript diagram. Zones are hollow when unworked,
 * filled when volume meets MEV, rubric when at MAV or above.
 */

import { polar } from "@/lib/manuscript";

type MuscleVolume = {
  group: string;
  label: string;
  lastWeek: number;
  mev: number;
  mavHigh: number;
  status: "below" | "mev" | "mav" | "above";
};

export function Vitruvian({ muscles }: { muscles: MuscleVolume[] }) {
  const vb = "0 0 300 460";
  const lookup = new Map(muscles.map((m) => [m.group, m]));

  // Ornamental circle around the figure (Vitruvian allusion)
  const cx = 150;
  const cy = 230;

  const fillFor = (group: string) => {
    const m = lookup.get(group);
    if (!m || m.status === "below")
      return { fill: "none", stroke: "var(--ink)", opacity: 0.32 };
    if (m.status === "mev")
      return { fill: "var(--ink)", fillOpacity: 0.15, stroke: "var(--ink)", opacity: 0.7 };
    if (m.status === "mav")
      return { fill: "var(--rubric)", fillOpacity: 0.22, stroke: "var(--rubric)", opacity: 0.85 };
    return { fill: "var(--rubric)", fillOpacity: 0.5, stroke: "var(--rubric)", opacity: 1 };
  };

  return (
    <svg viewBox={vb} width="100%" height="460" aria-hidden="true">
      {/* Vitruvian orbit */}
      <g style={{ animation: "spin 240s linear infinite", transformOrigin: `${cx}px ${cy}px` }}>
        <circle cx={cx} cy={cy} r={200} fill="none" stroke="var(--ink)" strokeWidth=".25" opacity=".25" />
        <circle
          cx={cx}
          cy={cy}
          r={192}
          fill="none"
          stroke="var(--ink)"
          strokeWidth=".15"
          opacity=".15"
          strokeDasharray="2,6"
        />
      </g>
      {/* inscribed square */}
      <rect
        x={cx - 180}
        y={cy - 180}
        width={360}
        height={360}
        fill="none"
        stroke="var(--ink)"
        strokeWidth=".22"
        opacity=".18"
      />

      {/* HEAD */}
      <circle
        cx={cx}
        cy={80}
        r={22}
        fill="none"
        stroke="var(--ink)"
        strokeWidth=".5"
        opacity=".6"
      />

      {/* TORSO silhouette */}
      <path
        d="M124,108 L176,108 L184,140 L186,200 L182,260 L172,304 L128,304 L118,260 L114,200 L116,140 Z"
        fill="none"
        stroke="var(--ink)"
        strokeWidth=".5"
        opacity=".6"
      />

      {/* SHOULDERS */}
      <ellipse
        cx={112}
        cy={128}
        rx={16}
        ry={12}
        {...fillFor("shoulders")}
      />
      <ellipse
        cx={188}
        cy={128}
        rx={16}
        ry={12}
        {...fillFor("shoulders")}
      />

      {/* ARMS — biceps */}
      <ellipse
        cx={96}
        cy={162}
        rx={11}
        ry={22}
        {...fillFor("biceps")}
      />
      <ellipse
        cx={204}
        cy={162}
        rx={11}
        ry={22}
        {...fillFor("biceps")}
      />
      {/* triceps (mirrored smaller) */}
      <ellipse
        cx={82}
        cy={156}
        rx={6}
        ry={18}
        {...fillFor("triceps")}
      />
      <ellipse
        cx={218}
        cy={156}
        rx={6}
        ry={18}
        {...fillFor("triceps")}
      />
      {/* forearms */}
      <ellipse
        cx={90}
        cy={210}
        rx={9}
        ry={26}
        fill="none"
        stroke="var(--ink)"
        strokeWidth=".4"
        opacity=".35"
      />
      <ellipse
        cx={210}
        cy={210}
        rx={9}
        ry={26}
        fill="none"
        stroke="var(--ink)"
        strokeWidth=".4"
        opacity=".35"
      />

      {/* CHEST */}
      <path
        d="M128,132 Q150,124 172,132 L170,170 Q150,178 130,170 Z"
        {...fillFor("chest")}
      />

      {/* BACK (implied behind; rendered as small tag on right side) */}
      {/* We represent the back as two pads visible along the lats */}
      <path
        d="M120,160 Q122,200 128,230 L132,225 Q128,195 126,162 Z"
        {...fillFor("back")}
      />
      <path
        d="M180,160 Q178,200 172,230 L168,225 Q172,195 174,162 Z"
        {...fillFor("back")}
      />

      {/* CORE (abdomen) */}
      <rect
        x={136}
        y={186}
        width={28}
        height={80}
        rx={3}
        {...fillFor("core")}
      />
      {/* core internal dividers */}
      {[206, 224, 242].map((y, i) => (
        <line
          key={i}
          x1={140}
          y1={y}
          x2={160}
          y2={y}
          stroke="var(--ink)"
          strokeWidth=".25"
          opacity=".3"
        />
      ))}

      {/* GLUTES */}
      <ellipse
        cx={150}
        cy={316}
        rx={34}
        ry={16}
        {...fillFor("glutes")}
      />

      {/* LEGS silhouette */}
      <path
        d="M126,332 L140,332 L138,440 L124,440 Z"
        fill="none"
        stroke="var(--ink)"
        strokeWidth=".5"
        opacity=".6"
      />
      <path
        d="M160,332 L174,332 L176,440 L162,440 Z"
        fill="none"
        stroke="var(--ink)"
        strokeWidth=".5"
        opacity=".6"
      />

      {/* QUADS (front pad) */}
      <ellipse
        cx={132}
        cy={358}
        rx={10}
        ry={22}
        {...fillFor("quads")}
      />
      <ellipse
        cx={168}
        cy={358}
        rx={10}
        ry={22}
        {...fillFor("quads")}
      />

      {/* HAMSTRINGS */}
      <ellipse
        cx={132}
        cy={400}
        rx={9}
        ry={18}
        {...fillFor("hamstrings")}
      />
      <ellipse
        cx={168}
        cy={400}
        rx={9}
        ry={18}
        {...fillFor("hamstrings")}
      />

      {/* CALVES */}
      <ellipse
        cx={132}
        cy={438}
        rx={8}
        ry={10}
        {...fillFor("calves")}
      />
      <ellipse
        cx={168}
        cy={438}
        rx={8}
        ry={10}
        {...fillFor("calves")}
      />

      {/* Labels in margins */}
      {[
        { x: 72, y: 128, label: "shoulders" },
        { x: 54, y: 164, label: "biceps" },
        { x: 56, y: 238, label: "chest" },
        { x: 54, y: 276, label: "back" },
        { x: 56, y: 360, label: "quads" },
        { x: 56, y: 402, label: "hams" },
        { x: 56, y: 440, label: "calves" },
      ].map(({ x, y, label }) => (
        <text
          key={label}
          x={x}
          y={y}
          fontFamily="var(--italic)"
          fontStyle="italic"
          fontSize="8"
          fill="var(--ash)"
          textAnchor="end"
          opacity=".85"
        >
          {label}
        </text>
      ))}
      {[
        { x: 228, y: 128, label: "shoulders" },
        { x: 246, y: 164, label: "biceps" },
        { x: 244, y: 202, label: "triceps" },
        { x: 244, y: 228, label: "core" },
        { x: 244, y: 316, label: "glutes" },
      ].map(({ x, y, label }) => (
        <text
          key={label}
          x={x}
          y={y}
          fontFamily="var(--italic)"
          fontStyle="italic"
          fontSize="8"
          fill="var(--ash)"
          opacity=".85"
        >
          {label}
        </text>
      ))}

      {/* breathing pulse at heart */}
      <circle
        cx={cx}
        cy={150}
        r={2.4}
        fill="var(--rubric)"
        opacity=".8"
        style={{ animation: "pulse 2.6s ease-in-out infinite" }}
      />

      {/* legend */}
      <g transform={`translate(${cx - 80}, 14)`}>
        <LegendDot x={0} y={0} fill="none" stroke="var(--ink)" label="below MEV" />
        <LegendDot x={56} y={0} fill="var(--ink)" fillOpacity={0.2} stroke="var(--ink)" label="MEV" />
        <LegendDot x={96} y={0} fill="var(--rubric)" fillOpacity={0.25} stroke="var(--rubric)" label="MAV" />
        <LegendDot x={136} y={0} fill="var(--rubric)" fillOpacity={0.6} stroke="var(--rubric)" label="above" />
      </g>
    </svg>
  );
}

function LegendDot({
  x,
  y,
  fill,
  fillOpacity,
  stroke,
  label,
}: {
  x: number;
  y: number;
  fill: string;
  fillOpacity?: number;
  stroke: string;
  label: string;
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        x={0}
        y={0}
        width={9}
        height={9}
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth=".4"
      />
      <text
        x={13}
        y={8}
        fontFamily="var(--mono)"
        fontSize="7"
        fill="var(--ash)"
        letterSpacing=".04em"
      >
        {label}
      </text>
    </g>
  );
}
