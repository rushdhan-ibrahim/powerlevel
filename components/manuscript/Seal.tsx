"use client";

/**
 * The powerlevel seal — a sixteen-pointed rubric star, slowly turning,
 * with an outer orbit of beads and a breathing inner core. The mark
 * appears at the colophon and on the opening folio.
 */
export function Seal({ size = 200 }: { size?: number }) {
  const pts = (cx: number, cy: number, n: number, ro: number, ri: number) => {
    const out: string[] = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (Math.PI * i) / n - Math.PI / 2;
      const r = i % 2 === 0 ? ro : ri;
      out.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
    }
    return out.join(" ");
  };

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden="true">
      <g style={{ animation: "spin 90s linear infinite", transformOrigin: "100px 100px" }}>
        <circle cx="100" cy="100" r="92" fill="none" stroke="var(--ink)" strokeWidth=".5" opacity=".3" />
        <circle
          cx="100"
          cy="100"
          r="86"
          fill="none"
          stroke="var(--ink)"
          strokeWidth=".15"
          opacity=".1"
          strokeDasharray="1.5,5"
        />
        {[
          [100, 6], [194, 100], [100, 194], [6, 100],
        ].map(([x, y], i) => {
          const dx = x < 100 ? 1 : x > 100 ? -1 : 0;
          const dy = y < 100 ? 1 : y > 100 ? -1 : 0;
          return (
            <polygon
              key={i}
              points={`${x},${y} ${x + dy * 1.5},${y + dx * 3.5 + dy * 3.5} ${x - dy * 1.5},${y - dx * 3.5 + dy * 3.5}`}
              fill="var(--rubric)"
              opacity=".35"
            />
          );
        })}
      </g>
      <g style={{ animation: "sealBreathe 10s ease-in-out infinite", transformOrigin: "100px 100px" }}>
        <polygon points={pts(100, 100, 16, 76, 44)} fill="none" stroke="var(--rubric)" strokeWidth=".5" opacity=".4" />
        <polygon points={pts(100, 100, 16, 56, 34)} fill="none" stroke="var(--rubric)" strokeWidth=".3" opacity=".22" />
        <polygon points={pts(100, 100, 8, 28, 16)} fill="none" stroke="var(--rubric)" strokeWidth=".25" opacity=".18" />
        <circle cx="100" cy="100" r="8" fill="var(--rubric)" opacity=".15" />
        <circle
          cx="100"
          cy="100"
          r="40"
          fill="none"
          stroke="var(--rubric)"
          strokeWidth=".18"
          opacity=".12"
          style={{ animation: "pulse 6s ease-in-out infinite" }}
        />
      </g>
      <g style={{ animation: "spinR 55s linear infinite", transformOrigin: "100px 100px" }}>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (Math.PI * 2 * i) / 8 - Math.PI / 2;
          return (
            <circle
              key={i}
              cx={(100 + 88 * Math.cos(a)).toFixed(2)}
              cy={(100 + 88 * Math.sin(a)).toFixed(2)}
              r={i % 2 === 0 ? 1.5 : 1}
              fill="var(--rubric)"
              opacity={i % 2 === 0 ? 0.25 : 0.15}
            />
          );
        })}
      </g>
    </svg>
  );
}

/** Small colophon seal — for the footer mark. */
export function ColophonSeal() {
  const star = (cx: number, cy: number, n: number, ro: number, ri: number) => {
    const out: string[] = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (Math.PI * i) / n - Math.PI / 2;
      const r = i % 2 === 0 ? ro : ri;
      out.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
    }
    return out.join(" ");
  };
  return (
    <svg viewBox="0 0 60 60" width="60" height="60" aria-hidden="true">
      <g style={{ animation: "spin 120s linear infinite", transformOrigin: "30px 30px", opacity: 0.3 }}>
        <circle cx="30" cy="30" r="26" fill="none" stroke="var(--ink)" strokeWidth=".4" />
      </g>
      <g
        style={{
          animation: "sealBreathe 12s ease-in-out infinite",
          transformOrigin: "30px 30px",
          opacity: 0.3,
        }}
      >
        <polygon points={star(30, 30, 8, 18, 10)} fill="none" stroke="var(--rubric)" strokeWidth=".4" />
        <circle cx="30" cy="30" r="4" fill="var(--rubric)" opacity=".3" />
      </g>
    </svg>
  );
}
