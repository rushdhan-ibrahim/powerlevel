/**
 * FIT file decoder — thin wrapper around @garmin/fitsdk that returns
 * a normalised shape we can feed straight into the Prisma upsert.
 *
 * Positions arrive from FIT as semicircles; we convert to degrees.
 * Cadence arrives as one-foot revs/min; we double it to steps/min.
 * Pace is computed downstream in `derive.ts`.
 */
import { Decoder, Stream } from "@garmin/fitsdk";

export interface DecodedRun {
  fileSha256?: string;
  garminActivityId?: string;
  sport: string;
  subSport?: string;
  title?: string;
  startedAt: Date;
  startedAtLocal: Date;
  durationS: number;
  elapsedS: number;
  distanceM: number;
  avgSpeedMps: number | null;
  maxSpeedMps: number | null;
  avgHr: number | null;
  maxHr: number | null;
  avgCadenceSpm: number | null;       // already doubled
  avgPowerW: number | null;
  normalizedPowerW: number | null;
  ascentM: number | null;
  descentM: number | null;
  calories: number | null;
  records: DecodedRecord[];
  laps: DecodedLap[];
}

export interface DecodedRecord {
  tSec: number;
  lat: number | null;
  lon: number | null;
  distanceM: number | null;
  speedMps: number | null;
  altitudeM: number | null;
  hr: number | null;
  cadenceSpm: number | null;
  powerW: number | null;
  tempC: number | null;
}

export interface DecodedLap {
  lapIndex: number;
  distanceM: number | null;
  durationS: number | null;
  avgPaceSecPerKm: number | null;
  avgHr: number | null;
  avgCadenceSpm: number | null;
}

const SEMI_TO_DEG = 180 / 2 ** 31;

export function decodeFit(buf: Buffer): DecodedRun | null {
  const stream = Stream.fromBuffer(buf);
  const decoder = new Decoder(stream);
  if (!decoder.checkIntegrity()) return null;
  const { messages } = decoder.read({
    applyScaleAndOffset: true,
    convertTypesToStrings: true,
    convertDateTimesToDates: true,
    expandSubFields: true,
    expandComponents: true,
  });

  const session = messages.sessionMesgs?.[0];
  if (!session) return null;

  const startedAt: Date = session.startTime ? new Date(session.startTime) : new Date(0);
  const startedAtLocal = session.localTimestamp ? new Date(session.localTimestamp) : startedAt;
  const sport: string = session.sport ?? "unknown";
  const subSport: string | undefined = session.subSport ?? undefined;
  const title: string | undefined = session.sportProfileName ?? undefined;

  const distanceM = session.totalDistance ?? 0;
  const durationS = session.totalTimerTime ?? 0;
  const elapsedS = session.totalElapsedTime ?? durationS;

  const avgSpeedMps = session.enhancedAvgSpeed ?? session.avgSpeed ?? null;
  const maxSpeedMps = session.enhancedMaxSpeed ?? session.maxSpeed ?? null;
  const avgHr = session.avgHeartRate ?? null;
  const maxHr = session.maxHeartRate ?? null;
  const avgCad = session.avgRunningCadence ?? session.avgCadence ?? null;
  const avgCadenceSpm = typeof avgCad === "number" ? avgCad * 2 : null;
  const avgPowerW = session.avgPower ?? null;
  const normalizedPowerW = session.normalizedPower ?? null;
  const ascentM = session.totalAscent ?? null;
  const descentM = session.totalDescent ?? null;
  const calories = session.totalCalories ?? null;

  const records: DecodedRecord[] = (messages.recordMesgs ?? []).map((r: any) => {
    const ts: Date | undefined = r.timestamp ? new Date(r.timestamp) : undefined;
    const tSec = ts ? (ts.getTime() - startedAt.getTime()) / 1000 : 0;
    const cad = r.cadence ?? null;
    const frac = r.fractionalCadence ?? 0;
    const cadenceSpm = typeof cad === "number" ? (cad + (typeof frac === "number" ? frac : 0)) * 2 : null;
    return {
      tSec,
      lat: typeof r.positionLat === "number" ? r.positionLat * SEMI_TO_DEG : null,
      lon: typeof r.positionLong === "number" ? r.positionLong * SEMI_TO_DEG : null,
      distanceM: typeof r.distance === "number" ? r.distance : null,
      speedMps: typeof r.enhancedSpeed === "number" ? r.enhancedSpeed
              : typeof r.speed === "number" ? r.speed : null,
      altitudeM: typeof r.enhancedAltitude === "number" ? r.enhancedAltitude
                : typeof r.altitude === "number" ? r.altitude : null,
      hr: typeof r.heartRate === "number" ? r.heartRate : null,
      cadenceSpm,
      powerW: typeof r.power === "number" ? r.power : null,
      tempC: typeof r.temperature === "number" ? r.temperature : null,
    };
  });

  const laps: DecodedLap[] = (messages.lapMesgs ?? []).map((l: any, i: number) => {
    const distM = l.totalDistance ?? null;
    const durS = l.totalTimerTime ?? null;
    const lapCad = l.avgRunningCadence ?? l.avgCadence ?? null;
    return {
      lapIndex: i + 1,
      distanceM: distM,
      durationS: durS,
      avgPaceSecPerKm: distM && durS && distM > 0 ? durS / (distM / 1000) : null,
      avgHr: l.avgHeartRate ?? null,
      avgCadenceSpm: typeof lapCad === "number" ? lapCad * 2 : null,
    };
  });

  return {
    sport, subSport, title,
    startedAt, startedAtLocal,
    durationS, elapsedS, distanceM,
    avgSpeedMps, maxSpeedMps, avgHr, maxHr,
    avgCadenceSpm, avgPowerW, normalizedPowerW,
    ascentM, descentM, calories,
    records, laps,
  };
}

const RUNNING_SUB_SPORTS = new Set([
  "generic", "street", "trail", "track", "treadmill",
  "indoor_running", "virtual_activity",
]);

/** Filter: returns true if this FIT activity should be ingested as a run. */
export function isRunningActivity(d: { sport: string; subSport?: string | null }): boolean {
  if (d.sport === "running") return true;
  if (d.sport === "trail_running" || d.sport === "treadmill_running"
   || d.sport === "track_running"  || d.sport === "indoor_running"
   || d.sport === "virtual_run") return true;
  return false;
}
