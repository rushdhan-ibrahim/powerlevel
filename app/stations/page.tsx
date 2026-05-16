/**
 * THE STATIONS — long-form chapter ledger for the running chronicle.
 *
 * Each Chapter row in Postgres becomes one folio: kicker eyebrow,
 * gradient title, lead pull-quote, body prose (with drop-cap Initial
 * on the first paragraph), interleaved live figures, and a closing
 * Principle callout. Chapters are ordered by `ordinal`.
 *
 * Chapters are written by:
 *   • the seed script (the original ten — `source = "seed"`)
 *   • the weekly Anthropic-API cron, ships PR 5
 *   • a conversational Claude Code session (`source = "claude-code"`)
 *   • manual edits via the future /stations/drafts review flow
 *
 * The figures inside each chapter resolve at render time, so the
 * data and the prose never drift apart.
 */
import { prisma } from "@/lib/db";
import { Initial } from "@/components/manuscript/Initial";
import { PageIncipit } from "@/components/manuscript/PageIncipit";
import { Principle } from "@/components/manuscript/Principle";
import { Ornament } from "@/components/manuscript/Ornament";
import { Headpiece } from "@/components/manuscript/Headpiece";
import { roman } from "@/lib/manuscript";
import { StationFigure, type FigureSpec } from "@/components/manuscript/stations/StationFigure";

export const revalidate = 60;

export default async function StationsPage() {
  const chapters = await prisma.chapter.findMany({
    where: { kind: "station", publishedAt: { not: null } },
    orderBy: { ordinal: "asc" },
  });

  if (chapters.length === 0) {
    return (
      <div>
        <PageIncipit eyebrow="The Stations" title="The Pilgrimage" meta="no chapters yet" />
        <p className="body-prose" style={{ textAlign: "center", color: "var(--ash)", fontStyle: "italic" }}>
          The chronicle begins when the first run is recorded.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageIncipit
        eyebrow="The Stations"
        title="The Pilgrimage"
        meta={`${chapters.length} ${chapters.length === 1 ? "chapter" : "chapters"} · running, since ${chapters[0].coveringPeriodStart?.toISOString().slice(0, 10) ?? "the first run"}`}
      />

      <p className="body-prose" style={{ marginBottom: 8 }}>
        <Initial letter="T" />
        his is the running half of the chronicle, read as a single document. Each chapter
        covers one phase of the year — the long opening base, the breakthrough block, the
        injuries and the returns. The figures are windows into the live data, not snapshots;
        when fresh runs land, the charts move beneath the prose. New chapters are appended
        automatically as the journey continues.
      </p>

      <TableOfContents chapters={chapters} />

      {chapters.map((c, i) => {
        const callout = c.calloutJson ? safeParse<{ title: string; body: string }>(c.calloutJson) : null;
        const figures = safeParse<FigureSpec[]>(c.figuresJson) ?? [];
        // Split bodyMd into paragraphs separated by blank lines.
        const paragraphs = c.bodyMd.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);

        return (
          <section key={c.id} id={c.anchor} style={{ marginTop: i === 0 ? 36 : 56 }}>
            {/* Per-chapter title block — small kicker, gradient title, rubric-bordered lead. */}
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontFamily: "var(--display)",
                  fontVariant: "small-caps",
                  fontSize: ".62rem",
                  letterSpacing: ".18em",
                  color: "var(--rubric)",
                  marginBottom: 6,
                }}
              >
                {c.kicker}
              </div>
              <h2
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: "1.85rem",
                  lineHeight: 1.18,
                  fontWeight: 600,
                  letterSpacing: "-.01em",
                  margin: "0 0 14px",
                  color: "var(--ink)",
                }}
              >
                {c.title}
              </h2>
              <blockquote
                style={{
                  fontFamily: "var(--italic)",
                  fontStyle: "italic",
                  fontSize: "1.05rem",
                  lineHeight: 1.55,
                  color: "var(--ink)",
                  borderLeft: "2px solid var(--rubric)",
                  padding: "2px 0 2px 16px",
                  margin: "0 0 20px",
                  maxWidth: "62ch",
                }}
              >
                {c.lead}
              </blockquote>
            </div>

            {/* Body prose. Drop-cap Initial on the first paragraph only. */}
            {paragraphs.map((para, pIdx) => (
              <p key={pIdx} className="body-prose">
                {pIdx === 0 && <Initial letter={para.charAt(0)} />}
                {pIdx === 0 ? para.slice(1) : para}
              </p>
            ))}

            {/* Inline figures. Each resolves to a Plate with the appropriate chart. */}
            {figures.map((fig, fIdx) => (
              <div key={fIdx} style={{ margin: "22px 0" }}>
                <StationFigure spec={fig} ordinal={`${roman(c.ordinal).toLowerCase()}.${fIdx + 1}`} />
              </div>
            ))}

            {/* Lesson callout. */}
            {callout && (
              <div style={{ marginTop: 22 }}>
                <Principle label={callout.title}>{callout.body}</Principle>
              </div>
            )}

            {/* Chapter divider — last chapter ends with a Headpiece flourish instead. */}
            {i < chapters.length - 1
              ? <div style={{ margin: "44px 0 0" }}><Ornament variant="diamond" /></div>
              : <div style={{ margin: "48px 0 0" }}><Headpiece /></div>}
          </section>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Sticky table of contents — pills in the existing display small-caps
//  vocabulary; current chapter is rubric.
// ─────────────────────────────────────────────────────────────────────
function TableOfContents({ chapters }: { chapters: { anchor: string; ordinal: number; title: string }[] }) {
  return (
    <nav
      aria-label="Stations"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px 8px",
        padding: "12px 0 14px",
        margin: "14px 0 4px",
        borderTop: "1px solid var(--rule-soft)",
        borderBottom: "1px solid var(--rule-soft)",
      }}
    >
      {chapters.map((c) => (
        <a
          key={c.anchor}
          href={`#${c.anchor}`}
          style={{
            display: "inline-flex",
            alignItems: "baseline",
            gap: 8,
            padding: "4px 10px",
            fontFamily: "var(--display)",
            fontVariant: "small-caps",
            fontSize: ".62rem",
            letterSpacing: ".18em",
            color: "var(--ash)",
            textDecoration: "none",
            border: "1px solid var(--rule)",
            transition: "color .2s var(--ease), border-color .2s var(--ease)",
          }}
        >
          <span style={{
            fontFamily: "var(--serif)",
            fontVariant: "normal",
            letterSpacing: 0,
            fontStyle: "italic",
            color: "var(--rubric)",
          }}>
            {roman(c.ordinal).toLowerCase()}
          </span>
          <span>{shortTitle(c.title)}</span>
        </a>
      ))}
    </nav>
  );
}

function shortTitle(t: string): string {
  // Trim to the part before the em-dash so pills stay one line on mobile.
  const dash = t.indexOf("—");
  return dash > 0 ? t.slice(0, dash).trim() : t;
}

function safeParse<T>(s: string | null | undefined): T | null {
  if (!s) return null;
  try { return JSON.parse(s) as T; } catch { return null; }
}
