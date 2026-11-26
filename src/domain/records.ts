/**
 * Personal records from whole runs. Strava's activity list has no best efforts
 * inside longer runs (those need one request per activity), so a 5 km record
 * is the fastest run of 5 to 5.25 km, its time scaled to exactly 5 km.
 */
import { daysBetween, dayOf } from '../lib/days';
import type { Activity, DayKey } from './types';

export type RecordId = '5k' | '10k' | 'half' | 'longest';

export interface RunRecord {
  id: RecordId;
  activityId: string;
  date: DayKey;
  /** Seconds, for the distance records. */
  time?: number;
  /** Metres, for the longest run. */
  distance?: number;
  /** Set within the last NEW_DAYS days. */
  isNew: boolean;
}

export const RECORD_DISTANCES: readonly { id: Exclude<RecordId, 'longest'>; metres: number }[] = [
  { id: '5k', metres: 5000 },
  { id: '10k', metres: 10000 },
  { id: 'half', metres: 21097.5 },
];

/** A run counts for a distance when it is at most this much longer. */
const SLACK = 1.05;
export const NEW_DAYS = 30;

export function records(activities: readonly Activity[], asOf: DayKey): Partial<Record<RecordId, RunRecord>> {
  const runs = activities.filter((a) => a.sport === 'run' && dayOf(a.start) <= asOf && a.distance > 0);
  const result: Partial<Record<RecordId, RunRecord>> = {};
  const make = (id: RecordId, a: Activity, extra: Partial<RunRecord>): RunRecord => ({
    id,
    activityId: a.id,
    date: dayOf(a.start),
    isNew: daysBetween(dayOf(a.start), asOf) < NEW_DAYS,
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
