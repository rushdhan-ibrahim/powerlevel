/**
 * Shared geometry & PRNG helpers for the computational manuscript.
 * Every plate uses these so jitter, polar math, and path sampling
 * stay consistent across the 36-plate vocabulary.
 */

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function jitter(rng: () => number, value: number, amount: number): number {
  return value + (rng() - 0.5) * amount;
}

export function polar(cx: number, cy: number, r: number, angle: number): [number, number] {
  // Round to 3 decimals so server- and client-rendered SVG attribute strings
  // stringify identically; otherwise React reports a hydration mismatch on
  // every plate that puts polar coordinates straight into JSX.
  return [
    Math.round((cx + Math.cos(angle) * r) * 1000) / 1000,
    Math.round((cy + Math.sin(angle) * r) * 1000) / 1000,
  ];
}

export function pointRing(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  count: number,
  rotation: number = -Math.PI / 2,
): string {
  let pts = "";
  for (let i = 0; i < count * 2; i++) {
    const angle = rotation + (Math.PI * i) / count;
    const r = i % 2 === 0 ? outer : inner;
    const [x, y] = polar(cx, cy, r, angle);
    pts += `${x.toFixed(2)},${y.toFixed(2)} `;
  }
  return pts.trim();
}

export function sampledPath(
  sample: (t: number) => [number, number],
  steps: number = 160,
  closed: boolean = false,
): string {
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const [x, y] = sample(t);
    d += `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  }
  if (closed) d += "Z";
  return d;
}

export function arcPath(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const [x1, y1] = polar(cx, cy, radius, startAngle);
  const [x2, y2] = polar(cx, cy, radius, endAngle);
  const large = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
  const sweep = endAngle > startAngle ? 1 : 0;
  return `M${x1.toFixed(2)},${y1.toFixed(2)} A${radius},${radius} 0 ${large} ${sweep} ${x2.toFixed(2)},${y2.toFixed(2)}`;
}

export function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

/** Roman numeral for plate numbering. Used to render plate-n labels. */
export function roman(n: number): string {
  const map: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let result = "";
  let value = n;
  for (const [v, s] of map) {
    while (value >= v) {
      result += s;
      value -= v;
    }
  }
  return result;
}

/** Convert a year integer to its rubricated Roman date stamp. */
export function romanYear(year: number): string {
  return roman(year);
}

/** Normalize values to a [0..1] range, with fallback when all values equal. */
export function normalize(values: number[]): number[] {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  if (max === min) return values.map(() => 0.5);
  return values.map((v) => (v - min) / (max - min));
}

/** Linear interpolation. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
