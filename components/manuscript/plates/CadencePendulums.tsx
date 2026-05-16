"use client";

/**
 * CADENCE PENDULUMS — each pendulum is one recent run. The pendulum's
 * swing rate is proportional to that run's average cadence (faster
 * cadence = faster swing). They hang in a row like a metronome
 * orchestra; you read the rhythm at a glance.
 *
 * A small ruler at the bottom marks the canonical 180 spm reference
 * (Daniels / Lydiard). Pendulums above 180 swing faster than the
 * ruler tick; below 180 slower. Visual cue only — the exact value
 * appears in the marginalia below each pendulum.
 */

import type { CadenceSample } from "@/lib/pilgrimage/insights";

export function CadencePendulums({ samples }: { samples: CadenceSample[] }) {
  if (!samples.length) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: "var(--ash)", fontStyle: "italic" }}>
        no cadence-bearing runs yet — the choir falls quiet.
      </div>
    );
  }

  // Oldest left, newest right
  const ordered = [...samples].sort((a, b) => a.date.getTime() - b.date.getTime());
  const n = ordered.length;

  const VB_W = 720;
  const VB_H = 220;
  const PAD_X = 20;
  const PAD_TOP = 18;
  const PAD_BOTTOM = 40;
  const usableW = VB_W - PAD_X * 2;
  const usableH = VB_H - PAD_TOP - PAD_BOTTOM;
  const spacing = usableW / n;
  const stringLen = usableH - 16;

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height={VB_H} aria-hidden="true">
      {/* hanging rail */}
      <line x1={PAD_X} y1={PAD_TOP} x2={VB_W - PAD_X} y2={PAD_TOP} stroke="var(--ink)" strokeWidth=".55" opacity=".6" />

      {/* canonical 180 spm rule */}
      <line x1={PAD_X} y1={PAD_TOP + stringLen}
            x2={VB_W - PAD_X} y2={PAD_TOP + stringLen}
            stroke="var(--rubric)" strokeWidth=".5" opacity=".55" strokeDasharray="3,4" />
      <text x={VB_W - PAD_X - 4} y={PAD_TOP + stringLen + 11}
            fontFamily="var(--display)" fontVariant="small-caps" fontSize="7.5"
            letterSpacing=".18em" fill="var(--rubric)" textAnchor="end" opacity=".7">
        180 spm
      </text>

      {ordered.map((s, i) => {
        const x = PAD_X + i * spacing + spacing / 2;
        // Swing period — fast cadence → shorter period (sweeps left+right
        // = two ticks per second at 120 bpm equivalent). Map cadence to
        // a period in the 1.4s–3.6s range so the animation reads as a
        // pendulum, not a vibration. Cadence 160 = 3s, 180 = 2.5s, 200 = 2s.
        const cad = Math.max(120, Math.min(220, s.cadenceSpm));
        const period = Math.max(1.4, Math.min(3.6, 3.4 - (cad - 160) * 0.025));

        // Sway amplitude (degrees) — narrower amplitude as cadence rises
        const amp = 6 + (200 - cad) * 0.12;
        const isFresh = i === ordered.length - 1;

        return (
          <g
            key={`${s.runId}-${i}`}
            style={{
              transformOrigin: `${x}px ${PAD_TOP}px`,
              animation: `pendSwing ${period.toFixed(2)}s ease-in-out infinite`,
              ['--amp' as string]: `${amp.toFixed(1)}deg`,
              animationDelay: `${(i * 0.07).toFixed(2)}s`,
            }}
          >
            {/* string */}
            <line x1={x} y1={PAD_TOP} x2={x} y2={PAD_TOP + stringLen - 2}
                  stroke={isFresh ? "var(--rubric)" : "var(--ink)"}
                  strokeWidth={isFresh ? 0.7 : 0.45}
                  opacity={isFresh ? 0.85 : 0.55} />
            {/* bob */}
            <circle cx={x} cy={PAD_TOP + stringLen} r={isFresh ? 3.5 : 2.6}
                    fill={isFresh ? "var(--rubric)" : "var(--ink)"}
                    opacity={isFresh ? 0.95 : 0.72} />
          </g>
        );
      })}

      {/* marginalia — show the most-recent cadence at the right, and the
          all-window mean for context */}
      <text x={PAD_X} y={VB_H - 10} fontFamily="var(--italic)" fontStyle="italic"
        fontSize="10" fill="var(--ash)" opacity=".88">
        {`${ordered.length} ${ordered.length === 1 ? "run" : "runs"}`}
      </text>
      <text x={VB_W / 2} y={VB_H - 10} fontFamily="var(--italic)" fontStyle="italic"
        fontSize="10" fill="var(--ash)" textAnchor="middle" opacity=".75">
        mean {Math.round(mean(ordered.map(s => s.cadenceSpm)))} spm
      </text>
      <text x={VB_W - PAD_X} y={VB_H - 10} fontFamily="var(--mono)" fontSize="10"
        fill="var(--rubric)" textAnchor="end" opacity=".95" letterSpacing=".02em">
        {`latest ${Math.round(ordered[ordered.length - 1].cadenceSpm)} spm`}
      </text>

      <style>{`
        @keyframes pendSwing {
          0%   { transform: rotate(calc(-1 * var(--amp))); }
          50%  { transform: rotate(var(--amp)); }
          100% { transform: rotate(calc(-1 * var(--amp))); }
        }
      `}</style>
    </svg>
  );
}

function mean(xs: number[]): number {
  if (!xs.length) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
