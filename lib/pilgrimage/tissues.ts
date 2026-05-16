/**
 * THE RELIQUARY — tissue & tendon adaptation model.
 *
 * Each tissue accumulates an exponentially-weighted "adaptation
 * stimulus" with a literature-informed half-life. The score is a
 * useful trend signal, not a clinical measurement. The actionable
 * read is the acute/chronic ratio (>1.5 = overload window) on the
 * tissue actually carrying the symptoms.
 *
 * Direct port of the Python TISSUE_MODEL + run_stimulus used in
 * /Users/rush/Documents/Fit\ file\ extractor/fit_bulk_exporter_py_v2/
 * build_dashboard.py — kept verbatim for parity with the existing
 * dashboard outputs.
 */
export type TissueCategory = "cardiovascular" | "tendon" | "bone" | "muscle";

export type TissueRegion =
  | "torso_front" | "torso_back" | "heart" | "core" | "hip_flex"
  | "quad" | "ham" | "glute"
  | "patellar" | "shin_ant" | "tibia" | "post_tib"
  | "calf" | "achilles" | "plantar" | "metatarsal" | "itb";

export interface TissueDef {
  id: string;
  label: string;
  category: TissueCategory;
  halfLifeDays: number;
  region: TissueRegion;
  why: string;
}

export const TISSUE_MODEL: readonly TissueDef[] = [
  // — Cardiovascular / haematological —
  { id: "plasma_volume",         label: "Plasma volume",         category: "cardiovascular", halfLifeDays:  5, region: "torso_front", why: "Expands quickly with heat / endurance loading; decays within days of detraining." },
  { id: "stroke_volume",         label: "Cardiac stroke volume", category: "cardiovascular", halfLifeDays: 14, region: "heart",       why: "Eccentric LV remodelling from sustained aerobic loading." },
  { id: "mitochondrial_density", label: "Mitochondrial density", category: "cardiovascular", halfLifeDays: 21, region: "torso_front", why: "Skeletal-muscle aerobic enzyme content; roughly 6 wk half-life of detraining loss." },
  { id: "capillary_density",     label: "Capillary density",     category: "cardiovascular", halfLifeDays: 28, region: "torso_back",  why: "Microvascular angiogenesis; slow to build, slow to lose." },

  // — Tendon / connective —
  { id: "achilles_tendon",       label: "Achilles tendon",       category: "tendon",         halfLifeDays: 42, region: "achilles",    why: "Collagen turnover ~6 wk; sensitive to volume and low cadence (longer ground contact = bigger peaks)." },
  { id: "patellar_tendon",       label: "Patellar tendon",       category: "tendon",         halfLifeDays: 42, region: "patellar",    why: "Similar collagen kinetics to Achilles; loaded by knee-extensor force." },
  { id: "plantar_fascia",        label: "Plantar fascia",        category: "tendon",         halfLifeDays: 56, region: "plantar",     why: "Dense connective tissue; slow remodel; volume spikes drive plantar fasciitis." },
  { id: "iliotibial_band",       label: "Iliotibial band",       category: "tendon",         halfLifeDays: 35, region: "itb",         why: "Tensile loading from hip-abductor function; ramp spikes trigger ITBS." },
  { id: "fascia_general",        label: "General fascia",        category: "tendon",         halfLifeDays: 60, region: "torso_front", why: "Whole-body fascial network adaptation; slow background turnover." },
  { id: "posterior_tibialis",    label: "Posterior tibialis",    category: "tendon",         halfLifeDays: 60, region: "post_tib",    why: "Primary arch stabiliser; 5–6× BW per stride; watershed zone behind the medial malleolus has poor blood supply, so heals slowly." },

  // — Bone —
  { id: "cortical_bone",         label: "Cortical bone (tibia)", category: "bone",           halfLifeDays: 90, region: "tibia",       why: "Wolff's-law remodelling; stress fractures cluster on >30%/wk ramps." },
  { id: "metatarsal_bone",       label: "Metatarsal bone",       category: "bone",           halfLifeDays: 90, region: "metatarsal",  why: "Forefoot loading; classic 2nd–3rd metatarsal stress-fracture site." },
  { id: "shin_periosteum",       label: "Shin periosteum",       category: "bone",           halfLifeDays: 45, region: "shin_ant",    why: "Anterior tibial periosteum; site of medial tibial stress syndrome (shin splints)." },

  // — Muscle (whole groups) —
  { id: "calf_complex",          label: "Calf complex",          category: "muscle",         halfLifeDays: 12, region: "calf",        why: "Soleus + gastrocnemius; primary push-off muscles in running." },
  { id: "quadriceps",            label: "Quadriceps",            category: "muscle",         halfLifeDays: 12, region: "quad",        why: "Eccentric load on descents and braking phase." },
  { id: "hamstrings",            label: "Hamstrings",            category: "muscle",         halfLifeDays: 12, region: "ham",         why: "Late swing phase and hip extension." },
  { id: "glutes",                label: "Gluteal complex",       category: "muscle",         halfLifeDays: 12, region: "glute",       why: "Hip extensors / abductors; key to pelvic stability." },
  { id: "hip_flexors",           label: "Hip flexors",           category: "muscle",         halfLifeDays: 12, region: "hip_flex",    why: "Iliopsoas / rectus femoris; high cadence raises demand." },
  { id: "core_trunk",            label: "Core / trunk",          category: "muscle",         halfLifeDays: 14, region: "core",        why: "Anti-rotation stabilisers under stride load." },
] as const;

