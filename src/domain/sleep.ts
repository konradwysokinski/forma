/** Sleep beside training: one night per day on the chart, filed under the day it ended. */
import type { DayKey, SleepNight } from './types';

export type SleepLevel = 'low' | 'mid' | 'good';

/** Sleep scores from here up are a good night, from MID a fair one. */
export const SLEEP_GOOD = 80;
export const SLEEP_MID = 65;

/** The night ending on each of `days`, or null where there is none. */
export function sleepByDay(nights: readonly SleepNight[], days: readonly { date: DayKey }[]): (SleepNight | null)[] {
  const byDate = new Map(nights.map((n) => [n.date, n]));
  return days.map((d) => byDate.get(d.date) ?? null);
}

/** Average minutes asleep over the nights there are, or null when there are none. */
export function averageSleep(nights: readonly (SleepNight | null)[]): number | null {
  const known = nights.filter((n): n is SleepNight => n !== null);
  return known.length ? known.reduce((sum, n) => sum + n.minutes, 0) / known.length : null;
}

/** How dark a night's bar is. A night without a score is drawn like a poor one; its hours still show. */
export function sleepLevel(score: number | null): SleepLevel {
  if (score === null) return 'low';
  return score >= SLEEP_GOOD ? 'good' : score >= SLEEP_MID ? 'mid' : 'low';
}
