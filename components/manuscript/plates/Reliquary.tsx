"use client";

/**
 * THE RELIQUARY — a medieval reliquary cabinet drawn in CSS + inline
 * SVG. Each niche holds one tissue's relic emblem; the niche's halo
 * glows in proportion to the tissue's chronic load (current % of
 * peak); active-injury tissues additionally pulse in rubric.
 *
 * Tapping a niche opens it — a bottom sheet on mobile, an aside
 * panel on desktop — with the full tissue snapshot, half-life note,
 * and the literature-informed rationale ("why this matters").
 *
 * Layout: a 4 × 5 grid (19 tissues + one legend cell). On mobile the
 * grid collapses to 2 columns × 10 rows; each niche is at least
 * 44 × 44 px tap area.
 *
 * No new colour tokens: ink, rubric, paper-warm, ash. The cabinet
 * wood is just `paper-warm` with hairline rule borders.
 */

import { useState } from "react";
import { TISSUE_MODEL } from "@/lib/pilgrimage/tissues";
import type { TissueSnapshot } from "@/lib/pilgrimage/derive";
import { RELIC_BY_TISSUE } from "./RelicEmblems";

type Props = {
  snapshots: Record<string, TissueSnapshot>;
  activeInjuryTissues?: string[];
};

const CATEGORY_ORDER = ["cardiovascular", "tendon", "bone", "muscle"] as const;

