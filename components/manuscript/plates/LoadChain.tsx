"use client";

/**
 * LOAD CHAIN — a horizontal thermometer for the acute:chronic
 * workload ratio. Shaded zones mark undertrained / sweet spot /
 * caution / spike. A rubric pendant hangs at the current ratio.
 */

type Props = {
  ratio: number | null;
  status: "undertrained" | "sweet" | "caution" | "spike";
  acute: number;
  chronic: number;
};

export function LoadChain({ ratio, status, acute, chronic }: Props) {
  const VB_W = 420;
  const VB_H = 140;
  const PAD_X = 26;
  const usableW = VB_W - PAD_X * 2;
  const barY = 84;
  const barH = 14;

  const minR = 0;
  const maxR = 2.2;
  const toX = (r: number) =>
    PAD_X + ((Math.min(Math.max(r, minR), maxR) - minR) / (maxR - minR)) * usableW;

  const zones = [
    { start: 0, end: 0.8, label: "low", color: "var(--ash-light)" },
    { start: 0.8, end: 1.3, label: "sweet", color: "var(--rubric)" },
    { start: 1.3, end: 1.5, label: "caution", color: "var(--ash)" },
    { start: 1.5, end: 2.2, label: "spike", color: "var(--ink)" },
  ];

  const markerX = ratio != null ? toX(ratio) : null;

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="140" aria-hidden="true">
      {/* tickers at integer ratios */}
      {[0, 0.5, 1, 1.5, 2].map((t) => {
        const x = toX(t);
        return (
          <g key={t}>
            <line
              x1={x}
              y1={barY - 6}
              x2={x}
              y2={barY + barH + 6}
              stroke="var(--ink)"
              strokeWidth=".25"
              opacity=".25"
            />
            <text
              x={x}
              y={barY + barH + 20}
              fontFamily="var(--mono)"
              fontSize="8"
              fill="var(--ash-light)"
              textAnchor="middle"
              opacity=".8"
            >
              {t.toFixed(1)}
            </text>
          </g>
        );
      })}

      {/* zone backdrops */}
      {zones.map((z, i) => {
        const x = toX(z.start);
        const w = toX(z.end) - toX(z.start);
        const isActive =
          ratio != null &&
          (
            (z.label === "low" && status === "undertrained") ||
            (z.label === "sweet" && status === "sweet") ||
            (z.label === "caution" && status === "caution") ||
            (z.label === "spike" && status === "spike")
          );
        return (
          <g key={i}>
            <rect
              x={x}
              y={barY}
              width={w}
              height={barH}
              fill={z.color}
              fillOpacity={isActive ? 0.32 : 0.08}
              stroke={z.color}
              strokeWidth={isActive ? 0.55 : 0.25}
              strokeOpacity=".5"
            />
            <text
              x={x + w / 2}
              y={barY - 6}
              fontFamily="var(--italic)"
              fontStyle="italic"
              fontSize="8"
              fill={isActive ? "var(--rubric)" : "var(--ash)"}
              textAnchor="middle"
              opacity={isActive ? 1 : 0.75}
            >
              {z.label}
            </text>
          </g>
        );
      })}

      {/* the pendant marker */}
      {markerX != null && (
        <g>
          <line
            x1={markerX}
            y1={barY - 16}
            x2={markerX}
            y2={barY + barH + 2}
            stroke="var(--rubric)"
            strokeWidth=".8"
            opacity=".9"
          />
          <polygon
            points={`${markerX},${barY - 16} ${markerX + 3.5},${barY - 20} ${markerX - 3.5},${barY - 20}`}
            fill="var(--rubric)"
            opacity=".9"
          />
          <circle
            cx={markerX}
            cy={barY + barH + 14}
            r={4.5}
            fill="var(--rubric)"
            style={{ animation: "pulse 4s ease-in-out infinite" }}
          />
          <text
            x={markerX}
            y={barY - 26}
            fontFamily="var(--mono)"
            fontSize="11"
            fill="var(--rubric)"
            textAnchor="middle"
            letterSpacing="-.01em"
          >
            {ratio!.toFixed(2)}
          </text>
        </g>
      )}

      {/* numerals in margin — acute / chronic */}
      <text
        x={PAD_X}
        y={VB_H - 8}
        fontFamily="var(--italic)"
        fontStyle="italic"
        fontSize="8"
        fill="var(--ash)"
      >
        acute{" "}
        <tspan fontFamily="var(--mono)" fontStyle="normal" fill="var(--ink-light)">
          {acute.toLocaleString()}
        </tspan>{" "}
        kg · last 7 days
      </text>
      <text
        x={VB_W - PAD_X}
        y={VB_H - 8}
        fontFamily="var(--italic)"
        fontStyle="italic"
        fontSize="8"
        fill="var(--ash)"
        textAnchor="end"
      >
        chronic{" "}
        <tspan fontFamily="var(--mono)" fontStyle="normal" fill="var(--ink-light)">
          {chronic.toLocaleString()}
        </tspan>{" "}
        kg · avg of last 28
      </text>
    </svg>
  );
}
