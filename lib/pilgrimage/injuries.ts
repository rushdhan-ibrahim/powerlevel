/**
 * Known injury history — hand-curated, the ground truth that grounds
 * the auto-detected breaks. Eventually these will live in the
 * `Injury` Prisma table (so they can be edited from a settings page);
 * for now they're a constant array shared by the chapters, the
 * Reliquary, and the Vitruvian runner.
 */

export interface KnownInjury {
  id: string;
  start: string;          // ISO date
  end: string | null;     // ISO date or null = ongoing/managing
  label: string;
  tissueIds: string[];
  status: "active" | "managing" | "resolved";
  color: string;
  summary: string;
}

export const KNOWN_INJURIES: KnownInjury[] = [
  {
    id: "itb_2025",
    start: "2025-11-18",
    end:   "2026-01-03",
    label: "Iliotibial band syndrome",
    tissueIds: ["iliotibial_band"],
    status: "resolved",
    color: "#fbbf24",
    summary: "ITB irritation through Nov-Dec 2025; ~7 weeks off running. Returned cleanly in Jan and has not recurred.",
  },
  {
    id: "post_tib_2026",
    start: "2026-04-04",
    end:   null,
    label: "Posterior tibialis tendinopathy / medial shin splints",
    tissueIds: ["posterior_tibialis", "shin_periosteum"],
    status: "managing",
    color: "#f59e0b",
    summary:
      "Onset early April after the 28:25 PB and the coach's ~67 km/wk plan. " +
      "Volume cut sharply rather than stopped — running has continued at least " +
      "once per week throughout. Currently asymptomatic for ~1 week.",
  },
];