export function Reliquary({ snapshots, activeInjuryTissues = [] }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  // Order: cardiovascular → tendon → bone → muscle, preserving the
  // TISSUE_MODEL order within each category. Makes the cabinet read
  // top-down as a body system.
  const ordered = CATEGORY_ORDER.flatMap((cat) =>
    TISSUE_MODEL.filter((t) => t.category === cat),
  );

  const activeSet = new Set(activeInjuryTissues);
  const open = openId ? TISSUE_MODEL.find((t) => t.id === openId) : null;
  const openSnap = open ? snapshots[open.id] : null;

  return (
    <div className="reliquary-wrap">
      <div className="reliquary-cabinet" role="grid" aria-label="The Reliquary">
        {ordered.map((t) => {
          const snap = snapshots[t.id];
          const Relic = RELIC_BY_TISSUE[t.id];
          const isInjured = activeSet.has(t.id);
          const intensity = clamp((snap?.currentPctOfPeak ?? 0) / 100, 0, 1);
          const ratio = snap?.acuteChronicRatio;

          // halo opacity is rubric-tinted by chronic-load fullness;
          // injury overrides with a saturated rubric pulse.
          const haloAlpha = isInjured ? 0.42 : 0.06 + intensity * 0.34;

          // status read for the corner mark
          const ratioStatus = ratioBucket(ratio);

          return (
            <button
              key={t.id}
              type="button"
              role="gridcell"
              onClick={() => setOpenId(t.id)}
              className={`reliquary-niche cat-${t.category}${isInjured ? " is-injured" : ""}${openId === t.id ? " is-open" : ""}`}
              aria-label={`${t.label} — open detail`}
            >
              <span
                className="reliquary-niche-halo"
                style={{ background: isInjured
                  ? `radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--rubric) ${Math.round(haloAlpha * 100)}%, transparent), transparent 70%)`
                  : `radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--rubric) ${Math.round(haloAlpha * 100)}%, transparent), transparent 65%)`
                }}
                aria-hidden="true"
              />
              <span className="reliquary-niche-arch" aria-hidden="true" />
              <span className="reliquary-niche-relic">
                <Relic size={30} />
              </span>
              <span className="reliquary-niche-label">{shortLabel(t.label)}</span>
              {ratio != null && (
                <span
                  className={`reliquary-niche-tick reliquary-niche-tick-${ratioStatus}`}
                  aria-hidden="true"
                  title={`acute / chronic: ${ratio.toFixed(2)}`}
                />
              )}
            </button>
          );
        })}

        {/* Final cell: a small key / legend for how to read the cabinet. */}
        <div role="presentation" className="reliquary-legend">
          <div className="reliquary-legend-title">key</div>
          <ul className="reliquary-legend-list">
            <li><span className="reliquary-legend-dot dot-sweet" /> balanced</li>
            <li><span className="reliquary-legend-dot dot-warn"  /> ramping fast</li>
            <li><span className="reliquary-legend-dot dot-spike" /> overload</li>
            <li><span className="reliquary-legend-dot dot-quiet" /> detraining</li>
          </ul>
        </div>
      </div>

      {/* Sheet / panel detail */}
      {open && openSnap && (
        <NicheDetail
          label={open.label}
          category={open.category}
          halfLifeDays={open.halfLifeDays}
          why={open.why}
          snapshot={openSnap}
          isInjured={activeSet.has(open.id)}
          onClose={() => setOpenId(null)}
        />
      )}

      {/* Scoped CSS so the cabinet is self-contained — no global
          stylesheet pollution. */}
      <style>{`
        .reliquary-wrap { position: relative; }
        .reliquary-cabinet {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-auto-rows: 124px;
          gap: 6px;
          padding: 16px;
          background:
            linear-gradient(180deg,
              color-mix(in oklab, var(--paper-warm) 70%, var(--paper-mid)),
              color-mix(in oklab, var(--paper-warm) 90%, var(--paper-cool)));
          border: 1px solid var(--rule);
          border-radius: 1px;
          /* faint inner shadow to suggest a wooden cabinet's interior */
          box-shadow:
            inset 0 0 0 1px color-mix(in oklab, var(--ink) 4%, transparent),
            inset 0 12px 36px -18px color-mix(in oklab, var(--ink) 18%, transparent),
            inset 0 -12px 36px -18px color-mix(in oklab, var(--ink) 12%, transparent);
        }
        @media (max-width: 640px) {
          .reliquary-cabinet {
            grid-template-columns: repeat(2, 1fr);
            grid-auto-rows: 100px;
            padding: 10px;
            gap: 5px;
          }
        }

        .reliquary-niche {
          position: relative;
          background: color-mix(in oklab, var(--paper) 75%, var(--paper-mid));
          border: 1px solid color-mix(in oklab, var(--ink) 8%, transparent);
          border-radius: 1px;
          padding: 28px 6px 8px;
          cursor: pointer;
          font: inherit;
          color: inherit;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
          overflow: hidden;
          transition: transform .2s var(--ease), border-color .2s var(--ease);
        }
        .reliquary-niche:hover {
          border-color: color-mix(in oklab, var(--rubric) 60%, transparent);
          transform: translateY(-1px);
        }
        .reliquary-niche.is-open {
          border-color: var(--rubric);
        }

        /* arched top of the niche — a half-ellipse cut-out feel */
        .reliquary-niche-arch {
          position: absolute;
          top: -1px; left: -1px; right: -1px;
          height: 28px;
          background:
            radial-gradient(ellipse 60% 100% at 50% 100%,
              color-mix(in oklab, var(--paper-cool) 92%, var(--ink)) 0%,
              color-mix(in oklab, var(--paper-cool) 78%, var(--ink)) 70%,
              color-mix(in oklab, var(--paper-cool) 60%, var(--ink)) 100%);
          border-bottom: 1px solid color-mix(in oklab, var(--ink) 14%, transparent);
        }

        /* the halo behind the relic — its glow encodes load fullness */
        .reliquary-niche-halo {
          position: absolute;
          top: 30px; left: 6px; right: 6px;
          height: 50px;
          pointer-events: none;
          transition: opacity .3s var(--ease);
        }

        .reliquary-niche-relic {
          position: relative;
          line-height: 0;
          z-index: 1;
        }
        @media (max-width: 640px) {
          .reliquary-niche-relic svg { width: 26px; height: 26px; }
        }

        .reliquary-niche-label {
          font-family: var(--display);
          font-variant: small-caps;
          font-size: .58rem;
          letter-spacing: .14em;
          color: var(--ash);
          text-align: center;
          line-height: 1.2;
          padding: 0 2px;
        }
        @media (max-width: 640px) {
          .reliquary-niche-label { font-size: .56rem; letter-spacing: .12em; }
        }

        /* corner status tick — bottom-right of the niche */
        .reliquary-niche-tick {
          position: absolute;
          bottom: 6px; right: 6px;
          width: 5px; height: 5px;
          border-radius: 50%;
        }
        .reliquary-niche-tick-sweet  { background: color-mix(in oklab, var(--ink) 38%, transparent); }
        .reliquary-niche-tick-warn   { background: color-mix(in oklab, var(--rubric) 55%, transparent); }
        .reliquary-niche-tick-spike  { background: var(--rubric); box-shadow: 0 0 6px var(--rubric); }
        .reliquary-niche-tick-quiet  { background: color-mix(in oklab, var(--ash-light) 70%, transparent); }
        .reliquary-niche-tick-none   { background: color-mix(in oklab, var(--ash-light) 30%, transparent); }

        /* active-injury pulse */
        .reliquary-niche.is-injured {
          border-color: color-mix(in oklab, var(--rubric) 70%, transparent);
        }
        .reliquary-niche.is-injured::after {
          content: "";
          position: absolute;
          inset: -2px;
          border: 1px solid var(--rubric);
          border-radius: 1px;
          pointer-events: none;
          animation: relicPulse 2.8s ease-in-out infinite;
        }
        @keyframes relicPulse {
          0%, 100% { opacity: .18; }
          50%      { opacity: .85; }
        }

        /* legend cell */
        .reliquary-legend {
          background: color-mix(in oklab, var(--paper) 80%, var(--paper-mid));
          border: 1px dashed color-mix(in oklab, var(--ink) 16%, transparent);
          padding: 12px 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .reliquary-legend-title {
          font-family: var(--display);
          font-variant: small-caps;
          font-size: .58rem;
          letter-spacing: .18em;
          color: var(--rubric);
        }
        .reliquary-legend-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 3px;
          font: italic .68rem/1.35 var(--italic);
          color: var(--ash);
        }
        .reliquary-legend-dot {
          display: inline-block;
          width: 6px; height: 6px;
          border-radius: 50%;
          margin-right: 4px;
          vertical-align: middle;
        }
        .reliquary-legend-dot.dot-sweet { background: color-mix(in oklab, var(--ink) 38%, transparent); }
        .reliquary-legend-dot.dot-warn  { background: color-mix(in oklab, var(--rubric) 55%, transparent); }
        .reliquary-legend-dot.dot-spike { background: var(--rubric); }
        .reliquary-legend-dot.dot-quiet { background: color-mix(in oklab, var(--ash-light) 70%, transparent); }
      `}</style>
    </div>
  );
}

