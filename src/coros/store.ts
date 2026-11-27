/** What Forma keeps from COROS in this browser's IndexedDB: activities, sleep, runs' elevation and what the last sync learnt. */
import { dbDelete, dbGet, dbSet } from '../lib/db';
import type { Activity, Athlete, SleepNight } from '../domain/types';
import type { ElevationMap } from './sync';

const KEY = 'coros';

export interface CorosData {
  activities: Activity[];
  /** Nights by wake-up day, oldest first. Absent in data saved before Forma read sleep. */
  sleep?: SleepNight[];
  /**
   * Metres climbed per run id (0 when COROS lists none), fetched one run at a
   * time after the list. Kept apart from `activities` so re-fetched days keep it.
   * Absent in data saved before Forma read elevation.
   */
  elevation?: ElevationMap;
  /** Milliseconds since the epoch. */
  lastSync: number;
  /** Median of COROS's daily resting heart rate, last 30 days. */
  restHr: number | null;
  sex: Athlete['sex'];
}

export const loadCorosData = () => dbGet<CorosData>(KEY);
export const saveCorosData = (data: CorosData) => dbSet(KEY, data);
export const clearCorosData = () => dbDelete(KEY);
