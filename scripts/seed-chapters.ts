/**
 * Seed the ten initial Stations chapters into the Chapter table.
 * Idempotent on `anchor` — existing rows are NEVER overwritten so
 * subsequent edits in the database are safe.
 *
 *   pnpm tsx scripts/seed-chapters.ts
 *
 * After PR 5 lands, the Anthropic-API weekly cron will append new
 * chapters with source = "claude-weekly". Manual edits made via the
 * /stations/drafts review flow stay in the same table.
 */
import "dotenv/config";
import { prisma } from "../lib/db";

interface FigureSpec {
  kind:
    | "calendar" | "weekly_range" | "tissue"
    | "acwr_range" | "pace_at_hr"
    | "bests_range" | "volume_jump" | "readiness";
  from?: string;
  to?: string;
  tissue_id?: string;
  caption: string;
}

interface SeedChapter {
  anchor: string;
  ordinal: number;
  kicker: string;
  title: string;
  lead: string;
  body: string[];
  figures: FigureSpec[];
  callout: { title: string; body: string };
  coveringPeriodStart?: string;
  coveringPeriodEnd?: string;
}

const CHAPTERS: SeedChapter[] = [
  {
    anchor: "ch-opening",
    ordinal: 1,
    kicker: "Chapter I · The opening",
    title: "August 2025 — a tentative start",
    lead: "Seven runs, 36 km, four different routes through Malé and Hulhumalé. Average heart rate sits around 165 bpm at a 7-minute easy pace — the unmistakable signature of a runner getting their lungs back rather than testing their legs.",
    body: [
      "The data tells a simple story for August. You ran roughly every fourth day, totalled 5.4 hours, and never pushed any single run past 8 km. The average pace of 9:00/km on most outings is conversational; HR around 165 bpm at that pace tells us your starting aerobic fitness was modest — not deconditioned, but well shy of where you would end up.",
      "Calendar coverage matters more than any single workout here. The cells below show August: a handful of training days, scattered, with rest days punctuating each session. There is no rush, no progression curve to chase. It is exactly how a comeback block (or a first block) should look.",
    ],
    figures: [
      { kind: "calendar", from: "2025-08-01", to: "2025-08-31", caption: "Daily km, August 2025. Sparse and deliberate." },
    ],
    callout: {
      title: "Why slow is fast at the start",
      body: "Plasma volume responds within days, mitochondrial density within weeks, capillary density within a month. Stacking easy aerobic minutes is the most efficient way to build all three at once; it is also the lowest-injury-risk stimulus. The cost of going too easy at the start is zero. The cost of going too hard is six weeks off.",
    },
    coveringPeriodStart: "2025-08-01",
    coveringPeriodEnd: "2025-08-31",
  },
  {
    anchor: "ch-first-block",
    ordinal: 2,
    kicker: "Chapter II · The first build",
    title: "September → October 2025 — the rate of fitness",
    lead: "Six weeks. Monthly volume goes from 36 km to 40 km to 94 km. Run count climbs from seven to nineteen. The body responds the way physiology says it should — but the same data that records the build also records the first cracks.",
    body: [
      "October 2025 is your first proper training block: 19 runs, 94 km. Roughly one quality session per week sits inside a sea of easy aerobic km. Weekly volume rises with intent, peaking at ~38 km — your highest of the year so far.",
      "Two pictures live in the same chart. The first is fitness: the weekly bars climb steadily, and average HR at a given pace ticks down — your aerobic engine is genuinely improving. The second is the rate of climb. Sports medicine has a label for that — the acute-to-chronic workload ratio (ACWR). Anything above 1.5 puts you in the elevated-injury-risk window. You touched it more than once in late October.",
    ],
    figures: [
      { kind: "weekly_range", from: "2025-08-01", to: "2025-11-15", caption: "Weekly km, August → mid-November. The ramp into the first peak in late October." },
      { kind: "acwr_range",   from: "2025-09-01", to: "2025-11-30", caption: "ACWR over the same window. The green band is the safe sweet spot (0.8–1.3); the red band is elevated risk (>1.5)." },
    ],
    callout: {
      title: "The ACWR rule of thumb",
      body: "Acute load is the last 7 days; chronic is the prior 28-day weekly average. The ratio between them tells you how much faster your stress is climbing than your baseline. Below 0.8 you are detraining. Between 0.8 and 1.3 you are safely loading. Above 1.5 the published epidemiology shows injury rates rising sharply. The number that matters is not absolute volume — it is how fast volume changes.",
    },
    coveringPeriodStart: "2025-09-01",
    coveringPeriodEnd: "2025-10-31",
  },
  {
    anchor: "ch-itb",
    ordinal: 3,
    kicker: "Chapter III · The first warning shot",
    title: "November 2025 — iliotibial band syndrome",
    lead: "On 18 November, the running stops. Seven weeks off. The cause is the iliotibial band — a tough sheet of fascia running down the outside of the thigh that loves to remind you when you've added volume faster than your hip stabilisers can handle.",
    body: [
      "ITB syndrome rarely arrives without warning. The classic signature is lateral knee or thigh discomfort that worsens with mileage and stops you mid-run. In your data it announces itself as a hard edge in the calendar: ten days of running, then nothing.",
      "On a tissue chart, ITB's reading dropped through October's window and rebuilt slowly through Jan-Feb. The half-life of the IT band stimulus in our model is 35 days, which matches the literature on tendon-style connective tissue: collagen turnover takes weeks, not days. The recovery you took was appropriate; pushing through would not have shortened it.",
    ],
    figures: [
      { kind: "tissue", tissue_id: "iliotibial_band", caption: "Modelled IT band stimulus over the whole season. Note the dip through Nov-Dec and the slow rebuild from January onwards. The red band is the active injury window." },
    ],
    callout: {
      title: "Why tendons are slow",
      body: "Muscle adapts in days–weeks. Tendons and fascia adapt 3–5× slower because collagen synthesis takes ~72 hours per cycle and remodelling depends on tension cycles, not metabolic stimulus. The mismatch — cardio fitness outrunning structural readiness — is the single most common pathway to running injury.",
    },
    coveringPeriodStart: "2025-11-01",
    coveringPeriodEnd: "2025-11-30",
  },
  {
    anchor: "ch-detrain",
    ordinal: 4,
    kicker: "Chapter IV · The forced detraining",
    title: "December 2025 — what 23 days off actually costs",
    lead: "Two short runs in early December, then a 23-day gap through the holidays. The numbers behind detraining are sometimes surprising — and they are different for different tissues.",
    body: [
      "Plasma volume drops measurably in the first week. Cardiac stroke-volume gains regress over ~2 weeks. Mitochondrial enzyme content half-decays in ~3 weeks. Capillary density takes longer. Bone barely changes in a month. The chart below shows your modelled cardiac stroke-volume signal across the layoff: a steep loss in the first fortnight, almost flat thereafter.",
      "The good news is the rebuild order matches the loss order. Plasma comes back in days. Stroke volume catches up in weeks. The reason your January return felt 'hard but recoverable' is that you were rebuilding fast-adapting systems first.",
    ],
    figures: [
      { kind: "tissue", tissue_id: "stroke_volume", caption: "Stroke-volume signal across the Nov–Dec layoff. Steep loss in the first fortnight, slow rebuild from January." },
    ],
    callout: {
      title: "Detraining is not symmetric",
      body: "You lose endurance fastest in the systems you can rebuild fastest. The slow-adapting ones — tendons, bones, capillary density — also decay slowly, which is why a couple of weeks off rarely undoes structural adaptation. Use that asymmetry: the first 14 days of any return should be aerobic minutes, not structural load.",
    },
    coveringPeriodStart: "2025-12-01",
    coveringPeriodEnd: "2025-12-31",
  },
  {
    anchor: "ch-return-itb",
    ordinal: 5,
    kicker: "Chapter V · The disciplined return",
    title: "January 2026 — coming back the right way",
    lead: "Twelve runs in January, 57 km. Average HR climbs back to around 168 bpm at the same easy paces of August — temporarily — because the engine is being rebuilt rather than retested.",
    body: [
      "The January block reads like a textbook return. Weekly volume builds gradually; no week jumps more than ~50 % from the prior. ACWR stays in the safe band. There are no time trials, no long efforts above 8 km. The IT band stays quiet.",
      "This is what the 10 %-per-week rule is trying to encode: small, consistent week-on-week increases let collagen and capillaries keep up with cardio. It is not glamorous, and it is the reason February will feel earned rather than lucky.",
    ],
    figures: [
      { kind: "weekly_range", from: "2025-12-01", to: "2026-02-15", caption: "The detraining gap (Dec) and the return ramp (Jan). Steady, modest week-over-week climbs." },
    ],
    callout: {
      title: "The 10 % rule (and why coaches break it)",
      body: "The convention is to add no more than 10 % weekly volume on average. Aggressive coaches push 20–25 % in short blocks for specific adaptations. Above 25 % per week sustained, published cohort data shows soft-tissue injury rates roughly double. Hold this number in your head; it appears again in Chapter VII.",
    },
    coveringPeriodStart: "2026-01-01",
    coveringPeriodEnd: "2026-01-31",
  },
  {
    anchor: "ch-breakthrough",
    ordinal: 6,
    kicker: "Chapter VI · The breakthrough",
    title: "February → March 2026 — three time trials and a PB",
    lead: "On 13 February you run a 32:16 5K at 6:27/km, HR maxing at 200. Two weeks later, a 4 km tempo at 6:00/km — same average HR (181), much lower max (189). On 27 March, you destroy the 5K with a 28:25, kicking the last 210 m at 4:13/km pace.",
    body: [
      "Three data points define a trajectory. The Feb tempo at the same effort as the Feb time trial but 27 seconds per km faster is the give-away: aerobic capacity has stepped up. The March 5K is then a near-perfect race execution — negative split, every km faster than the last, the final kick is faster than your previously-fastest sustained pace.",
      "The chart below picks out only PRs at 1 / 3 / 5 / 10 km distances over the whole season. The PB cluster in February-March is unmistakable. The body that ran 9:00/km easy in August is, eight months later, running 5:18/km on the last km of a 5K.",
    ],
    figures: [
      { kind: "bests_range", from: "2025-08-01", to: "2026-04-15", caption: "Best-effort PR progression for 1/3/5/10 km. Each dot is a new PR set." },
      { kind: "pace_at_hr",  from: "2026-01-01", to: "2026-04-15", caption: "Pace on activities clustered at HR ≈ 165 ±8 bpm. Aerobic fitness reading at fixed effort." },
    ],
    callout: {
      title: "Why the negative split is the discipline most runners lack",
      body: "Almost every PB happens when you finish faster than you started. The mechanism: you preserve glycogen and lactate clearance for the second half, then redirect saved capacity into a kick. Your March race did this by the book — and the 4:13/km final 210 m is the cleanest signal in your dataset that there is more in the tank.",
    },
    coveringPeriodStart: "2026-02-01",
    coveringPeriodEnd: "2026-03-31",
  },
  {
    anchor: "ch-spike",
    ordinal: 7,
    kicker: "Chapter VII · The volume spike",
    title: "Late March → early April 2026 — the math of injury",
    lead: "After the 28:25 PB, the coach prescribes a roughly 67 km week, against your prior peak of ~35 km. That is a ~90 % single-week increase in volume — on a body still carrying the cellular debris of a max-effort 5K.",
    body: [
      "Chapter V set out the 10 %-per-week guideline; Chapter VII is what happens when you violate it. A 90 % jump is well above any conservative ceiling and substantially above even the aggressive 25 %/wk number. There is nothing magic about the threshold; the literature simply observes that injury rates rise sharply above ~25 %/wk sustained.",
      "The visual below shows the three numbers side by side: your prior peak (35 km/wk), the coach's prescription (67 km/wk), and what your body actually attempted in the days after the PB. The gap between baseline and prescription is the gap your soft tissues did not have time to close.",
    ],
    figures: [
      { kind: "volume_jump", caption: "Baseline vs prescribed vs actual peak weeks. The gap is the injury exposure." },
    ],
    callout: {
      title: "Cardio outruns structure",
      body: "Your cardiovascular system was ready for 67 km/wk after the PB — that's what the breakthrough block demonstrated. Your tendons, fascia and bone were not, because they remodel at a fraction of the rate. The injury you sustained was not bad luck or technique; it was the predictable consequence of asking structural tissue to absorb cardiovascular ambition.",
    },
    coveringPeriodStart: "2026-03-15",
    coveringPeriodEnd: "2026-04-15",
  },
  {
    anchor: "ch-post-tib",
    ordinal: 8,
    kicker: "Chapter VIII · The second injury",
    title: "April 2026 — posterior tibialis tendinopathy",
    lead: "In early April the pain settles behind the medial malleolus and along the lower medial shin. This is the posterior tibialis tendon — the primary stabiliser of the medial arch — and it heals slowly for a specific anatomical reason.",
    body: [
      "The post-tib tendon takes 5–6× bodyweight per stride during running. Worse, it has a 'watershed zone' of low blood supply right at the back of the medial malleolus, exactly where peak stress concentrates. Low blood supply means slow collagen turnover, which means slow healing. ITB recovered in seven weeks; post-tib problems can drag much longer when poorly managed.",
      "Crucially, the response to this injury was not a hard stop. Volume was cut sharply — peak weeks in the 30s of km dropped to weeks of 1–6 km — but running continued throughout April and into May, at least once per week. That is the right answer for tendinopathy: tendons want load to remodel, just below the symptomatic threshold. They do not want zero, and they do not want the load that hurt them.",
      "On the tissue chart below, the post-tib signal climbs through the March block, spikes around the PB, and then falls as the volume comes down. The red band marks the active period; the signal is now well off its peak.",
    ],
    figures: [
      { kind: "tissue", tissue_id: "posterior_tibialis", caption: "Posterior tibialis modelled stimulus. The red band marks the active period; the signal is now well off its peak." },
    ],
    callout: {
      title: "Why this injury is harder",
      body: "The post-tib's watershed zone is the anatomic equivalent of a road that gets damaged faster than the maintenance crew can patch it. Eccentric calf raises, resisted inversion, and single-leg balance work strengthen the tendon under controlled load. The single biggest determinant of outcome is what you do during the symptomatic block — not stopping, but managing.",
    },
    coveringPeriodStart: "2026-04-01",
    coveringPeriodEnd: "2026-04-30",
  },
  {
    anchor: "ch-comeback",
    ordinal: 9,
    kicker: "Chapter IX · The managed return",
    title: "May 2026 — symptom-free, ramping back",
    lead: "There was no clean 'first day back' to anchor a comeback chart against. Running never stopped — volume just lived in a narrow band through April. The more useful question is: where are the symptoms now, and how is the volume responding to that?",
    body: [
      "As of 16 May, you have been symptom-free for roughly a week. Yesterday's long run — in cool, heavy rain — produced only the usual day-after soreness, nothing localised to the medial shin. That matters more than any single chart on this page: the tissue is tolerating the recent load.",
      "Weekly volume in May has stepped up from the April floor (1–14 km/wk) to ~26 km in the last seven days. Against your historical ~35 km/wk peak, this is moderate. Against the suppressed April baseline, the rate of change is large — which is why a strict reading of ACWR shows risk. The right read is more nuanced: the recent ramp is not the injurious-spike pattern from late March; it is a return toward a familiar baseline, on a tendon that is now asymptomatic.",
    ],
    figures: [
      { kind: "readiness", caption: "Recent weekly km against +10 %/wk safe-rebuild and +25 %/wk aggressive ceiling lines. Treat these as boundaries, not targets — your tendon's symptom response is the real ceiling." },
    ],
    callout: {
      title: "Symptoms outrank charts",
      body: "Workload models like ACWR are summary statistics, not diagnoses. When a tendon has been irritated and is now quiet under increased load, that is direct evidence the tissue is coping. The right test for the post-tib is not a number on this dashboard — it is how the medial shin feels during and 24 h after a hard effort.",
    },
    coveringPeriodStart: "2026-05-01",
    coveringPeriodEnd: "2026-05-16",
  },
  {
    anchor: "ch-race",
    ordinal: 10,
    kicker: "Chapter X · Six days out",
    title: "May 22 2026 — racing on a tendon that has held up",
    lead: "The pre-injury projection was sub-28 with sub-27 inside reach. Given the seven symptom-free days, the limited but real recent volume, and the coach-prescribed sharpness this week, that ceiling is now genuinely back in play — provided the warm-up confirms it.",
    body: [
      "Form (CTL − ATL) is currently slightly negative — mildly tired, which is normal during a final week. The Sun easy / Mon sharpness / Tue easy / Wed rest / Thu shakeout pattern in the next tab is built precisely to flip form positive by Friday morning while keeping enough nervous-system excitation for race speed.",
      "The single most consequential decision lives in the warm-up. If the 2–3 km easy jog plus strides feels clean — no medial-shin signal, no instinct to protect — the published coach-pace of 5:25–5:30/km is appropriate. If anything talks in the warm-up, drop to 5:35–5:45/km and finish strong; that is the difference between a great race and a six-week setback.",
    ],
    figures: [],
    callout: {
      title: "What success looks like",
      body: "Two outcomes count as wins: a sub-28 PB with a quiet post-tib through the next 48 h, or a 28:20-style honest race executed within the symptom envelope. The losing outcome is the PB at the cost of an aggravated tendon. The race after this race is the one that matters.",
    },
    coveringPeriodStart: "2026-05-16",
    coveringPeriodEnd: "2026-05-22",
  },
];

