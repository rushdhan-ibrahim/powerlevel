"use client";

/**
 * LEDGER DISCLOSURE CARD — on mobile the Ledger's wide tables become
 * a stack of compact cards. Each card shows the headline figure and
 * status at a glance; tapping the card reveals the supporting detail
 * (peak, 4-week average, target range, etc.) without reloading or
 * navigating away.
 *
 * Visual vocabulary matches the existing plate aesthetic: paper
 * surface, hairline border, rubric accent on active/attention rows.
 * A small + / − affordance in the top-right cues the disclosure.
 */

import { ReactNode, useState } from "react";

type Props = {
  label: ReactNode;
  primary: ReactNode;
  secondary?: ReactNode;
  /** Small badge/chip to the right of the primary metric (e.g. "ascending"). */
  badge?: ReactNode;
  /** Optional accent colour on the left edge — used for status (rubric for
   *  attention, ash for declining, etc.). */
  tint?: string;
  /** Show the expand chevron. Defaults to true when secondary is present. */
  expandable?: boolean;
};

export function LedgerDisclosureCard({
  label,
  primary,
  secondary,
  badge,
  tint,
  expandable,
}: Props) {
  const [open, setOpen] = useState(false);
  const canOpen = (expandable ?? secondary != null) && secondary != null;
  return (
    <div
      className={`ledger-card${open ? " ledger-card-open" : ""}`}
      style={tint ? { boxShadow: `inset 3px 0 0 0 ${tint}` } : undefined}
    >
      <button
        type="button"
        className="ledger-card-head"
        onClick={canOpen ? () => setOpen((o) => !o) : undefined}
        aria-expanded={canOpen ? open : undefined}
        disabled={!canOpen}
      >
        <div className="ledger-card-head-text">
          <div className="ledger-card-label">{label}</div>
          <div className="ledger-card-primary">{primary}</div>
        </div>
        {badge && <div className="ledger-card-badge">{badge}</div>}
        {canOpen && (
          <span className="ledger-card-chevron" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path
                d={open ? "M2,5 L10,5" : "M2,6 L10,6 M6,2 L6,10"}
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
          </span>
        )}
      </button>
      {canOpen && open && (
        <div className="ledger-card-body">{secondary}</div>
      )}
    </div>
  );
}
