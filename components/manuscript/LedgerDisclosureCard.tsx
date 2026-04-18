"use client";

/**
 * LEDGER DISCLOSURE CARD — on mobile the Ledger's wide tables become
 * a stack of compact cards. Each card shows the headline figure and
 * status at a glance; tapping the card reveals the supporting detail
 * (peak, 4-week average, target range, etc.) without reloading or
 * navigating away.
 *
 * Visual language matches the History tab's expandable day-card:
 * quiet hairline border at rest, clean rubric outline when open,
 * paper-warm surface throughout. Status colour lives in the primary
 * metric — no side-stripe accent on the frame.
 */

import { ReactNode, useState } from "react";

type Props = {
  label: ReactNode;
  primary: ReactNode;
  secondary?: ReactNode;
  /** Small badge (e.g. "ascending", "in mav") shown to the right of the
   *  primary line — should carry the status colour itself. */
  badge?: ReactNode;
  /** Defaults to `true` when secondary is present. */
  expandable?: boolean;
};

export function LedgerDisclosureCard({
  label,
  primary,
  secondary,
  badge,
  expandable,
}: Props) {
  const [open, setOpen] = useState(false);
  const canOpen = (expandable ?? secondary != null) && secondary != null;
  return (
    <div className={`ledger-card${open ? " is-open" : ""}`}>
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
          <span className="ledger-card-chev" aria-hidden="true">
            {open ? "▾" : "▸"}
          </span>
        )}
      </button>
      {canOpen && open && (
        <div className="ledger-card-body">{secondary}</div>
      )}
    </div>
  );
}
