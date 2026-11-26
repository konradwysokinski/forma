/**
 * Heart rate at easy pace, month by month: the time-weighted average heart rate
 * of runs whose average pace falls in a fixed easy band. Lower at the same pace
 * means fitter.
 */
import { addMonths, dayOf, monthOf } from '../lib/days';
import type { Activity, DayKey } from './types';

/** Seconds per km: 5:30 to 6:00 /km. Settings will let the athlete move it. */
export const EASY_PACE = { from: 330, to: 360 } as const;

export interface EasyHrMonth {
  /** "2026-11" */
  month: string;
  /** null when no easy run with heart rate that month. */
  bpm: number | null;
  runs: number;
}

export function easyHrByMonth(
  activities: readonly Activity[],
  asOf: DayKey,
  months = 6,
  pace: { from: number; to: number } = EASY_PACE,
): EasyHrMonth[] {
  const last = monthOf(asOf);
  const first = addMonths(last, -(months - 1));
  const sums = new Map<string, { beats: number; time: number; runs: number }>();
  for (const a of activities) {
    if (a.sport !== 'run' || !a.averageHeartrate || a.distance <= 0 || dayOf(a.start) > asOf) continue;
    const secondsPerKm = a.movingTime / (a.distance / 1000);
    if (secondsPerKm < pace.from || secondsPerKm > pace.to) continue;
    const m = monthOf(dayOf(a.start));
    if (m < first) continue;
    const s = sums.get(m) ?? { beats: 0, time: 0, runs: 0 };
    s.beats += a.averageHeartrate * a.movingTime;
    s.time += a.movingTime;
    s.runs += 1;
    sums.set(m, s);
  }
  return Array.from({ length: months }, (_, i) => {
    const month = addMonths(first, i);
    const s = sums.get(month);
    return { month, bpm: s ? Math.round(s.beats / s.time) : null, runs: s?.runs ?? 0 };
  });
}