function ratioBucket(r: number | null | undefined): "sweet" | "warn" | "spike" | "quiet" | "none" {
  if (r == null) return "none";
  if (r > 1.5) return "spike";
  if (r > 1.3) return "warn";
  if (r < 0.6) return "quiet";
  return "sweet";
}

function clamp(x: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, x)); }

function shortLabel(label: string): string {
  // Trim long labels for the niche caption while keeping the original
  // for the open sheet.
  return label
    .replace(/Cortical bone \(tibia\)/, "Tibia")
    .replace(/Cardiac stroke volume/, "Stroke vol.")
    .replace(/Mitochondrial density/, "Mitochondria")
    .replace(/Capillary density/, "Capillaries")
    .replace(/Posterior tibialis/, "Post-tib")
    .replace(/Iliotibial band/, "IT band")
    .replace(/General fascia/, "Fascia")
    .replace(/Shin periosteum/, "Shin perios.")
    .replace(/Metatarsal bone/, "Metatarsals")
    .replace(/Gluteal complex/, "Glutes")
    .replace(/Hip flexors/, "Hip flexors")
    .replace(/Core \/ trunk/, "Core");
}

// ─── NICHE DETAIL — bottom sheet on mobile, side panel on desktop ──
function NicheDetail({
  label, category, halfLifeDays, why, snapshot, isInjured, onClose,
}: {
  label: string;
  category: string;
  halfLifeDays: number;
  why: string;
  snapshot: TissueSnapshot;
  isInjured: boolean;
  onClose: () => void;
}) {
  const ratio = snapshot.acuteChronicRatio;
  const status =
    isInjured ? "active injury"
    : ratio == null ? "no recent load"
    : ratio > 1.5 ? `overload risk (${ratio.toFixed(2)})`
    : ratio > 1.3 ? `ramping fast (${ratio.toFixed(2)})`
    : ratio < 0.6 ? `detraining (${ratio.toFixed(2)})`
    : `balanced (${ratio.toFixed(2)})`;

  return (
    <>
      <div className="reliquary-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="reliquary-sheet" role="dialog" aria-label={`${label} detail`}>
        <button type="button" onClick={onClose} className="reliquary-sheet-close" aria-label="close">×</button>
        <div className="reliquary-sheet-grabber" aria-hidden="true" />
        <header className="reliquary-sheet-head">
          <div className="reliquary-sheet-cat">{category} · τ½ {halfLifeDays}d</div>
          <h3 className="reliquary-sheet-title">{label}</h3>
          <div className={`reliquary-sheet-status${isInjured ? " is-injured" : ""}`}>{status}</div>
        </header>
        <div className="reliquary-sheet-stats">
          <Stat label="current / peak" value={`${snapshot.currentPctOfPeak.toFixed(0)}%`} />
          <Stat label="acute (7d)"    value={snapshot.acuteLoad.toFixed(2)} />
          <Stat label="chronic (28d)" value={snapshot.chronicLoad.toFixed(2)} />
        </div>
        <p className="reliquary-sheet-why">{why}</p>
        <style>{`
          .reliquary-backdrop {
            position: fixed; inset: 0;
            background: color-mix(in oklab, var(--ink) 28%, transparent);
            z-index: 40;
            animation: fadeIn .2s ease;
          }
          .reliquary-sheet {
            position: fixed; left: 0; right: 0; bottom: 0;
            background: var(--paper);
            border-top: 1px solid var(--rubric);
            box-shadow: 0 -16px 40px -16px color-mix(in oklab, var(--ink) 28%, transparent);
            padding: 18px 22px calc(22px + env(safe-area-inset-bottom));
            z-index: 41;
            max-height: 70vh;
            overflow: auto;
            animation: sheetUp .25s cubic-bezier(.2,.7,.2,1);
          }
          @media (min-width: 900px) {
            .reliquary-sheet {
              top: 80px; bottom: 80px; left: auto;
              right: max(40px, env(safe-area-inset-right));
              width: 380px;
              border: 1px solid var(--rubric);
              border-left: 3px solid var(--rubric);
              box-shadow: -20px 0 50px -20px color-mix(in oklab, var(--ink) 28%, transparent);
              animation: sheetSlide .25s cubic-bezier(.2,.7,.2,1);
            }
          }
          .reliquary-sheet-close {
            position: absolute; top: 10px; right: 14px;
            background: transparent; border: none;
            font-family: var(--display); font-size: 22px;
            color: var(--ash); cursor: pointer;
            padding: 4px 8px;
          }
          .reliquary-sheet-close:hover { color: var(--rubric); }
          .reliquary-sheet-grabber {
            width: 36px; height: 3px; background: var(--ash-light);
            border-radius: 2px; margin: 0 auto 14px;
          }
          @media (min-width: 900px) { .reliquary-sheet-grabber { display: none; } }
          .reliquary-sheet-head { margin-bottom: 14px; }
          .reliquary-sheet-cat {
            font-family: var(--display); font-variant: small-caps;
            font-size: .58rem; letter-spacing: .18em; color: var(--rubric);
          }
          .reliquary-sheet-title {
            margin: 4px 0 6px; font-family: var(--serif);
            font-size: 1.4rem; font-weight: 600; letter-spacing: -.01em;
            color: var(--ink);
          }
          .reliquary-sheet-status {
            font-family: var(--italic); font-style: italic;
            font-size: .82rem; color: var(--ash);
          }
          .reliquary-sheet-status.is-injured {
            color: var(--rubric); font-weight: 600;
          }
          .reliquary-sheet-stats {
            display: grid; grid-template-columns: repeat(3, 1fr);
            gap: 14px;
            padding: 12px 0;
            border-top: 1px solid var(--rule);
            border-bottom: 1px solid var(--rule);
          }
          .reliquary-sheet-why {
            margin: 14px 0 0;
            font-family: var(--italic); font-style: italic;
            color: var(--ash); font-size: .9rem; line-height: 1.6;
          }
          @keyframes sheetUp     { from { transform: translateY(100%); }      to { transform: none; } }
          @keyframes sheetSlide  { from { transform: translateX(40px); opacity: 0; } to { transform: none; opacity: 1; } }
          @keyframes fadeIn      { from { opacity: 0; } to { opacity: 1; } }
        `}</style>
      </aside>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{
        fontFamily: "var(--display)", fontVariant: "small-caps",
        fontSize: ".56rem", letterSpacing: ".14em",
        color: "var(--ash)",
      }}>{label}</div>
      <div style={{
        marginTop: 4,
        fontFamily: "var(--mono)", fontSize: "1.05rem",
        fontVariantNumeric: "tabular-nums oldstyle-nums",
        color: "var(--ink)",
      }}>{value}</div>
    </div>
  );
}
