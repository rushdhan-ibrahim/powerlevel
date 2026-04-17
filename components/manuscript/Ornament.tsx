/**
 * Inline text ornament between sections. Three glyph variants — rotate
 * through them for visual rhythm, never repeat back-to-back.
 */

const VARIANTS = {
  diamond: "◆ · ◇ · ◆",
  star:    "✦ · ◆ · ✦",
  hollow:  "◇ · ◆ · ◇",
  trinity: "✦ · ◇ · ✦",
  cross:   "◆ · ✦ · ◆",
} as const;

type Variant = keyof typeof VARIANTS;

export function Ornament({ variant = "diamond" }: { variant?: Variant }) {
  return <div className="ornament" aria-hidden="true">{VARIANTS[variant]}</div>;
}