async function main() {
  const now = new Date();
  let inserted = 0, skipped = 0;
  for (const ch of CHAPTERS) {
    const existing = await prisma.chapter.findUnique({ where: { anchor: ch.anchor }, select: { id: true } });
    if (existing) {
      skipped += 1;
      console.log(`· ${ch.anchor.padEnd(20)} (already present, skipped)`);
      continue;
    }
    await prisma.chapter.create({
      data: {
        kind: "station",
        ordinal: ch.ordinal,
        anchor: ch.anchor,
        kicker: ch.kicker,
        title: ch.title,
        lead: ch.lead,
        bodyMd: ch.body.join("\n\n"),
        figuresJson: JSON.stringify(ch.figures),
        calloutJson: JSON.stringify(ch.callout),
        coveringPeriodStart: ch.coveringPeriodStart ? new Date(ch.coveringPeriodStart + "T00:00:00Z") : null,
        coveringPeriodEnd:   ch.coveringPeriodEnd   ? new Date(ch.coveringPeriodEnd   + "T00:00:00Z") : null,
        source: "seed",
        publishedAt: now,
      },
    });
    inserted += 1;
    console.log(`✔ ${ch.anchor.padEnd(20)} inserted`);
  }
  console.log(`\nSeed complete. ${inserted} inserted, ${skipped} skipped (already present).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
