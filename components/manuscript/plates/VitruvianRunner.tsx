"use client";

/**
 * THE VITRUVIAN RUNNER — sibling to the lifting Vitruvian figure.
 *
 * Same upright body silhouette, but the highlighted regions are the
 * tissues this app's running model tracks: post-tib, shin periosteum,
 * Achilles, ITB, plantar fascia, metatarsal — plus the muscle groups
 * already shared with the lifting view (calves, quads, hams, glutes,
 * hip flexors, core). Each zone's fill is the tissue's chronic-load
 * fullness; an actively-injured tissue pulses in rubric.
 *
 * Renders as a manuscript anatomical diagram — hairline rules,
 * Vitruvian orbit overhead, no realistic anatomy.
 */

import type { TissueSnapshot } from "@/lib/pilgrimage/derive";

type Props = {
  snapshots: Record<string, TissueSnapshot>;
  activeInjuryTissues?: string[];
};

export function VitruvianRunner({ snapshots, activeInjuryTissues = [] }: Props) {
  const vb = "0 0 300 480";
  const cx = 150;
  const cy = 240;
  const activeSet = new Set(activeInjuryTissues);

  const fillFor = (tissueId: string) => {
    const t = snapshots[tissueId];
    if (!t) return { fill: "none", stroke: "var(--ink)", strokeWidth: 0.45, opacity: 0.32 };
    const isInjured = activeSet.has(tissueId);
    const pct = Math.max(0, Math.min(1, t.currentPctOfPeak / 100));
    if (isInjured) {
      return {
        fill: "var(--rubric)",
        fillOpacity: 0.55,
        stroke: "var(--rubric)",
        strokeWidth: 0.85,
        opacity: 1,
        className: "vit-injury",
      };
    }
    if (pct < 0.25) return { fill: "var(--ink)", fillOpacity: 0.10, stroke: "var(--ink)", strokeWidth: 0.4,  opacity: 0.55 };
    if (pct < 0.55) return { fill: "var(--ink)", fillOpacity: 0.22, stroke: "var(--ink)", strokeWidth: 0.5,  opacity: 0.75 };
    if (pct < 0.80) return { fill: "var(--rubric)", fillOpacity: 0.28, stroke: "var(--rubric)", strokeWidth: 0.6,  opacity: 0.85 };
    return                  { fill: "var(--rubric)", fillOpacity: 0.5,  stroke: "var(--rubric)", strokeWidth: 0.7,  opacity: 0.95 };
  };

  return (
    <svg viewBox={vb} width="100%" height={460} aria-hidden="true">
      {/* Vitruvian orbit + inscribed square — manuscript framing */}
      <g style={{ animation: "spin 240s linear infinite", transformOrigin: `${cx}px ${cy}px` }}>
        <circle cx={cx} cy={cy} r={200} fill="none" stroke="var(--ink)" strokeWidth=".25" opacity=".25" />
        <circle cx={cx} cy={cy} r={192} fill="none" stroke="var(--ink)" strokeWidth=".15" opacity=".15" strokeDasharray="2,6" />
      </g>
      <rect x={cx - 180} y={cy - 180} width={360} height={360} fill="none" stroke="var(--ink)" strokeWidth=".22" opacity=".18" />

      {/* HEAD */}
      <circle cx={cx} cy={88} r={22} fill="none" stroke="var(--ink)" strokeWidth=".5" opacity=".6" />

      {/* TORSO outline */}
      <path
        d="M124,116 L176,116 L184,148 L186,208 L182,268 L172,312 L128,312 L118,268 L114,208 L116,148 Z"
        fill="none"
        stroke="var(--ink)"
        strokeWidth=".5"
        opacity=".55"
      />

      {/* CORE — illuminated when running load builds the trunk stabilisers */}
      <path d="M132,222 Q150,228 168,222 L166,256 Q150,262 134,256 Z" {...fillFor("core_trunk")} />

      {/* HIP FLEXORS — narrow band below the waist line */}
      <path d="M132,272 Q150,278 168,272 L166,300 Q150,306 134,300 Z" {...fillFor("hip_flexors")} />

      {/* GLUTES — broad oval at the pelvis */}
      <ellipse cx={cx} cy={328} rx={32} ry={14} {...fillFor("glutes")} />

      {/* LEGS — upper thighs */}
      <ellipse cx={130} cy={362} rx={14} ry={28} {...fillFor("quadriceps")} />
      <ellipse cx={170} cy={362} rx={14} ry={28} {...fillFor("quadriceps")} />
      {/* HAMSTRINGS — same anatomical thigh region, drawn as a slightly
          offset darker oval behind (we're rendering the front view, but
          the hams appear as a vertical band on either side) */}
      <ellipse cx={130} cy={368} rx={5} ry={26} {...fillFor("hamstrings")} />
      <ellipse cx={170} cy={368} rx={5} ry={26} {...fillFor("hamstrings")} />

      {/* IT BAND — lateral thigh strip, outside the quads */}
      <rect x={114} y={344} width={4} height={50} {...fillFor("iliotibial_band")} />
      <rect x={182} y={344} width={4} height={50} {...fillFor("iliotibial_band")} />

      {/* KNEES (patellar tendon) — just below the thighs */}
      <ellipse cx={130} cy={398} rx={11} ry={5} {...fillFor("patellar_tendon")} />
      <ellipse cx={170} cy={398} rx={11} ry={5} {...fillFor("patellar_tendon")} />

      {/* SHIN PERIOSTEUM — anterior tibial strip */}
      <rect x={124} y={406} width={12} height={42} {...fillFor("shin_periosteum")} />
      <rect x={164} y={406} width={12} height={42} {...fillFor("shin_periosteum")} />

      {/* POSTERIOR TIBIALIS — medial shin band (inside edge of each shin) */}
      <rect x={130} y={420} width={4} height={26} {...fillFor("posterior_tibialis")} />
      <rect x={166} y={420} width={4} height={26} {...fillFor("posterior_tibialis")} />

      {/* CORTICAL BONE — diffuse hint of the tibia */}
      <line x1={130} y1={406} x2={130} y2={448} {...fillFor("cortical_bone")} />
      <line x1={170} y1={406} x2={170} y2={448} {...fillFor("cortical_bone")} />

      {/* CALVES — back of the lower leg (drawn as wider ellipses behind shins) */}
      <ellipse cx={130} cy={428} rx={10} ry={18} {...fillFor("calf_complex")} />
      <ellipse cx={170} cy={428} rx={10} ry={18} {...fillFor("calf_complex")} />

      {/* ACHILLES — narrow band at the ankle, just below the calf */}
      <rect x={127} y={448} width={6} height={9} {...fillFor("achilles_tendon")} />
      <rect x={167} y={448} width={6} height={9} {...fillFor("achilles_tendon")} />

      {/* METATARSAL BONE + PLANTAR FASCIA — the foot */}
      <ellipse cx={130} cy={462} rx={11} ry={5} {...fillFor("metatarsal_bone")} />
      <ellipse cx={170} cy={462} rx={11} ry={5} {...fillFor("metatarsal_bone")} />
      <line x1={120} y1={467} x2={140} y2={467} {...fillFor("plantar_fascia")} />
      <line x1={160} y1={467} x2={180} y2={467} {...fillFor("plantar_fascia")} />

      {/* HEART — small glowing dot at chest centre */}
      <circle cx={cx} cy={158} r={3} fill="var(--rubric)" opacity=".85"
        style={{ animation: "pulse 2.6s ease-in-out infinite" }} />

      {/* Labels — italic small marginalia hugging the silhouette */}
      <g style={{ pointerEvents: "none" }}>
        {/* left side */}
        {[
          { x: 110, y: 240, label: "core" },
          { x: 100, y: 280, label: "hip flex." },
          { x:  98, y: 330, label: "glutes" },
          { x:  98, y: 362, label: "quads" },
          { x:  98, y: 372, label: "/ hams" },
          { x:  98, y: 400, label: "patellar" },
          { x:  98, y: 426, label: "calves" },
          { x:  98, y: 452, label: "achilles" },
          { x:  98, y: 464, label: "plantar" },
        ].map(({ x, y, label }) => (
          <text key={`L-${label}`} x={x} y={y}
            fontFamily="var(--italic)" fontStyle="italic"
            fontSize="7.5" fill="var(--ash)"
            textAnchor="end" opacity=".82"
          >
            {label}
          </text>
        ))}
        {/* right side */}
        {[
          { x: 202, y: 156, label: "heart" },
          { x: 202, y: 348, label: "IT band" },
          { x: 202, y: 416, label: "shin perios." },
          { x: 202, y: 428, label: "post-tib" },
          { x: 202, y: 444, label: "tibia" },
          { x: 202, y: 462, label: "metatarsal" },
        ].map(({ x, y, label }) => (
          <text key={`R-${label}`} x={x} y={y}
            fontFamily="var(--italic)" fontStyle="italic"
            fontSize="7.5" fill="var(--ash)"
            textAnchor="start" opacity=".82"
          >
            {label}
          </text>
        ))}
      </g>

      {/* Legend */}
      <g transform={`translate(${cx - 92}, 18)`}>
        <LegendDot x={0}    y={0} fill="none"        stroke="var(--ink)" label="quiet" />
        <LegendDot x={50}   y={0} fill="var(--ink)"  fillOpacity={0.22} stroke="var(--ink)" label="loaded" />
        <LegendDot x={106}  y={0} fill="var(--rubric)" fillOpacity={0.28} stroke="var(--rubric)" label="ramping" />
        <LegendDot x={164}  y={0} fill="var(--rubric)" fillOpacity={0.55} stroke="var(--rubric)" label="injury" />
      </g>

      <style>{`
        .vit-injury {
          animation: vitInjuryPulse 2.6s ease-in-out infinite;
          transform-origin: center;
        }
        @keyframes vitInjuryPulse {
          0%, 100% { opacity: .75; }
          50%      { opacity: 1;  filter: drop-shadow(0 0 4px var(--rubric)); }
        }
      `}</style>
    </svg>
  );
}

function LegendDot({ x, y, fill, fillOpacity, stroke, label }: { x: number; y: number; fill: string; fillOpacity?: number; stroke?: string; label: string }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle cx={0} cy={0} r={3.5} fill={fill} fillOpacity={fillOpacity} stroke={stroke} strokeWidth=".45" />
      <text x={6} y={3} fontFamily="var(--italic)" fontStyle="italic" fontSize="7.5" fill="var(--ash)" opacity=".82">
        {label}
      </text>
    </g>
  );
}
