"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";

/**
 * Masthead. Small-caps labels, rubric ampersands between them.
 * The final link ("add") is styled rubric to draw the action forward.
 */
export function Nav() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "home" },
    { href: "/workouts", label: "history" },
    { href: "/insights", label: "plates" },
    { href: "/ledger", label: "ledger" },
    { href: "/totals", label: "totals" },
    { href: "/tools/plates", label: "plate calc" },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 32,
        paddingBottom: 14,
        borderBottom: "1px solid var(--rule-soft)",
      }}
    >
      <Link
        href="/"
        style={{
          fontFamily: "var(--display)",
          fontSize: ".95rem",
          fontVariant: "small-caps",
          letterSpacing: ".22em",
          color: "var(--ink)",
          textDecoration: "none",
        }}
      >
        powerlevel
      </Link>

      <div style={{ display: "flex", alignItems: "baseline", gap: 22 }}>
        {links.map((l, i) => (
          <span key={l.href} style={{ display: "inline-flex", alignItems: "baseline", gap: 22 }}>
            {i > 0 && <span className="amp" aria-hidden="true">&amp;</span>}
            <Link
              href={l.href}
              style={{
                fontFamily: "var(--display)",
                fontSize: ".64rem",
                fontVariant: "small-caps",
                letterSpacing: ".18em",
                color: isActive(l.href) ? "var(--ink)" : "var(--ash)",
                textDecoration: "none",
                paddingBottom: 4,
                borderBottom: isActive(l.href)
                  ? "1px solid var(--rubric)"
                  : "1px solid transparent",
                transition: "color .2s var(--ease)",
              }}
            >
              {l.label}
            </Link>
          </span>
        ))}
        <span className="amp" aria-hidden="true">&amp;</span>
        <Link
          href="/workouts/new"
          style={{
            fontFamily: "var(--display)",
            fontSize: ".64rem",
            fontVariant: "small-caps",
            letterSpacing: ".18em",
            color: pathname.startsWith("/workouts/new") ? "var(--rubric)" : "var(--ash)",
            textDecoration: "none",
            paddingBottom: 4,
            borderBottom: pathname.startsWith("/workouts/new")
              ? "1px solid var(--rubric)"
              : "1px solid transparent",
          }}
        >
          enter
        </Link>
        <Link
          href="/upload"
          style={{
            fontFamily: "var(--display)",
            fontSize: ".64rem",
            fontVariant: "small-caps",
            letterSpacing: ".18em",
            color: "var(--rubric)",
            textDecoration: "none",
            paddingBottom: 4,
            borderBottom: "1px solid var(--rubric)",
          }}
        >
          upload
        </Link>
        <span className="amp" aria-hidden="true" style={{ opacity: 0.4 }}>·</span>
        <SignOutButton />
      </div>
    </nav>
  );
}
