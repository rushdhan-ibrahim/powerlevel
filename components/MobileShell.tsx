"use client";

/**
 * MOBILE SHELL
 *
 * Everything that wraps the page content on phones — title bar at
 * the top, tab bar + floating rubric FAB at the bottom, plus the
 * two bottom sheets (add + more). Rendered in the root layout and
 * hidden on screens ≥ 768px by CSS (.mobile-only).
 *
 * The tab bar has five slots in a grid:
 *   home · history · [ FAB ] · insights · more
 * The FAB is centred, rises above the bar, and opens a small sheet
 * offering "photograph the page" or "enter by hand". "More" opens
 * a sheet with the secondary destinations — ledger, totals, profile,
 * plate calc, theme toggle, sign-out — so we don't crowd the bar.
 */

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { roman } from "@/lib/manuscript";
import {
  GlyphHome,
  GlyphHistory,
  GlyphPlates,
  GlyphLedger,
  GlyphTotals,
  GlyphCrest,
} from "./manuscript/Glyphs";
import { ThemeToggle } from "./ThemeToggle";
import { SignOutButton } from "./SignOutButton";

export function MobileShell() {
  const pathname = usePathname();
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  // Close any open sheet when the route changes (tap on a sheet item
  // navigates — we want the sheet to dismiss automatically).
  useEffect(() => {
    setAddOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  // The login and auth-callback pages are pre-session. No chrome.
  if (pathname === "/login" || pathname.startsWith("/auth/")) return null;

  const today = new Date();
  const day = format(today, "EEE").toLowerCase();
  const dayN = roman(today.getDate()).toLowerCase();
  const yearR = roman(today.getFullYear()).toLowerCase();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const tabs: Array<{ href: string; label: string; Glyph: React.ComponentType<{ size?: number; rubric?: boolean }> }> = [
    { href: "/", label: "home", Glyph: GlyphHome },
    { href: "/workouts", label: "history", Glyph: GlyphHistory },
  ];
  const tabsRight: Array<{ href: string; label: string; Glyph: React.ComponentType<{ size?: number; rubric?: boolean }> }> = [
    { href: "/insights", label: "plates", Glyph: GlyphPlates },
  ];

  return (
    <>
      <header className="mobile-titlebar mobile-only">
        <Link href="/" className="mobile-titlebar-brand" aria-label="powerlevel — home">
          <span className="mobile-titlebar-crest"><GlyphCrest size={18} /></span>
          <span>powerlevel</span>
        </Link>
        <div className="mobile-titlebar-date">
          <span>{day}</span>
          <span className="date-sep">·</span>
          <span>{dayN}</span>
          <span className="date-sep">·</span>
          <span>{yearR}</span>
        </div>
      </header>

      <nav className="mobile-tabbar mobile-only" aria-label="primary">
        {tabs.map(({ href, label, Glyph }) => (
          <Link
            key={href}
            href={href}
            className={`mobile-tab ${isActive(href) ? "is-active" : ""}`}
          >
            <span className="mobile-tab-glyph"><Glyph size={22} rubric={isActive(href)} /></span>
            <span>{label}</span>
            <span className="mobile-tab-dot" />
          </Link>
        ))}

        <div className="mobile-fab-slot">
          <button
            type="button"
            aria-label="add a workout"
            className="mobile-fab"
            onClick={() => setAddOpen(true)}
          >
            <span className="mobile-fab-inner">
              <svg className="mobile-fab-cross" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 3 L10 17 M3 10 L17 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
          </button>
        </div>

        {tabsRight.map(({ href, label, Glyph }) => (
          <Link
            key={href}
            href={href}
            className={`mobile-tab ${isActive(href) ? "is-active" : ""}`}
          >
            <span className="mobile-tab-glyph"><Glyph size={22} rubric={isActive(href)} /></span>
            <span>{label}</span>
            <span className="mobile-tab-dot" />
          </Link>
        ))}

        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={`mobile-tab ${moreOpen || isActive("/ledger") || isActive("/totals") || isActive("/profile") || isActive("/tools") ? "is-active" : ""}`}
          aria-label="more"
        >
          <span className="mobile-tab-glyph"><MoreGlyph size={22} /></span>
          <span>more</span>
          <span className="mobile-tab-dot" />
        </button>
      </nav>

      {addOpen && (
        <Sheet title="Add a workout" subtitle="photograph the page, or enter it by hand" onClose={() => setAddOpen(false)}>
          <div className="mobile-add-grid">
            <button
              type="button"
              className="mobile-add-card"
              onClick={() => {
                setAddOpen(false);
                router.push("/upload");
              }}
            >
              <CameraGlyph className="mobile-add-card-glyph" />
              <span className="mobile-add-card-title">Photograph</span>
              <span className="mobile-add-card-sub">Snap or pick a page; Gemini will read it.</span>
            </button>
            <button
              type="button"
              className="mobile-add-card"
              onClick={() => {
                setAddOpen(false);
                router.push("/workouts/new");
              }}
            >
              <QuillGlyph className="mobile-add-card-glyph" />
              <span className="mobile-add-card-title">Enter by hand</span>
              <span className="mobile-add-card-sub">Type the session directly into the ledger.</span>
            </button>
          </div>
        </Sheet>
      )}

      {moreOpen && (
        <Sheet title="More" onClose={() => setMoreOpen(false)}>
          <SheetLink href="/ledger" label="Ledger" sub="coach's view — volume, intensity, load" Glyph={GlyphLedger} />
          <SheetLink href="/totals" label="Totals" sub="custom rep counter" Glyph={GlyphTotals} />
          <SheetLink href="/profile" label="Profile" sub="height · bodyweight · goal" Glyph={ProfileGlyph} />
          <SheetLink href="/tools/plates" label="Plate calculator" sub="load the bar" Glyph={PlatesGlyph} />
          <div style={{ borderTop: "1px solid var(--rule-soft)", margin: "10px 0 4px" }} />
          <div className="mobile-sheet-row" style={{ cursor: "default" }}>
            <span className="mobile-sheet-row-glyph"><CandleGlyph /></span>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span>Candlelight mode</span>
              <span style={{ fontFamily: "var(--italic)", fontStyle: "italic", fontSize: ".78rem", color: "var(--ash)" }}>
                read the manuscript by evening lamp
              </span>
            </div>
            <span style={{ marginLeft: "auto" }}><ThemeToggle compact /></span>
          </div>
          <div className="mobile-sheet-row" style={{ cursor: "default" }}>
            <span className="mobile-sheet-row-glyph"><SignOutGlyph /></span>
            <div><SignOutButton /></div>
          </div>
        </Sheet>
      )}
    </>
  );
}

/* ─── sheet chrome ────────────────────────────────────────── */

function Sheet({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // lock body scroll while the sheet is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  return (
    <>
      <div className="mobile-sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className="mobile-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mobile-sheet-handle" />
        <div className="mobile-sheet-title">{title}</div>
        {subtitle && <div className="mobile-sheet-sub">{subtitle}</div>}
        {children}
      </div>
    </>
  );
}

function SheetLink({
  href,
  label,
  sub,
  Glyph,
}: {
  href: string;
  label: string;
  sub: string;
  Glyph: React.ComponentType<{ size?: number }>;
}) {
  return (
    <Link href={href} className="mobile-sheet-row">
      <span className="mobile-sheet-row-glyph"><Glyph size={22} /></span>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span>{label}</span>
        <span style={{ fontFamily: "var(--italic)", fontStyle: "italic", fontSize: ".78rem", color: "var(--ash)" }}>
          {sub}
        </span>
      </div>
      <span className="mobile-sheet-row-chev">›</span>
    </Link>
  );
}

/* ─── small inline glyphs ─────────────────────────────────── */

function MoreGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true">
      <circle cx="5" cy="11" r="1.3" fill="currentColor" />
      <circle cx="11" cy="11" r="1.3" fill="currentColor" />
      <circle cx="17" cy="11" r="1.3" fill="currentColor" />
    </svg>
  );
}
function CameraGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" aria-hidden="true">
      <rect x="4" y="9" width="28" height="20" rx="3" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <rect x="12" y="5" width="12" height="5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="18" cy="19" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="18" cy="19" r="2" fill="currentColor" />
    </svg>
  );
}
function QuillGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" aria-hidden="true">
      <path
        d="M8 28 L24 12 Q28 8 30 6 Q28 12 26 16 Q20 22 12 26 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <line x1="8" y1="28" x2="14" y2="22" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="10" y1="30" x2="16" y2="30" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function ProfileGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true">
      <circle cx="11" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1" />
      <path
        d="M4 19 C5 14.5 8 13 11 13 C14 13 17 14.5 18 19"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}
function PlatesGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true">
      <line x1="2" y1="11" x2="20" y2="11" stroke="currentColor" strokeWidth="1.1" />
      <rect x="5" y="7" width="3" height="8" fill="currentColor" opacity=".9" />
      <rect x="14" y="7" width="3" height="8" fill="currentColor" opacity=".9" />
      <rect x="9" y="9" width="4" height="4" fill="none" stroke="currentColor" strokeWidth=".9" />
    </svg>
  );
}
function CandleGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true">
      <path d="M11 3 C9 6 9 8 11 10 C13 8 13 6 11 3 Z" fill="currentColor" opacity=".9" />
      <rect x="8" y="11" width="6" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1" />
      <line x1="7" y1="18" x2="15" y2="18" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
function SignOutGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true">
      <path d="M9 4 H5 Q3 4 3 6 V16 Q3 18 5 18 H9" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <line x1="8" y1="11" x2="19" y2="11" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <polyline points="15,7 19,11 15,15" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
