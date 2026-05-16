"use client";

/**
 * THE ANATOMICAL HEART — a medieval anatomical illumination of the
 * human heart, drawn in inline SVG. Four chambers (LA / LV / RA / RV)
 * faintly visible; the whole figure pulses slowly at the user's
 * recent average heart rate (visual cue only — not a clinical
 * reading). Four small satellite arcs around it report the model
 * snapshots for plasma / stroke volume / mitochondria / capillaries.
 *
 * Pure SVG, monochromatic ink + rubric. Pulse rate driven by CSS
 * animation duration computed from `recentAvgHr` (60 / bpm seconds).
 */

import type { HeartSummary } from "@/lib/pilgrimage/insights";

export function AnatomicalHeart({ heart }: { heart: HeartSummary }) {
  const bpm = heart.recentAvgHr ?? 60;
  const period = 60 / Math.max(40, Math.min(180, bpm));   // seconds per beat
  const animation = `heartbeat ${period.toFixed(2)}s ease-in-out infinite`;

  const arcs = [
    { label: "plasma volume",  pct: heart.plasmaSnapshot.currentPctOfPeak,        a0: -170, a1: -100 },
    { label: "stroke volume",  pct: heart.strokeVolumeSnapshot.currentPctOfPeak,  a0:  -80, a1:  -10 },
    { label: "mitochondria",   pct: heart.mitochondrialSnapshot.currentPctOfPeak, a0:   10, a1:   80 },
    { label: "capillaries",    pct: heart.capillarySnapshot.currentPctOfPeak,     a0:  100, a1:  170 },
  ];

  const cx = 160, cy = 175;
  const ringR = 122;

  return (
    <svg viewBox="0 0 320 320" width="100%" height="320" aria-hidden="true">
      {/* Outermost faint orbit — a Vitruvian-style frame */}
      <circle cx={cx} cy={cy} r={142} fill="none" stroke="var(--ink)" strokeWidth=".22" opacity=".25" />
      <circle cx={cx} cy={cy} r={ringR} fill="none" stroke="var(--ink)" strokeWidth=".22" opacity=".18" strokeDasharray="2,5" />

      {/* The satellite arcs reporting the four cardiovascular adaptations */}
      {arcs.map((arc) => (
        <SatelliteArc
          key={arc.label}
          cx={cx} cy={cy} r={ringR}
          a0={arc.a0} a1={arc.a1}
          label={arc.label}
          pct={arc.pct}
        />
      ))}

      {/* The heart silhouette — illuminated cardiac drawing */}
      <g
        style={{
          animation,
          transformOrigin: `${cx}px ${cy}px`,
        }}
      >
        {/* faint glowing aura */}
        <circle cx={cx} cy={cy} r={60} fill="var(--rubric)" opacity=".06" />

        {/* Right ventricle outline (drawer's left, anatomical right) */}
        <path
          d={`M ${cx - 36} ${cy - 30}
              Q ${cx - 56} ${cy - 38}, ${cx - 62} ${cy - 8}
              Q ${cx - 64} ${cy + 18}, ${cx - 48} ${cy + 40}
              L ${cx - 16} ${cy + 60}
              Q ${cx - 4} ${cy + 64}, ${cx + 4} ${cy + 56}
              L ${cx + 22} ${cy + 36}
              Q ${cx + 14} ${cy + 14}, ${cx + 10} ${cy}
              Q ${cx} ${cy - 20}, ${cx - 14} ${cy - 28}
              Q ${cx - 28} ${cy - 34}, ${cx - 36} ${cy - 30}
              Z`}
          fill="color-mix(in oklab, var(--rubric) 14%, transparent)"
          stroke="var(--rubric)"
          strokeWidth=".9"
          opacity=".85"
        />

        {/* Left ventricle / apex on the right side */}
        <path
          d={`M ${cx + 22} ${cy + 36}
              L ${cx + 36} ${cy + 56}
              Q ${cx + 56} ${cy + 50}, ${cx + 56} ${cy + 26}
              Q ${cx + 56} ${cy - 8}, ${cx + 40} ${cy - 30}
              Q ${cx + 24} ${cy - 50}, ${cx + 4} ${cy - 50}
              Q ${cx - 6} ${cy - 48}, ${cx - 14} ${cy - 28}
              Z`}
          fill="color-mix(in oklab, var(--rubric) 28%, transparent)"
          stroke="var(--rubric)"
          strokeWidth=".95"
          opacity=".95"
        />

        {/* Great vessels — aorta + pulmonary trunk */}
        <path d={`M ${cx + 8} ${cy - 50} Q ${cx + 30} ${cy - 90}, ${cx} ${cy - 110}`} fill="none" stroke="var(--rubric)" strokeWidth=".9" opacity=".7" />
        <path d={`M ${cx + 8} ${cy - 50} Q ${cx + 38} ${cy - 70}, ${cx + 56} ${cy - 80}`} fill="none" stroke="var(--rubric)" strokeWidth=".75" opacity=".55" />
        <path d={`M ${cx - 12} ${cy - 30} Q ${cx - 30} ${cy - 70}, ${cx - 18} ${cy - 88}`} fill="none" stroke="var(--rubric)" strokeWidth=".75" opacity=".5" />

        {/* Faint chamber lines (atria/ventricle septum hint) */}
        <line x1={cx + 4} y1={cy - 40} x2={cx + 8} y2={cy + 32} stroke="var(--paper)" strokeWidth=".7" opacity=".7" />
        <line x1={cx - 30} y1={cy + 0} x2={cx + 30} y2={cy - 8} stroke="var(--paper)" strokeWidth=".55" opacity=".5" />

        {/* Coronary tracery — gold-thread style hatch */}
        <path d={`M ${cx - 12} ${cy + 6} Q ${cx + 12} ${cy + 22}, ${cx + 28} ${cy + 14}`} fill="none" stroke="var(--paper)" strokeWidth=".45" opacity=".6" />
        <path d={`M ${cx - 30} ${cy + 18} Q ${cx + 0} ${cy + 36}, ${cx + 24} ${cy + 32}`} fill="none" stroke="var(--paper)" strokeWidth=".35" opacity=".4" />
      </g>

      {/* Central HR readout — italic small-caps */}
      <text
        x={cx} y={cy + 95}
        fontFamily="var(--italic)" fontStyle="italic"
        fontSize="11" fill="var(--ash)"
        textAnchor="middle" opacity=".8"
      >
        {heart.recentAvgHr ? `recent avg ${heart.recentAvgHr.toFixed(0)} bpm` : "no recent heart-rate readings"}
      </text>
      {heart.recentMaxHr && (
        <text
          x={cx} y={cy + 109}
          fontFamily="var(--mono)" fontSize="9.5"
          fill="var(--rubric)" textAnchor="middle"
          letterSpacing=".04em" opacity=".9"
        >
          peak {heart.recentMaxHr.toFixed(0)}{heart.lifetimeMaxHr && heart.lifetimeMaxHr > heart.recentMaxHr ? `  ·  lifetime ${heart.lifetimeMaxHr.toFixed(0)}` : ""}
        </text>
      )}

      <style>{`
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          18% { transform: scale(1.045); }
          30% { transform: scale(1); }
          48% { transform: scale(1.02); }
          60% { transform: scale(1); }
        }
      `}</style>
    </svg>
  );
}

