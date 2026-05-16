/**
 * The Run ingest pipeline. Shared by:
 *   • backfill script (scripts/import-fit-pilgrimage.ts)
 *   • daily Garmin sync (app/api/cron/garmin-sync/route.ts) — PR 5
 *
 * Idempotent on `fileSha256` and `garminActivityId`.
 */
import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import {
  annotateSamples, downsampleSamples,
  computeBestEfforts, computeDecoupling, computeHrZoneSeconds,
  ctlAtlSeries, type RecordSample, BEST_EFFORT_TARGETS_M,
} from "./derive";
import type { DecodedRun } from "./fit-decoder";

const RECORD_DOWNSAMPLE_S = 5;

export interface IngestOptions {
  source?: "garmin" | "manual" | "imported";
  garminActivityId?: string;
  rawBytes?: Buffer;          // for sha256 + future raw storage
}

export interface IngestResult {
  runId: string;
  inserted: boolean;          // false = already existed, skipped
}

export async function ingestRun(decoded: DecodedRun, opts: IngestOptions = {}): Promise<IngestResult> {
  const fileSha256 = opts.rawBytes
    ? createHash("sha256").update(opts.rawBytes).digest("hex")
    : undefined;

  // Dedup short-circuit
  if (fileSha256) {
    const existing = await prisma.run.findUnique({ where: { fileSha256 }, select: { id: true } });
    if (existing) return { runId: existing.id, inserted: false };
  }
  if (opts.garminActivityId) {
    const existing = await prisma.run.findUnique({ where: { garminActivityId: opts.garminActivityId }, select: { id: true } });
    if (existing) return { runId: existing.id, inserted: false };
  }

  // Sample-level derivatives
  const rawSamples: RecordSample[] = decoded.records.map(r => ({
    tSec: r.tSec,
    distanceM: r.distanceM, speedMps: r.speedMps, hr: r.hr,
    cadenceSpm: r.cadenceSpm, altitudeM: r.altitudeM,
    lat: r.lat, lon: r.lon, powerW: r.powerW, tempC: r.tempC,
  }));
  annotateSamples(rawSamples);

  const decoupling = computeDecoupling(rawSamples, decoded.distanceM);
  const zones = computeHrZoneSeconds(rawSamples);
  const bests = computeBestEfforts(rawSamples);

  // CTL/ATL/TSB at end-of-this-run — read all *prior* daily km from DB,
  // append today's km, walk the EWMA, take the last snapshot.
  const dayKey = decoded.startedAtLocal.toISOString().slice(0, 10);
  const priorRuns = await prisma.run.findMany({
    where: { startedAtLocal: { lt: new Date(dayKey + "T00:00:00Z") } },
    select: { startedAtLocal: true, distanceM: true },
    orderBy: { startedAtLocal: "asc" },
  });
  const dailyKm = aggregateDaily(priorRuns, decoded);
  const ff = ctlAtlSeries(dailyKm)[dailyKm.length - 1] ?? { ctl: 0, atl: 0, tsb: 0 };

  const avgPaceSecPerKm = decoded.distanceM > 0 && decoded.durationS > 0
    ? decoded.durationS / (decoded.distanceM / 1000) : null;

  // Downsample records for storage; raw bytes preserved by sha256 ref
  const downsampled = downsampleSamples(rawSamples, RECORD_DOWNSAMPLE_S);

  // One transaction: upsert run + replace records/laps/bests
  const run = await prisma.$transaction(async (tx) => {
    const created = await tx.run.create({
      data: {
        garminActivityId: opts.garminActivityId,
        fileSha256,
        date: new Date(dayKey + "T00:00:00Z"),
        startedAt: decoded.startedAt,
        startedAtLocal: decoded.startedAtLocal,
        sport: decoded.sport,
        subSport: decoded.subSport,
        source: opts.source ?? "imported",
        title: decoded.title,
        distanceM: decoded.distanceM,
        durationS: decoded.durationS,
        elapsedS: decoded.elapsedS,
        avgPaceSecPerKm,
        avgSpeedMps: decoded.avgSpeedMps,
        maxSpeedMps: decoded.maxSpeedMps,
        avgHr: decoded.avgHr,
        maxHr: decoded.maxHr,
        avgCadenceSpm: decoded.avgCadenceSpm,
        avgPowerW: decoded.avgPowerW,
        normalizedPowerW: decoded.normalizedPowerW,
        ascentM: decoded.ascentM,
        descentM: decoded.descentM,
        calories: decoded.calories,
        ctlAtEnd: ff.ctl,
        atlAtEnd: ff.atl,
        tsbAtEnd: ff.tsb,
        decouplingPct: decoupling.decouplingPct ?? null,
        zonesJson: JSON.stringify(zones),
      },
    });

    if (downsampled.length) {
      await tx.runRecord.createMany({
        data: downsampled.map(s => ({
          runId: created.id,
          tSec: s.tSec,
          lat: s.lat ?? null,
          lon: s.lon ?? null,
          distanceM: s.distanceM ?? null,
          speedMps: s.speedMps ?? null,
          altitudeM: s.altitudeM ?? null,
          hr: s.hr ?? null,
          cadenceSpm: s.cadenceSpm ?? null,
          powerW: s.powerW ?? null,
          tempC: s.tempC ?? null,
          pauseBreak: s.pauseBreak ?? false,
        })),
      });
    }

    if (decoded.laps.length) {
      await tx.runLap.createMany({
        data: decoded.laps.map(l => ({
          runId: created.id,
          lapIndex: l.lapIndex,
          distanceM: l.distanceM,
          durationS: l.durationS,
          avgPaceSecPerKm: l.avgPaceSecPerKm,
          avgHr: l.avgHr,
          avgCadenceSpm: l.avgCadenceSpm,
        })),
      });
    }

    if (bests.size) {
      await tx.runBestEffort.createMany({
        data: Array.from(bests.entries()).map(([distanceM, paceSecPerKm]) => ({
          runId: created.id,
          distanceM,
          paceSecPerKm,
        })),
      });
    }

    return created;
  });

  return { runId: run.id, inserted: true };
}

/** Helper: aggregate prior + current run into a day-by-day km series. */
function aggregateDaily(
  prior: { startedAtLocal: Date; distanceM: number }[],
  current: DecodedRun,
): number[] {
  const DAY_MS = 86_400_000;
  const all = [...prior, { startedAtLocal: current.startedAtLocal, distanceM: current.distanceM }];
  const byDate = new Map<string, number>();
  for (const r of all) {
    const iso = r.startedAtLocal.toISOString().slice(0, 10);
    byDate.set(iso, (byDate.get(iso) ?? 0) + r.distanceM / 1000);
  }
  if (!byDate.size) return [];
  const dates = Array.from(byDate.keys()).sort();
  const first = new Date(dates[0] + "T00:00:00Z");
  const last  = new Date(dates[dates.length - 1] + "T00:00:00Z");
  const out: number[] = [];
  for (let t = first.getTime(); t <= last.getTime(); t += DAY_MS) {
    const iso = new Date(t).toISOString().slice(0, 10);
    out.push(byDate.get(iso) ?? 0);
  }
  return out;
}

export const _exposed_for_tests = { aggregateDaily };
