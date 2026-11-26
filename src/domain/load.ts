/**
 * Training load per activity: Banister's TRIMP, from moving time and average
 * heart rate, both in Strava's activity list (no per-activity requests).
 *
 *   TRIMP = minutes × HRr × a × e^(b × HRr),  HRr = (avg − rest) / (max − rest)
 *   a, b = 0.64, 1.92 (men) or 0.86, 1.67 (women)
 *
 * Activities without heart rate get the load of the same time at an easy
 * effort (ASSUMED_HRR), so they still count, but never as hard sessions.
 */
import { dayOf, daysBetween } from '../lib/days';
import type { Activity, Athlete, DayKey } from './types';

/** Heart-rate reserve assumed when an activity has no heart rate: an easy effort. */
export const ASSUMED_HRR = 0.55;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function trimp(movingTimeSeconds: number, averageHr: number, athlete: Athlete): number {
  const [a, b] = athlete.sex === 'female' ? [0.86, 1.67] : [0.64, 1.92];
  const hrr = clamp((averageHr - athlete.restHr) / (athlete.maxHr - athlete.restHr), 0, 1);
  return (movingTimeSeconds / 60) * hrr * a * Math.exp(b * hrr);
}

export function activityLoad(activity: Activity, athlete: Athlete): number {
  const hr = activity.averageHeartrate ?? athlete.restHr + ASSUMED_HRR * (athlete.maxHr - athlete.restHr);
  return trimp(activity.movingTime, hr, athlete);
}

/** Sum of load per calendar day, from `from` to `to` inclusive; days without training are 0. */
export function dailyLoads(activities: readonly Activity[], athlete: Athlete, from: DayKey, to: DayKey): number[] {
  const loads = new Array<number>(daysBetween(from, to) + 1).fill(0);
  for (const a of activities) {
    const i = daysBetween(from, dayOf(a.start));
    if (i >= 0 && i < loads.length) loads[i]! += activityLoad(a, athlete);
  }
  return loads;
}

/**
 * Rough bounds until the athlete sets them: max from the hardest average heart
 * rate seen (a race averages about 92% of max), rest at a typical 50.
 */
export function estimateAthlete(activities: readonly Activity[]): Athlete {
  const highest = Math.max(0, ...activities.map((a) => a.averageHeartrate ?? 0));
  const maxHr = highest ? Math.round(clamp(highest / 0.92, 170, 210)) : 190;
  return { maxHr, restHr: 50 };
}

/** First day worth computing from: the earliest activity, or `to` when there are none. */
export function firstDay(activities: readonly Activity[], to: DayKey): DayKey {
  let first = to;
  for (const a of activities) if (dayOf(a.start) < first) first = dayOf(a.start);
  return first;
}
