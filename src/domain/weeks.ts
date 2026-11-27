/** The Weeks view on Activities: Monday-to-Sunday weeks, newest first, each with its days and totals. */
import { addDays, dayOf } from '../lib/days';
import type { WeekFeel } from './formSummary';
import { activityLoad } from './load';
import { zoneOf, type TrainingDay, type Zone } from './training';
import type { Activity, Athlete, DayKey, SleepNight } from './types';

/** The Monday on or before a day. */
export function weekStart(day: DayKey): DayKey {
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay(); // 0 Sunday … 6 Saturday
  return addDays(day, -((weekday + 6) % 7));
}

export interface WeekDay {
  date: DayKey;
  /** The day's shown activities in start order. */
  activities: Activity[];
  /** After today: nothing has happened yet. */
  ahead: boolean;
}

export interface ActivityWeek {
  /** Monday. */
  start: DayKey;
  /** Sunday. */
  end: DayKey;
  days: WeekDay[];
  /** Totals of the shown activities: metres, seconds, metres climbed (runs' elevation, once known). */
  distance: number;
  movingTime: number;
  elevationGain: number;
  /** Load of every activity that week, whatever the filter: training is all of it. */
  load: number;
  /** The week's load against fitness, as the Fatigue tile words it; null for the week still running. */
  feel: WeekFeel | null;
  /** Form on Sunday, or today for this week. */
  zone: Zone | null;
  /** Average minutes asleep over the week's nights, when the source has sleep. */
  sleep: number | null;
  current: boolean;
}

interface Input {
  /** What the filter shows. */
  shown: readonly Activity[];
  /** Every activity, for the week's load. */
  all: readonly Activity[];
  athlete: Athlete;
  asOf: DayKey;
  training: ReadonlyMap<DayKey, TrainingDay>;
  sleep?: readonly SleepNight[];
}

/**
 * Newest week first, from this week back to the oldest week with a shown
 * activity. Weeks without one are left out (this week always stays), so a
 * filter on rides doesn't list months of empty weeks.
 */
export function groupByWeek({ shown, all, athlete, asOf, training, sleep = [] }: Input): ActivityWeek[] {
  const byDay = new Map<DayKey, Activity[]>();
  for (const a of shown) {
    const day = dayOf(a.start);
    byDay.set(day, [...(byDay.get(day) ?? []), a]);
  }
  for (const list of byDay.values()) list.sort((a, b) => (a.start < b.start ? -1 : 1));

  const loadByWeek = new Map<DayKey, number>();
  for (const a of all) {
    const w = weekStart(dayOf(a.start));
    loadByWeek.set(w, (loadByWeek.get(w) ?? 0) + activityLoad(a, athlete));
  }
  const sleepByDay = new Map(sleep.map((n) => [n.date, n.minutes]));

  const thisWeek = weekStart(asOf);
  const starts = new Set([thisWeek, ...shown.map((a) => weekStart(dayOf(a.start)))]);
  return [...starts]
    .filter((w) => w <= thisWeek)
    .sort((a, b) => (a < b ? 1 : -1))
    .map((start) => {
      const end = addDays(start, 6);
      const days = Array.from({ length: 7 }, (_, i): WeekDay => {
        const date = addDays(start, i);
        return { date, activities: byDay.get(date) ?? [], ahead: date > asOf };
      });
      const acts = days.flatMap((d) => d.activities);
      const current = start === thisWeek;
      const last = training.get(current ? asOf : end);
      const load = loadByWeek.get(start) ?? 0;
      const nights = days.map((d) => sleepByDay.get(d.date)).filter((m): m is number => m !== undefined);
      return {
        start,
        end,
        days,
        distance: acts.reduce((sum, a) => sum + a.distance, 0),
        movingTime: acts.reduce((sum, a) => sum + a.movingTime, 0),
        elevationGain: acts.reduce((sum, a) => sum + a.elevationGain, 0),
        load,
        feel: current || !last ? null : weekFeel(load / 7, last.fitness),
        zone: last?.form != null ? zoneOf(last.form) : null,
        sleep: nights.length ? nights.reduce((sum, m) => sum + m, 0) / nights.length : null,
        current,
      };
    });
}

/** A week's average daily load against fitness at its end, with the Fatigue tile's thresholds. */
export function weekFeel(dailyLoad: number, fitness: number): WeekFeel {
  return dailyLoad < fitness * 0.9 ? 'easy' : dailyLoad > fitness * 1.15 ? 'hard' : 'steady';
}
