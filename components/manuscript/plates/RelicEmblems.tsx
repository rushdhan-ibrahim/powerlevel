/**
 * RELIC EMBLEMS — hand-drawn glyphs that sit inside each Reliquary
 * niche, one per tissue. The vocabulary is by category:
 *
 *   cardiovascular  →  flame / drop / fine branching / chambered shape
 *   tendon          →  woven cord, sometimes with anatomical hint
 *   bone            →  bone fragment with hatch shading
 *   muscle          →  leaf (different shapes per group)
 *
 * Every emblem is monochromatic on `var(--ink)` so the niche's
 * surrounding "halo" (set by the cabinet) is the only colour-bearing
 * element — that's the relic's spiritual state, glowing brighter as
 * the tissue takes more load. Active-injury tissues additionally
 * pulse in rubric (handled by the cabinet, not the emblem).
 */

type Props = { size?: number };

const stroke = (op = 0.85) => ({ stroke: "var(--ink)", strokeWidth: 0.65, fill: "none", opacity: op });
const fill   = (op = 0.85) => ({ fill: "var(--ink)", opacity: op });

// ─── Cardiovascular ──────────────────────────────────────────────
export function RelicPlasma({ size = 28 }: Props) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      {/* a drop of water with a small radiant halo */}
      <path d="M 16 5 Q 22 14 22 19 Q 22 25 16 25 Q 10 25 10 19 Q 10 14 16 5 Z" {...stroke()} />
      <circle cx="16" cy="20" r="2" {...fill(0.6)} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
        const rad = (a * Math.PI) / 180;
        const x1 = 16 + Math.cos(rad) * 12; const y1 = 17 + Math.sin(rad) * 12;
        const x2 = 16 + Math.cos(rad) * 14; const y2 = 17 + Math.sin(rad) * 14;
        return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} {...stroke(0.4)} />;
      })}
    </svg>
  );
}

export function RelicStrokeVolume({ size = 28 }: Props) {
  // A small chambered heart-shape — two lobes meeting at a point.
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <path d="M 16 26 L 7 16 Q 4 11, 8 8 Q 12 6, 16 11 Q 20 6, 24 8 Q 28 11, 25 16 Z" {...stroke()} />
      {/* chamber-line down the middle */}
      <line x1="16" y1="11" x2="16" y2="25" {...stroke(0.45)} />
    </svg>
  );
}

export function RelicMitochondria({ size = 28 }: Props) {
  // Eight-pointed seed — the canonical mitochondrion silhouette
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <ellipse cx="16" cy="16" rx="10" ry="6" {...stroke()} />
      {/* cristae — inner folds */}
      {[10, 13, 16, 19, 22].map((x) => (
        <path key={x} d={`M ${x} 11.5 Q ${x + 1} 16, ${x} 20.5`} {...stroke(0.5)} />
      ))}
    </svg>
  );
}

export function RelicCapillary({ size = 28 }: Props) {
  // Fine branching twig
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <line x1="16" y1="27" x2="16" y2="6" {...stroke()} />
      {/* branches */}
      <path d="M 16 11 L 9 6"  {...stroke(0.7)} />
      <path d="M 16 11 L 23 6" {...stroke(0.7)} />
      <path d="M 16 16 L 7 14" {...stroke(0.5)} />
      <path d="M 16 16 L 25 14" {...stroke(0.5)} />
      <path d="M 16 21 L 10 22" {...stroke(0.4)} />
      <path d="M 16 21 L 22 22" {...stroke(0.4)} />
    </svg>
  );
}

// ─── Tendon / connective ─────────────────────────────────────────
function CordKnot({ size = 28, knotY }: { size?: number; knotY: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      {/* two strands twisting */}
      <path d={`M 12 4 Q 16 ${knotY - 6}, 12 ${knotY} Q 16 ${knotY + 6}, 12 28`} {...stroke()} />
      <path d={`M 20 4 Q 16 ${knotY - 6}, 20 ${knotY} Q 16 ${knotY + 6}, 20 28`} {...stroke()} />
      {/* knot crossover */}
      <circle cx="16" cy={knotY} r="2.6" {...fill(0.55)} />
    </svg>
  );
}

export function RelicAchilles({ size = 28 }: Props) { return <CordKnot size={size} knotY={24} />; }     // knot low — ankle
export function RelicPatellar({ size = 28 }: Props) { return <CordKnot size={size} knotY={10} />; }     // knot high — knee

export function RelicPlantar({ size = 28 }: Props) {
  // an arch
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <path d="M 4 24 Q 16 4, 28 24" {...stroke()} />
      <line x1="4" y1="24" x2="28" y2="24" {...stroke(0.55)} />
      <circle cx="16" cy="24" r="1.6" {...fill(0.7)} />
    </svg>
  );
}

export function RelicITB({ size = 28 }: Props) {
  // vertical band with two side-tabs (the band's attachments)
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <rect x="14" y="4" width="4" height="24" {...stroke()} />
      <line x1="10" y1="11" x2="14" y2="11" {...stroke(0.6)} />
      <line x1="18" y1="11" x2="22" y2="11" {...stroke(0.6)} />
      <line x1="10" y1="21" x2="14" y2="21" {...stroke(0.6)} />
      <line x1="18" y1="21" x2="22" y2="21" {...stroke(0.6)} />
    </svg>
  );
}

