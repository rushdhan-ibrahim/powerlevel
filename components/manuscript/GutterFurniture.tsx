"use client";

/**
 * GUTTER FURNITURE — fixed-position decorative content in the dark
 * "scholar's desk" outside the folio. Persists as page furniture
 * across scroll, hides under 1400px viewport.
 *
 * Left gutter:    spinning astrolabe (top)
 *                 vertical running head: POWERLEVEL · [page]
 *                 marginal aphorism (bottom)
 *
 * Right gutter:   breathing seal (top)
 *                 vertical year/folio
 *                 folio number (bottom)
 *
 * Two horizontal rules at top and bottom — the desk's edges.
 */

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { polar, pointRing, roman } from "@/lib/manuscript";

const ROUTE_LABEL: Record<string, string> = {
  "/": "home",
  "/workouts": "history",
  "/insights": "plates",
  "/ledger": "ledger",
  "/totals": "totals",
  "/upload": "compose",
  "/profile": "profile",
};

const ROUTE_FOLIO: Record<string, string> = {
  "/": "i",
  "/workouts": "ii",
  "/insights": "iii",
  "/ledger": "iv",
  "/totals": "v",
  "/upload": "vi",
  "/profile": "vii",
};

const APHORISMS = [
  "the body keeps the score",
  "what gets measured gets managed",
  "patience scales the wall",
  "the work is the prayer",
  "iron sharpens iron",
  "consistency is the engine",
  "movement is medicine",
];

export function GutterFurniture() {
  const pathname = usePathname();
  const route = pathname.startsWith("/workouts/")
    ? "/workouts"
    : pathname.startsWith("/exercises/")
      ? "/insights"
      : pathname;

  const pageLabel = ROUTE_LABEL[route] ?? "folio";
  const folioMark = ROUTE_FOLIO[route] ?? "—";

  // Pick aphorism based on date so it changes daily but is stable per-render
  const today = new Date();
  const aphorism =
    APHORISMS[(today.getDate() + today.getMonth() * 31) % APHORISMS.length];

  // Live "hour hand" on the astrolabe — updates every minute
  const [now, setNow] = useState<Date>(() => today);
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="gutter-furniture" aria-hidden="true">
      {/* desk top/bottom edges */}
      <div className="gutter-edge gutter-edge-top" />
      <div className="gutter-edge gutter-edge-bottom" />

      {/* LEFT GUTTER */}
      <aside className="gutter gutter-left">
        <div className="gutter-section gutter-top">
          <Astrolabe size={64} hour={now.getHours()} minute={now.getMinutes()} />
          <div className="gutter-meta">
            <div className="gutter-meta-line">{format(now, "HH:mm")}</div>
            <div className="gutter-meta-line gutter-meta-faint">
              {format(now, "EEEE")}
            </div>
          </div>
        </div>

        <div className="gutter-section gutter-mid">
          <div className="gutter-running-head">
            <span className="rh-brand">powerlevel</span>
            <span className="rh-sep">·</span>
            <span className="rh-page">{pageLabel}</span>
          </div>
        </div>

        <div className="gutter-section gutter-bottom">
          <div className="gutter-aphorism">{aphorism}</div>
          <div className="gutter-rule" />
          <div className="gutter-stamp">
            <span>fol.</span>
            <span className="rubric">{folioMark}</span>
          </div>
        </div>
      </aside>

      {/* RIGHT GUTTER */}
      <aside className="gutter gutter-right">
        <div className="gutter-section gutter-top">
          <MiniSeal size={56} />
          <div className="gutter-meta">
            <div className="gutter-meta-line">{roman(now.getFullYear()).toLowerCase()}</div>
            <div className="gutter-meta-line gutter-meta-faint">anno mensae</div>
          </div>
        </div>

        <div className="gutter-section gutter-mid">
          <div className="gutter-running-head gutter-running-head-right">
            <span className="rh-page">{pageLabel}</span>
            <span className="rh-sep">·</span>
            <span className="rh-brand">{format(now, "MMMM").toLowerCase()}</span>
          </div>
        </div>

        <div className="gutter-section gutter-bottom">
          <PendulumBead />
          <div className="gutter-rule" />
          <div className="gutter-stamp">
            <span className="rubric">{format(now, "d")}</span>
            <span>·</span>
            <span>{format(now, "MMM").toLowerCase()}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ─── small gutter ornaments ─────────────────────────────────── */

function Astrolabe({ size = 64, hour, minute }: { size?: number; hour: number; minute: number }) {
  // Position the rete (rotating star ring) by current minute,
  // and the alidade (slim hand) by current hour.
  const handAngle = ((hour % 12) / 12) * 360 + (minute / 60) * 30 - 90;
  const reteAngle = (minute / 60) * 360;
  return (
    <svg viewBox="0 0 80 80" width={size} height={size}>
      {/* outer ring */}
      <circle cx="40" cy="40" r="36" fill="none" stroke="var(--ash)" strokeWidth=".5" opacity=".55" />
      <circle cx="40" cy="40" r="32" fill="none" stroke="var(--ash)" strokeWidth=".25" opacity=".35" strokeDasharray="2,4" />

      {/* hour ticks */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const [x1, y1] = polar(40, 40, 36, a);
        const [x2, y2] = polar(40, 40, i % 3 === 0 ? 30 : 33, a);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--ash)"
            strokeWidth={i % 3 === 0 ? 0.45 : 0.22}
            opacity=".55"
          />
        );
      })}

      {/* rete (slowly rotating inner ring of stars) */}
      <g style={{ transformOrigin: "40px 40px", transform: `rotate(${reteAngle}deg)`, transition: "transform 60s linear" }}>
        <polygon
          points={pointRing(40, 40, 24, 10, 8)}
          fill="none"
          stroke="var(--rubric)"
          strokeWidth=".35"
          opacity=".55"
        />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          const [x, y] = polar(40, 40, 24, a);
          return <circle key={i} cx={x} cy={y} r="1.2" fill="var(--rubric)" opacity=".65" />;
        })}
      </g>

      {/* alidade (hand pointing to current hour) */}
      <g style={{ transformOrigin: "40px 40px", transform: `rotate(${handAngle + 90}deg)` }}>
        <line x1="40" y1="40" x2="40" y2="10" stroke="var(--rubric)" strokeWidth=".7" opacity=".95" />
        <polygon points="40,8 41.5,12 38.5,12" fill="var(--rubric)" opacity=".95" />
      </g>

      <circle cx="40" cy="40" r="2" fill="var(--rubric)" opacity=".95" />
    </svg>
  );
}