export const TISSUE_BY_ID: Record<string, TissueDef> = Object.fromEntries(
  TISSUE_MODEL.map((t) => [t.id, t]),
);

/** Daily exponential decay factor so that f(half-life) = 0.5. */
export function decayFromHalfLife(halfLifeDays: number): number {
  return Math.exp(-Math.log(2) / Math.max(0.5, halfLifeDays));
}

/**
 * Single-run stimulus contribution for a given tissue. Mirrors the
 * Python rules exactly: cardiovascular tissues scale with HR-weighted
 * minutes; tendons scale with km × cadence-penalty; post-tib also
 * scales with HR factor (faster runs = bigger push-off peaks); shin
 * periosteum scales with km + small HR premium; everything else is
 * km-linear with a slight push for calves/quads.
 */
export interface RunSummaryForStimulus {
  distanceKm: number;
  durationS: number;
  avgHr: number | null;
  avgCadenceSpm: number | null; // already-doubled steps/min
}

export function runStimulus(run: RunSummaryForStimulus, tissueId: string): number {
  const km = run.distanceKm || 0;
  const minutes = (run.durationS || 0) / 60;
  const hr = run.avgHr ?? 0;
  const cad = run.avgCadenceSpm ?? 170; // neutral default

  // Cadence-driven impact penalty. 170 spm is neutral; lower cadence =
  // longer ground contact = bigger peak per stride.
  const cadPenalty = Math.max(0.7, Math.min(1.4, 1 + (170 - cad) / 80));
  // HR intensity proxy; 150 bpm is the aerobic anchor.
  const hrFactor = Math.max(0.4, Math.min(1.6, (hr || 150) / 150));

  if (tissueId === "plasma_volume" || tissueId === "stroke_volume"
   || tissueId === "mitochondrial_density" || tissueId === "capillary_density") {
    const scale: Record<string, number> = {
      plasma_volume: 1.0, stroke_volume: 1.2,
      mitochondrial_density: 1.0, capillary_density: 1.0,
    };
    return (scale[tissueId] ?? 1) * minutes * hrFactor / 60;
  }
  if (tissueId === "achilles_tendon" || tissueId === "patellar_tendon") {
    return km * cadPenalty;
  }
  if (tissueId === "posterior_tibialis") {
    return km * cadPenalty * (0.7 + 0.6 * hrFactor);
  }
  if (tissueId === "shin_periosteum") {
    return km * (0.85 + 0.3 * hrFactor);
  }
  if (tissueId === "plantar_fascia" || tissueId === "iliotibial_band"
   || tissueId === "fascia_general" || tissueId === "cortical_bone"
   || tissueId === "metatarsal_bone") {
    return km;
  }
  // Muscle compartments — small premium for the push-off / eccentric groups.
  return km * (tissueId === "calf_complex" || tissueId === "quadriceps" ? 1.05 : 1.0);
}
