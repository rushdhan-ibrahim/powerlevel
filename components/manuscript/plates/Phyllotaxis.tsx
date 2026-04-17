"use client";

/**
 * THE SEED — phyllotaxis. Each session is a seed in the head of
 * the sunflower, placed by the golden angle (137.508°). The pattern
 * grows as the codex grows. The most recent seed glows rubric.
 */

import { mulberry32 } from "@/lib/manuscript";

export function Phyllotaxis({
  count,
  seed = 46,
  scale,
}: {
  count: number;
  seed?: number;
  scale?: number;
}) {
  const cx = 150;
  const cy = 110;
  const rng = mulberry32(seed);
  const ga = (137.508 * Math.PI) / 180;

  // Auto-scale so the head fills the plate at any session count.
  // Target max radius ≈ 92 (leaves a hair of margin in the 300×220 box).
  // For small counts we cap scale so seeds don't fly out; for big counts
  // we shrink so the spiral stays inside the frame.
  const TARGET_MAX_R = 92;
  const autoScale = count > 1
    ? Math.max(3, Math.min(14, TARGET_MAX_R / Math.sqrt(Math.max(count - 1, 4))))
    : 0;
  const s = scale ?? autoScale;

  if (count === 0) {
    return (
      <svg viewBox="0 0 300 220" width="100%" height="220" aria-hidden="true">
        <circle
          cx={cx}
          cy={cy}
          r={3}
          fill="var(--rubric)"
          opacity=".6"
          style={{ animation: "breathe 6s ease-in-out infinite", transformOrigin: `${cx}px ${cy}px` }}
        />
        <text x="150" y={cy + 30} fontFamily="var(--italic)" fontStyle="italic" fontSize="10" fill="var(--ash)" opacity=".55" textAnchor="middle">
          one seed, awaiting its second
        </text>
      </svg>
    );
  }

  const seeds = Array.from({ length: count }, (_, i) => {
    const r = s * Math.sqrt(i);
    const a = i * ga;
    return {
      x: cx + r * Math.cos(a),
      y: cy + r * Math.sin(a),
      i,
    };
  });

  // Seed dot scales with available space too, so a sparse seed isn't a
  // pinprick and a dense one isn't a blob.
  const baseR = Math.max(1.1, Math.min(2.4, s * 0.32));

  return (
    <svg viewBox="0 0 300 220" width="100%" height="220" aria-hidden="true">
      {seeds.map((sd) => {
        const ageNorm = sd.i / Math.max(count - 1, 1);
        const isLatest = sd.i === count - 1;
        const j = (rng() - 0.5) * 0.7;
        const r = isLatest ? baseR * 1.65 : baseR * (0.6 + ageNorm * 0.7);
        return (
          <circle
            key={sd.i}
            cx={sd.x + j}
            cy={sd.y + j}
            r={r}
            fill={isLatest ? "var(--rubric)" : "var(--ink)"}
            opacity={isLatest ? 0.95 : 0.18 + ageNorm * 0.55}
            style={
              isLatest
                ? { animation: "breathe 5s ease-in-out infinite", transformOrigin: `${sd.x}px ${sd.y}px` }
                : undefined
            }
          />
        );
      })}
      <text
        x="290"
        y="212"
        fontFamily="var(--mono)"
        fontSize="7"
        fill="var(--ash-light)"
        opacity=".62"
        textAnchor="end"
        letterSpacing=".05em"
      >
        φ · golden angle
      </text>
    </svg>
  );
}
