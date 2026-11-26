/** What the Activities screen lists: filters by sport, months, and what an opened row shows. */
import { addDays, dayOf, monthOf } from '../lib/days';
import { PERIOD_DAYS } from './formSummary';
import { activityLoad, dailyLoads, firstDay } from './load';
import { FITNESS_DAYS, trainingDays, zoneOf, type Zone } from './training';
import type { Activity, Athlete, Dataset, DayKey, Sport } from './types';

export type ActivityFilter = 'all' | Sport;
export const ACTIVITY_FILTERS: readonly ActivityFilter[] = ['all', 'run', 'ride', 'other'];

export function filterActivities(activities: readonly Activity[], filter: ActivityFilter): Activity[] {
  return filter === 'all' ? [...activities] : activities.filter((a) => a.sport === filter);
}

export function countBySport(activities: readonly Activity[]): Record<ActivityFilter, number> {
  const counts: Record<ActivityFilter, number> = { all: activities.length, run: 0, ride: 0, other: 0 };
  for (const a of activities) counts[a.sport] += 1;
  return counts;
}

export interface MonthGroup {
  /** "2026-11" */
  month: string;
  /** Metres. */
  distance: number;
  /** Seconds. */
  movingTime: number;
  activities: Activity[];
}

/** Newest month first, newest activity first inside each month. */
export function groupByMonth(activities: readonly Activity[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();
  const sorted = [...activities].sort((a, b) => (a.start < b.start ? 1 : a.start > b.start ? -1 : 0));
  for (const a of sorted) {
    const month = monthOf(a.start);
    let g = groups.get(month);
    if (!g) {
      g = { month, distance: 0, movingTime: 0, activities: [] };
      groups.set(month, g);
    }
    g.distance += a.distance;
    g.movingTime += a.movingTime;
    g.activities.push(a);
  }
  return [...groups.values()];
}

export interface ActivityDetail {
  /** Seconds per km, for anything on foot with a distance; null for rides. */
  pace: number | null;
  /** km/h for rides. */
  speed: number | null;
  movingTime: number | null;
  heartRate: number | null;
  /** Training load (TRIMP), as it counts toward fitness and fatigue. */
  load: number;
}

/** What an opened row on Activities shows. */
export function activityDetail(a: Activity, athlete: Athlete): ActivityDetail {
  const km = a.distance / 1000;
  const moving = a.movingTime > 0 ? a.movingTime : null;
  const ride = a.sport === 'ride';
  return {
    pace: moving && !ride && km > 0 ? moving / km : null,
    speed: moving && ride && km > 0 ? km / (moving / 3600) : null,
    movingTime: moving,
    heartRate: a.averageHeartrate && a.averageHeartrate > 0 ? a.averageHeartrate : null,
    load: activityLoad(a, athlete),
  };
}

/**
 * Each day's form zone, as the Form screen shows it (from the day before's
 * fitness and fatigue), started where the Form screen's year starts so the
 * two agree. Days in the first week of history have none.
 */
export function zonesByDay(data: Pick<Dataset, 'activities' | 'athlete' | 'asOf'>): Map<DayKey, Zone> {
  const { activities, athlete, asOf } = data;
  const zones = new Map<DayKey, Zone>();
  if (!activities.length) return zones;
  const from = [firstDay(activities, asOf), addDays(asOf, -(PERIOD_DAYS.year + FITNESS_DAYS))].sort()[0]!;
  for (const d of trainingDays(dailyLoads(activities, athlete, from, asOf), from)) {
    if (d.form !== null) zones.set(d.date, zoneOf(d.form));
  }
  return zones;
}

export const zoneOn = (zones: ReadonlyMap<DayKey, Zone>, a: Activity) => zones.get(dayOf(a.start)) ?? null;
