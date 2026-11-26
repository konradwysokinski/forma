import { describe, expect, it } from 'vitest';
import { SAMPLE } from '../data/sample';
import { activityDetail, countBySport, filterActivities, groupByMonth, zoneOn, zonesByDay } from './activities';
import { formSummary } from './formSummary';
import { activityLoad } from './load';
import { zoneOf } from './training';
import type { Activity, Athlete, Sport } from './types';

const act = (id: string, start: string, sport: Sport, km: number, seconds: number, hr?: number): Activity => ({
  id,
  name: id,
  sport,
  start,
  distance: km * 1000,
  movingTime: seconds,
  elevationGain: 0,
  ...(hr ? { averageHeartrate: hr } : {}),
});

const athlete: Athlete = { maxHr: 190, restHr: 50 };

const list = [
  act('oct-run', '2026-10-30T07:00:00', 'run', 10, 3000, 150),
  act('nov-ride', '2026-11-02T17:00:00', 'ride', 40, 4800, 135),
  act('nov-gym', '2026-11-02T08:00:00', 'other', 0, 2700),
  act('nov-run', '2026-11-20T07:00:00', 'run', 8, 2640, 142),
];

describe('filters', () => {
  it('counts each sport and filters by it', () => {
    expect(countBySport(list)).toEqual({ all: 4, run: 2, ride: 1, other: 1 });
    expect(filterActivities(list, 'run').map((a) => a.id)).toEqual(['oct-run', 'nov-run']);
    expect(filterActivities(list, 'all')).toHaveLength(4);
  });
});

describe('groupByMonth', () => {
  it('puts the newest month first and the newest activity first inside it, with totals', () => {
    const months = groupByMonth(list);
    expect(months.map((m) => m.month)).toEqual(['2026-11', '2026-10']);
    expect(months[0]!.activities.map((a) => a.id)).toEqual(['nov-run', 'nov-ride', 'nov-gym']);
    expect(months[0]).toMatchObject({ distance: 48000, movingTime: 2640 + 4800 + 2700 });
    expect(months[1]).toMatchObject({ distance: 10000, movingTime: 3000 });
  });

  it('is empty for no activities', () => {
    expect(groupByMonth([])).toEqual([]);
  });
});

describe('activityDetail', () => {
  it('gives pace on foot, speed on a bike, and the load', () => {
    const run = activityDetail(list[0]!, athlete);
    expect(run).toMatchObject({ pace: 300, speed: null, movingTime: 3000, heartRate: 150 });
    expect(run.load).toBeCloseTo(activityLoad(list[0]!, athlete));

    const ride = activityDetail(list[1]!, athlete);
    expect(ride.pace).toBeNull();
    expect(ride.speed).toBeCloseTo(30);
  });

  it('has neither pace nor heart rate for a gym session, but still a load', () => {
    const gym = activityDetail(list[2]!, athlete);
    expect(gym).toMatchObject({ pace: null, speed: null, heartRate: null, movingTime: 2700 });
    expect(gym.load).toBeGreaterThan(0);
  });
});

describe('zonesByDay', () => {
  it('agrees with the Form screen day for day', () => {
    const zones = zonesByDay(SAMPLE);
    for (const d of formSummary(SAMPLE, 'year').days) {
      expect(zones.get(d.date) ?? null).toBe(d.form === null ? null : zoneOf(d.form));
    }
  });

  it('finds the zone of the day an activity started on, none without history', () => {
    const zones = zonesByDay(SAMPLE);
    const last = SAMPLE.activities.at(-1)!;
    expect(zoneOn(zones, last)).toBe(zones.get(last.start.slice(0, 10)));
    expect(zonesByDay({ activities: [], athlete, asOf: '2026-11-25' }).size).toBe(0);
  });
});
