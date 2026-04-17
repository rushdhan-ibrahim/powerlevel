/**
 * CHAPTER OPENER — replaces a bare h2 §-heading with an illuminated
 * block: ornament glyph on the left, large rubric Roman, display-caps
 * title above an italic caption, hairline rule beneath. Different
 * glyph per section for visual rhythm.
 */

import {
  GlyphRose,
  GlyphCompass,
  GlyphHourglassOrnament,
  GlyphChapletOrnament,
  GlyphSeed,
} from "./Glyphs";

type GlyphKind = "rose" | "compass" | "hourglass" | "chaplet" | "seed";

const GLYPH_MAP: Record<GlyphKind, React.ComponentType<{ size?: number }>> = {
  rose: GlyphRose,
  compass: GlyphCompass,
  hourglass: GlyphHourglassOrnament,
  chaplet: GlyphChapletOrnament,
  seed: GlyphSeed,
};

export function ChapterOpener({
  n,
  title,
  caption,
  glyph = "rose",
}: {
  n: string | number;
  title: string;
  caption?: string;
  glyph?: GlyphKind;
}) {
  const Glyph = GLYPH_MAP[glyph];
  return (
    <div className="chapter-opener">
      <div className="chapter-opener-glyph">
        <Glyph size={44} />
      </div>
      <div className="chapter-opener-body">
        <div className="chapter-opener-row">
          <span className="chapter-opener-num">§{n}</span>
          <h2 className="chapter-opener-title">{title}</h2>
        </div>
        {caption && <div className="chapter-opener-caption">{caption}</div>}
        <div className="chapter-opener-rule" />
      </div>
    </div>
  );
}
