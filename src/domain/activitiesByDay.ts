import { dayOf } from '../lib/days';
import type { Activity, DayKey } from './types';

/** Activities grouped by the calendar day they started on, each day's in start order. */
export function activitiesByDay(activities: readonly Activity[]): Map<DayKey, Activity[]> {
  const byDay = new Map<DayKey, Activity[]>();
  for (const a of activities) {
    const day = dayOf(a.start);
    const list = byDay.get(day);
    if (list) list.push(a);
    else byDay.set(day, [a]);
  }
  for (const list of byDay.values()) list.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
  return byDay;
}
