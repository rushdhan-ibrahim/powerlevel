"use client";

/**
 * MASTHEAD — the codex's title page furniture, repeated at the top
 * of every folio. Three horizontal bands:
 *
 *   ╔═══════════════════════════════════════════════════════════╗
 *   ║  ⟁ POWERLEVEL                   FRI · XVII · MMXXVI       ║
 *   ║                                                           ║
 *   ║  ◯       ▦       ✦       ‖       ⟐    │      ✚            ║
 *   ║ home  history  plates  ledger  totals │    add            ║
 *   ╚═══════════════════════════════════════════════════════════╝
 *
 * The active bay carries a small filled wedge above its glyph. The
 * Add bay is set apart by a vertical hairline pilaster and is
 * always rubric — it's the action.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";
import { format } from "date-fns";
import { roman } from "@/lib/manuscript";
import {
  GlyphHome,
  GlyphHistory,
  GlyphPlates,
  GlyphLedger,
  GlyphTotals,
  GlyphAdd,
  GlyphCrest,
} from "./Glyphs";

type NavItem = {
  href: string;
  label: string;
  Glyph: React.ComponentType<{ size?: number; rubric?: boolean; className?: string }>;
  rubric?: boolean;
};

const NAV: NavItem[] = [
  { href: "/", label: "home", Glyph: GlyphHome },
  { href: "/workouts", label: "history", Glyph: GlyphHistory },
  { href: "/insights", label: "plates", Glyph: GlyphPlates },
  { href: "/ledger", label: "ledger", Glyph: GlyphLedger },
  { href: "/totals", label: "totals", Glyph: GlyphTotals },
];

const ACTION: NavItem = { href: "/upload", label: "add", Glyph: GlyphAdd, rubric: true };

export function Masthead() {
  const pathname = usePathname();
  // The login and auth-callback pages are pre-session — the profile link
  // and sign-out button inside the masthead wouldn't make sense there.
  if (pathname === "/login" || pathname.startsWith("/auth/")) return null;
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const today = new Date();
  const day = format(today, "EEE").toLowerCase(); // fri
  const dayN = roman(today.getDate()).toLowerCase(); // xvii
  const yearR = roman(today.getFullYear()).toLowerCase(); // mmxxvi

  return (
    <header className="masthead">
      {/* TOP BAND — wordmark + dated stamp */}
      <div className="masthead-top">
        <Link href="/" className="masthead-wordmark" aria-label="powerlevel — home">
          <GlyphCrest size={32} />
          <span className="brand-name">powerlevel</span>
          <span className="brand-tag">a folio for the training body</span>
        </Link>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 6,
          }}
        >
          <div className="masthead-date">
            <span className="date-day">{day}</span>
            <span className="date-sep">·</span>
            <span className="date-roman">{dayN}</span>
            <span className="date-sep">·</span>
            <span className="date-roman">{yearR}</span>
          </div>
          <Link
            href="/profile"
            className={pathname.startsWith("/profile") ? "masthead-profile is-active" : "masthead-profile"}
          >
            <svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true" style={{ display: "inline-block" }}>
              <circle cx="10" cy="7" r="3.2" fill="none" stroke="currentColor" strokeWidth=".9" />
              <path d="M3,18 C4,13.5 7,12 10,12 C13,12 16,13.5 17,18" fill="none" stroke="currentColor" strokeWidth=".9" />
            </svg>
            <span>profile</span>
          </Link>
          <span aria-hidden="true" style={{ color: "var(--ash-light)", opacity: 0.6 }}>·</span>
          <SignOutButton />
        </div>
      </div>

      {/* HAIRLINE RULES — double rule, manuscript style */}
      <div className="masthead-rule" />
      <div className="masthead-rule masthead-rule-soft" />

      {/* NAV ROW — bays with glyphs */}
      <nav className="masthead-nav">
        <div className="masthead-bays">
          {NAV.map((item) => (
            <NavBay
              key={item.href}
              item={item}
              active={isActive(item.href)}
            />
          ))}
        </div>
        <div className="masthead-pilaster" aria-hidden="true" />
        <div className="masthead-action">
          <NavBay item={ACTION} active={isActive(ACTION.href)} action />
        </div>
      </nav>
    </header>
  );
}

function NavBay({
  item,
  active,
  action,
}: {
  item: NavItem;
  active: boolean;
  action?: boolean;
}) {
  const { Glyph, label, href, rubric } = item;
  const useRubric = active || rubric;
  return (
    <Link href={href} className={`nav-bay ${active ? "is-active" : ""} ${action ? "is-action" : ""}`}>
      {active && <span className="nav-bay-pointer" aria-hidden="true">▾</span>}
      <span className="nav-bay-glyph">
        <Glyph size={26} rubric={useRubric} />
      </span>
      <span className="nav-bay-label">{label}</span>
    </Link>
  );
}