function MiniSeal({ size = 56 }: { size?: number }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size}>
      <g style={{ animation: "spin 180s linear infinite", transformOrigin: "40px 40px" }}>
        <circle cx="40" cy="40" r="36" fill="none" stroke="var(--ash)" strokeWidth=".4" opacity=".5" />
        <circle cx="40" cy="40" r="32" fill="none" stroke="var(--ash)" strokeWidth=".18" opacity=".3" strokeDasharray="1.5,3" />
      </g>
      <g style={{ animation: "sealBreathe 9s ease-in-out infinite", transformOrigin: "40px 40px" }}>
        <polygon points={pointRing(40, 40, 26, 12, 12)} fill="none" stroke="var(--rubric)" strokeWidth=".5" opacity=".75" />
        <polygon points={pointRing(40, 40, 18, 8, 12)} fill="none" stroke="var(--rubric)" strokeWidth=".3" opacity=".5" />
        <polygon points={pointRing(40, 40, 8, 3.4, 8)} fill="var(--rubric)" opacity=".85" />
      </g>
    </svg>
  );
}

function PendulumBead() {
  return (
    <svg viewBox="0 0 80 80" width={64} height={64}>
      <line x1="40" y1="6" x2="40" y2="6" stroke="var(--ash)" strokeWidth=".4" opacity=".7" />
      <g
        style={{
          transformOrigin: "40px 6px",
          animation: "pendulum 7s ease-in-out infinite",
          ["--a" as string]: "-12deg",
          ["--b" as string]: "12deg",
        }}
      >
        <line x1="40" y1="6" x2="40" y2="56" stroke="var(--ash)" strokeWidth=".4" opacity=".55" />
        <circle cx="40" cy="60" r="6" fill="none" stroke="var(--rubric)" strokeWidth=".5" opacity=".75" />
        <circle cx="40" cy="60" r="2.4" fill="var(--rubric)" opacity=".85" />
      </g>
    </svg>
  );
}
