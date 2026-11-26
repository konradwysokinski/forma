/**
 * Fitness, fatigue and form, as Intervals.icu and TrainingPeaks define them.
 *
 * - Fitness (CTL): exponentially weighted average of daily load over 42 days.
 * - Fatigue (ATL): the same over 7 days.
 * - Form: (fitness − fatigue) / fitness, as a percentage, from yesterday's
 *   values, so today's training doesn't change today's form.
 */
import { addDays } from '../lib/days';
import type { DayKey } from './types';

export const FITNESS_DAYS = 42;
export const FATIGUE_DAYS = 7;

export interface TrainingDay {
  date: DayKey;
  load: number;
  fitness: number;
  fatigue: number;
  /** Percent of fitness; null in the first week of history and while fitness is too small to divide by. */
  form: number | null;
}

/** Below this fitness the form percentage swings wildly, so it isn't shown. */
const MIN_FITNESS = 1;

/**
 * History never starts from zero training: the first activity Forma can read
 * comes after months it can't. So fitness and fatigue start at the average
 * daily load of the first six weeks, instead of climbing from zero for months
 * and showing the start of the history as high risk.
 */
export function startingLoad(loads: readonly number[]): number {
  const first = loads.slice(0, FITNESS_DAYS);
  return first.length ? first.reduce((sum, l) => sum + l, 0) / first.length : 0;
}

export function trainingDays(loads: readonly number[], from: DayKey, start = startingLoad(loads)): TrainingDay[] {
  let fitness = start;
  let fatigue = start;
  return loads.map((load, i) => {
    const settled = i >= FATIGUE_DAYS && fitness >= MIN_FITNESS;
    const form = settled ? ((fitness - fatigue) / fitness) * 100 : null;
    fitness += (load - fitness) / FITNESS_DAYS;
    fatigue += (load - fatigue) / FATIGUE_DAYS;
    return { date: addDays(from, i), load, fitness, fatigue, form };
  });
}

export type Zone = 'transition' | 'fresh' | 'grey' | 'optimal' | 'risk';

/** Top to bottom, as in the legend. `above`: the zone starts above this percentage. */
export const ZONES: readonly { id: Zone; above: number }[] = [
  { id: 'transition', above: 20 },
  { id: 'fresh', above: 5 },
  { id: 'grey', above: -10 },
  { id: 'optimal', above: -30 },
  { id: 'risk', above: -Infinity },
];

export function zoneOf(formPercent: number): Zone {
  return ZONES.find((z) => formPercent > z.above)!.id;
}
