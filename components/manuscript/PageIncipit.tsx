/**
 * PAGE INCIPIT — the opening rubric of a manuscript section, sized
 * to announce a folio without competing with the masthead. Used at
 * the top of every page just under the global header.
 *
 *      ╴ ╴ ◆ ╴ ╴
 *      THE CODEX
 *      Your Training
 *      ─────────────────
 *      4 workouts · 76 sets · 12,345 kg
 */

export function PageIncipit({
  eyebrow,
  title,
  meta,
}: {
  eyebrow: string;
  title: string;
  meta?: string;
}) {
  return (
    <div className="page-incipit">
      <div className="page-incipit-fleuron" aria-hidden="true">
        <span>·</span>
        <span>·</span>
        <span className="page-incipit-fleuron-mark">◆</span>
        <span>·</span>
        <span>·</span>
      </div>
      <div className="page-incipit-eyebrow">{eyebrow}</div>
      <h1 className="page-incipit-title">{title}</h1>
      {meta && <div className="page-incipit-meta">{meta}</div>}
      <div className="page-incipit-rule" />
    </div>
  );
}