// ─── Satellite arc — labelled adaptation reading ───────────────────
function SatelliteArc({
  cx, cy, r, a0, a1, label, pct,
}: { cx: number; cy: number; r: number; a0: number; a1: number; label: string; pct: number }) {
  const start = polar(cx, cy, r, a0);
  const end   = polar(cx, cy, r, a1);
  const filledEnd = polar(cx, cy, r, a0 + ((a1 - a0) * Math.min(100, Math.max(0, pct))) / 100);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const trackPath = `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
  const filledPath = `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${filledEnd.x} ${filledEnd.y}`;

  // Label position — midpoint of the arc, pushed outward
  const mid = polar(cx, cy, r + 20, (a0 + a1) / 2);
  const isRight = mid.x > cx + 4;
  const isLeft  = mid.x < cx - 4;

  return (
    <g>
      {/* track */}
      <path d={trackPath} fill="none" stroke="var(--ink)" strokeWidth=".7" opacity=".22" />
      {/* filled */}
      <path d={filledPath} fill="none" stroke="var(--rubric)" strokeWidth="1.5" opacity=".85" strokeLinecap="round" />
      {/* end-cap dot */}
      <circle cx={filledEnd.x} cy={filledEnd.y} r="2.2" fill="var(--rubric)" opacity=".95" />
      {/* label */}
      <text
        x={mid.x} y={mid.y - 2}
        fontFamily="var(--italic)" fontStyle="italic"
        fontSize="9.5" fill="var(--ash)"
        textAnchor={isRight ? "start" : isLeft ? "end" : "middle"}
        opacity=".9"
      >
        {label}
      </text>
      <text
        x={mid.x} y={mid.y + 9}
        fontFamily="var(--mono)" fontSize="9"
        fill="var(--rubric)"
        textAnchor={isRight ? "start" : isLeft ? "end" : "middle"}
        letterSpacing=".02em" opacity=".9"
      >
        {Math.round(pct)}% of peak
      </text>
    </g>
  );
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