export function RelicFascia({ size = 28 }: Props) {
  // small spiderweb
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        return <line key={i} x1="16" y1="16" x2={16 + Math.cos(a) * 12} y2={16 + Math.sin(a) * 12} {...stroke(0.7)} />;
      })}
      {[4, 8, 12].map((r) => (
        <polygon
          key={r}
          points={Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
            return `${16 + Math.cos(a) * r},${16 + Math.sin(a) * r}`;
          }).join(" ")}
          {...stroke(0.45)}
        />
      ))}
    </svg>
  );
}

export function RelicPostTib({ size = 28 }: Props) {
  // cord with a small drop hanging — the watershed zone
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <path d="M 12 4 Q 16 16, 12 28" {...stroke()} />
      <path d="M 20 4 Q 16 16, 20 28" {...stroke()} />
      {/* the watershed drop */}
      <path d="M 16 18 Q 18 22, 16 24 Q 14 22, 16 18 Z" {...fill(0.6)} />
    </svg>
  );
}

// ─── Bone ────────────────────────────────────────────────────────
export function RelicTibia({ size = 28 }: Props) {
  // upright bone with end-knobs (long bone silhouette)
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <path d="M 13 5 Q 11 4 11 7 Q 11 10 13 11 L 13 21 Q 11 22 11 25 Q 11 28 13 27 L 19 27 Q 21 28 21 25 Q 21 22 19 21 L 19 11 Q 21 10 21 7 Q 21 4 19 5 Z" {...stroke()} />
      {/* hatched stress markers */}
      {[14, 17, 20].map((y) => (
        <line key={y} x1="13.5" y1={y} x2="18.5" y2={y} {...stroke(0.35)} />
      ))}
    </svg>
  );
}

export function RelicMetatarsal({ size = 28 }: Props) {
  // five long bones in a row, fanning toward the toes
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => {
        const baseX = 16; const tipX = 6 + i * 5;
        return (
          <line key={i} x1={baseX} y1="24" x2={tipX} y2="6" {...stroke(0.7)} />
        );
      })}
      {/* heel anchor */}
      <ellipse cx="16" cy="26" rx="6" ry="2" {...stroke(0.65)} />
    </svg>
  );
}

export function RelicShinPeriosteum({ size = 28 }: Props) {
  // vertical bone with cross-hatch on the front face
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <rect x="12" y="4" width="8" height="24" {...stroke()} />
      {[7, 11, 15, 19, 23, 27].map((y) => (
        <line key={y} x1="12" y1={y} x2="20" y2={y} {...stroke(0.32)} />
      ))}
    </svg>
  );
}

// ─── Muscle (leaves with subtle silhouette differences) ──────────
function Leaf({ size = 28, w = 8, h = 18, veins = 4 }: { size?: number; w?: number; h?: number; veins?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      {/* leaf body */}
      <path
        d={`M 16 ${16 - h} Q ${16 + w} 16, 16 ${16 + h} Q ${16 - w} 16, 16 ${16 - h} Z`}
        {...stroke()}
      />
      {/* central vein */}
      <line x1="16" y1={16 - h} x2="16" y2={16 + h} {...stroke(0.55)} />
      {/* side veins */}
      {Array.from({ length: veins }, (_, i) => {
        const t = (i + 1) / (veins + 1);
        const y = (16 - h) + 2 * t * h;
        const xOff = w * (1 - Math.abs(t - 0.5) * 2) * 0.85;
        return (
          <g key={i}>
            <line x1="16" y1={y} x2={16 - xOff} y2={y + 1} {...stroke(0.35)} />
            <line x1="16" y1={y} x2={16 + xOff} y2={y + 1} {...stroke(0.35)} />
          </g>
        );
      })}
    </svg>
  );
}

export function RelicCalf({ size = 28 }: Props)        { return <Leaf size={size} w={7}  h={12} veins={4} />; }
export function RelicQuad({ size = 28 }: Props)        { return <Leaf size={size} w={10} h={13} veins={5} />; }
export function RelicHamstring({ size = 28 }: Props)   { return <Leaf size={size} w={6}  h={14} veins={4} />; }
export function RelicGlute({ size = 28 }: Props)       { return <Leaf size={size} w={11} h={10} veins={3} />; }
export function RelicHipFlexor({ size = 28 }: Props)   { return <Leaf size={size} w={7}  h={11} veins={3} />; }
export function RelicCore({ size = 28 }: Props)        { return <Leaf size={size} w={12} h={11} veins={5} />; }

// ─── Lookup by tissue id ──────────────────────────────────────────
export const RELIC_BY_TISSUE: Record<string, (props: Props) => React.JSX.Element> = {
  plasma_volume:         RelicPlasma,
  stroke_volume:         RelicStrokeVolume,
  mitochondrial_density: RelicMitochondria,
  capillary_density:     RelicCapillary,
  achilles_tendon:       RelicAchilles,
  patellar_tendon:       RelicPatellar,
  plantar_fascia:        RelicPlantar,
  iliotibial_band:       RelicITB,
  fascia_general:        RelicFascia,
  posterior_tibialis:    RelicPostTib,
  cortical_bone:         RelicTibia,
  metatarsal_bone:       RelicMetatarsal,
  shin_periosteum:       RelicShinPeriosteum,
  calf_complex:          RelicCalf,
  quadriceps:            RelicQuad,
  hamstrings:            RelicHamstring,
  glutes:                RelicGlute,
  hip_flexors:           RelicHipFlexor,
  core_trunk:            RelicCore,
};
