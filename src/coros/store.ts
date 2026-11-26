/** What Forma keeps from COROS in this browser's IndexedDB: activities and what the last sync learnt. */
import { dbDelete, dbGet, dbSet } from '../lib/db';
import type { Activity, Athlete } from '../domain/types';

const KEY = 'coros';

export interface CorosData {
  activities: Activity[];
  /** Milliseconds since the epoch. */
  lastSync: number;
  /** Median of COROS's daily resting heart rate, last 30 days. */
  restHr: number | null;
  sex: Athlete['sex'];
}

export const loadCorosData = () => dbGet<CorosData>(KEY);
export const saveCorosData = (data: CorosData) => dbSet(KEY, data);
export const clearCorosData = () => dbDelete(KEY);
