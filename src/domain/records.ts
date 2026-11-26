/**
 * Personal records from whole runs. Strava's activity list has no best efforts
 * inside longer runs (those need one request per activity), so a 5 km record
 * is the fastest run of 5 to 5.25 km, its time scaled to exactly 5 km.
 * Records cover a period (the screen's), not a lifetime: Forma only holds
 * about 14 months of activities.
 */
import { daysBetween, dayOf } from '../lib/days';
import type { Activity, DayKey } from './types';

export type RecordId = '5k' | '10k' | 'half' | 'marathon' | 'longest';

export interface RunRecord {
  id: RecordId;
  activityId: string;
  date: DayKey;
  /** Seconds, for the distance records. */
  time?: number;
  /** Metres, for the longest run. */
  distance?: number;
  /** The run's average heart rate, when it was measured. */
  heartRate?: number;
  /** Set within the last NEW_DAYS days. */
  isNew: boolean;
}

export const RECORD_DISTANCES: readonly { id: Exclude<RecordId, 'longest'>; metres: number }[] = [
  { id: '5k', metres: 5000 },
  { id: '10k', metres: 10000 },
  { id: 'half', metres: 21097.5 },
  { id: 'marathon', metres: 42195 },
];

/** A run counts for a distance when it is at most this much longer. */
const SLACK = 1.05;
export const NEW_DAYS = 30;

/** Records from runs between `from` (inclusive, the whole history when left out) and `asOf`. */
export function records(
  activities: readonly Activity[],
  asOf: DayKey,
  from?: DayKey,
): Partial<Record<RecordId, RunRecord>> {
  const runs = activities.filter((a) => {
    const day = dayOf(a.start);
    return a.sport === 'run' && a.distance > 0 && day <= asOf && (!from || day >= from);
  });
  const result: Partial<Record<RecordId, RunRecord>> = {};
  const make = (id: RecordId, a: Activity, extra: Partial<RunRecord>): RunRecord => ({
    id,
    activityId: a.id,
    date: dayOf(a.start),
    isNew: daysBetween(dayOf(a.start), asOf) < NEW_DAYS,
    ...(a.averageHeartrate ? { heartRate: a.averageHeartrate } : {}),
    ...extra,
  });

  for (const { id, metres } of RECORD_DISTANCES) {
    let best: { a: Activity; time: number } | undefined;
    for (const a of runs) {
      if (a.distance < metres || a.distance > metres * SLACK) continue;
      const time = (a.movingTime * metres) / a.distance;
      if (!best || time < best.time) best = { a, time };
    }
    if (best) result[id] = make(id, best.a, { time: Math.round(best.time) });
  }

  const longest = runs.reduce<Activity | undefined>((m, a) => (!m || a.distance > m.distance ? a : m), undefined);
  if (longest) result.longest = make('longest', longest, { distance: longest.distance });
  return result;
}
