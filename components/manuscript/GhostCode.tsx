/**
 * The code that builds the codex, rendered at ghost opacity behind the paper.
 * Real powerlevel code — the parsing prompt, the Epley formula, the schemas —
 * not lorem. The page is the religion. The code is the scripture.
 */

const SCRIPT = `// powerlevel — the codex computes
// ────────────────────────────────────────────

// epley — the e1RM oracle
function epley(weight, reps) {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

// mulberry32 — deterministic jitter for the plates
function mulberry32(seed) {
  let a = seed >>> 0;
  return function() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// the gemini parse — read the scribe's hand
const SYSTEM = "You are an expert at reading handwritten gym logs.";
//   3x5 @ 225  →  three sets of five at two-twenty-five
//   BW         →  bodyweight
//   RPE 8      →  rate of perceived exertion 8 of 10
//   F          →  taken to failure
//   WU / w     →  warmup
//   BP         →  bench press
//   RDL        →  romanian deadlift

// the orrery — e1RM as orbital field
g('animation: spin 90s linear infinite');
for (const session of history) {
  const r = base + session.e1RM * 0.2;
  el('circle', { cx: c, cy: c, r: jitter(r, 1.4) });
  if (session.isPR) el('rubric-mark', session.angle);
}

// muscle balance as rose window
const petals = ['chest', 'back', 'shoulders', 'biceps',
                'triceps', 'quads', 'hamstrings', 'glutes'];

// consistency as memory field — vertical strings of beads
for (const week of last14weeks) {
  const string = el('line', { x1: x, y1: top, x2: x, y2: bottom });
  for (const day of week) {
    if (day.session) bead(x, dayY, day.tonnage);
  }
}

// the chaplet — top lifts as a rosary
const beads = topExercises.map(ex => ({
  angle: i / n * TAU,
  size: ex.sessions > 12 ? large : small,
  filled: ex.bestE1RM > 0,
}));

// stagnation — no PR in 4+ weeks, 2+ sessions since
const stagnant = lifts.filter(l =>
  l.daysSincePR >= 28 && l.sessionsSincePR >= 2
);

// the manuscript computes. nothing is still.
`;

export function GhostCode() {
  const doubled = SCRIPT + "\n" + SCRIPT;
  return (
    <div className="folio-ghost" aria-hidden="true">
      <div className="folio-ghost-inner">{doubled}</div>
    </div>
  );
}
