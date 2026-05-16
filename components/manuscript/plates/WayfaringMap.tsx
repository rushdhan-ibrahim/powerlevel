"use client";

/**
 * THE WAYFARING MAP — a single composite map of every GPS line you've
 * walked, drawn in ink on paper. No Mapbox, no tiles, no satellite —
 * a medieval pilgrim's map made by overlaying every road.
 *
 * Lines accumulate naturally: a road walked once is faint; a road
 * walked many times darkens. The projection is a simple equirectangular
 * scaled to fit the dataset's bounding box. A small compass rose sits
 * in the corner; a hairline scale bar reports a kilometre.
 */

import type { RunPath } from "@/lib/pilgrimage/insights";

export function WayfaringMap({ paths }: { paths: RunPath[] }) {
  // Bounding box across all points
  let minLat = +90, maxLat = -90, minLon = +180, maxLon = -180;
  let count = 0;
  for (const p of paths) {
    for (const pt of p.points) {
      if (Number.isFinite(pt.lat) && Number.isFinite(pt.lon)) {
        if (pt.lat < minLat) minLat = pt.lat;
        if (pt.lat > maxLat) maxLat = pt.lat;
        if (pt.lon < minLon) minLon = pt.lon;
        if (pt.lon > maxLon) maxLon = pt.lon;
        count += 1;
      }
    }
  }

  if (count === 0) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center", color: "var(--ash)", fontStyle: "italic" }}>
        no GPS roads recorded yet — the map opens when the first GPS-bearing run lands.
      </div>
    );
  }

  const VB_W = 720;
  const VB_H = 440;
  const PAD = 28;
  const usableW = VB_W - PAD * 2;
  const usableH = VB_H - PAD * 2;

  // Equirectangular projection adjusted for latitude (cos correction on lon)
  const midLat = (minLat + maxLat) / 2;
  const lonScale = Math.cos((midLat * Math.PI) / 180);
  const spanLat = Math.max(0.0001, maxLat - minLat);
  const spanLon = Math.max(0.0001, (maxLon - minLon) * lonScale);
  const aspect  = spanLon / spanLat;
  const fit = Math.min(usableW / Math.max(spanLon, 0.0001), usableH / Math.max(spanLat, 0.0001));
  const drawW = spanLon * fit;
  const drawH = spanLat * fit;
  const x0 = (VB_W - drawW) / 2;
  const y0 = (VB_H - drawH) / 2;

  const project = (lat: number, lon: number) => {
    const px = x0 + ((lon - minLon) * lonScale) * fit;
    const py = y0 + (maxLat - lat) * fit; // invert latitude (north up)
    return { x: px, y: py };
  };

  // Build the path strings
  const pathStrings = paths
    .filter((p) => p.points.length >= 2)
    .map((p) => {
      const pts = p.points;
      let d = `M ${project(pts[0].lat, pts[0].lon).x.toFixed(2)} ${project(pts[0].lat, pts[0].lon).y.toFixed(2)}`;
      for (let i = 1; i < pts.length; i++) {
        const { x, y } = project(pts[i].lat, pts[i].lon);
        d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
      }
      return d;
    });

  // Compute a 1 km scale-bar length in svg units. 1 deg lat ≈ 111 km.
  const oneKmInLatDeg = 1 / 111;
  const scaleBarLen = oneKmInLatDeg * fit;

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height={VB_H} aria-hidden="false">
      {/* parchment frame */}
      <rect x={PAD - 8} y={PAD - 8} width={VB_W - 2 * (PAD - 8)} height={VB_H - 2 * (PAD - 8)}
        fill="none" stroke="var(--ink)" strokeWidth=".3" opacity=".22" />
      <rect x={PAD - 4} y={PAD - 4} width={VB_W - 2 * (PAD - 4)} height={VB_H - 2 * (PAD - 4)}
        fill="none" stroke="var(--ink)" strokeWidth=".2" opacity=".14" />

      {/* all the roads — drawn with low opacity so overlap darkens */}
      <g>
        {pathStrings.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="var(--ink)" strokeWidth=".7" opacity={0.18} strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </g>

      {/* freshest run highlighted in rubric */}
      {paths.length > 0 && (() => {
        const latest = [...paths].sort((a, b) => b.date.getTime() - a.date.getTime())[0];
        if (latest.points.length < 2) return null;
        let d = `M ${project(latest.points[0].lat, latest.points[0].lon).x.toFixed(2)} ${project(latest.points[0].lat, latest.points[0].lon).y.toFixed(2)}`;
        for (let i = 1; i < latest.points.length; i++) {
          const { x, y } = project(latest.points[i].lat, latest.points[i].lon);
          d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
        }
        return <path d={d} fill="none" stroke="var(--rubric)" strokeWidth="1.2" opacity=".85" strokeLinecap="round" strokeLinejoin="round" />;
      })()}

      {/* compass rose — bottom-right corner */}
      <g transform={`translate(${VB_W - PAD - 36}, ${PAD + 30})`}>
        <circle cx="0" cy="0" r="18" fill="none" stroke="var(--ink)" strokeWidth=".4" opacity=".5" />
        <circle cx="0" cy="0" r="10" fill="none" stroke="var(--ink)" strokeWidth=".3" opacity=".35" />
        {/* four-point compass */}
        {[0, 90, 180, 270].map((a) => {
          const rad = (a * Math.PI) / 180;
          const cardinal = a === 0;
          return (
            <line key={a}
              x1={Math.cos(rad - Math.PI / 2) * 4} y1={Math.sin(rad - Math.PI / 2) * 4}
              x2={Math.cos(rad - Math.PI / 2) * 18} y2={Math.sin(rad - Math.PI / 2) * 18}
              stroke={cardinal ? "var(--rubric)" : "var(--ink)"}
              strokeWidth=".55" opacity={cardinal ? 0.95 : 0.6}
            />
          );
        })}
        <text x="0" y={-22} fontFamily="var(--display)" fontVariant="small-caps" fontSize="7"
          letterSpacing=".18em" fill="var(--rubric)" textAnchor="middle" opacity=".95">n</text>
      </g>

      {/* scale bar — bottom-left */}
      <g transform={`translate(${PAD + 6}, ${VB_H - PAD - 12})`}>
        <line x1="0" y1="0" x2={scaleBarLen} y2="0" stroke="var(--ink)" strokeWidth=".8" opacity=".75" />
        <line x1="0" y1="-3" x2="0" y2="3" stroke="var(--ink)" strokeWidth=".5" opacity=".75" />
        <line x1={scaleBarLen} y1="-3" x2={scaleBarLen} y2="3" stroke="var(--ink)" strokeWidth=".5" opacity=".75" />
        <text x={scaleBarLen / 2} y={-6} fontFamily="var(--mono)" fontSize="8" fill="var(--ash)" textAnchor="middle" opacity=".85" letterSpacing=".04em">
          1 km
        </text>
      </g>

      {/* meta */}
      <text x={PAD + 6} y={PAD - 8} fontFamily="var(--italic)" fontStyle="italic" fontSize="9.5"
        fill="var(--ash)" opacity=".7">
        {`${paths.length} ${paths.length === 1 ? "road" : "roads"} walked · the freshest is rubric`}
      </text>
    </svg>
  );
}
