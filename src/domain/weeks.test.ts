import { describe, expect, it } from 'vitest';
import { SAMPLE } from '../data/sample';
import { trainingByDay } from './activities';
import { activityLoad } from './load';
import type { TrainingDay } from './training';
import type { Activity, Athlete, Sport } from './types';
import { groupByWeek, weekFeel, weekStart } from './weeks';

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
const day = (date: string, fitness: number, form: number | null): [string, TrainingDay] => [
  date,
  { date, load: 0, fitness, fatigue: fitness, form },
];

describe('weekStart', () => {
  it('finds the Monday on or before a day', () => {
    expect(weekStart('2026-11-26')).toBe('2026-11-23'); // Thursday
    expect(weekStart('2026-11-23')).toBe('2026-11-23'); // Monday
    expect(weekStart('2026-11-29')).toBe('2026-11-23'); // Sunday
    expect(weekStart('2026-03-01')).toBe('2026-02-23'); // across a month
  });
});

describe('groupByWeek', () => {
  const all = [
    act('run-tue', '2026-11-17T07:00:00', 'run', 10, 3000, 150),
    act('walk-tue', '2026-11-17T18:00:00', 'other', 2, 1500),
    act('ride-sun', '2026-11-22T10:00:00', 'ride', 40, 4800, 135),
    act('run-today', '2026-11-25T07:00:00', 'run', 8, 2700, 140),
    act('old-run', '2026-10-28T07:00:00', 'run', 6, 2000, 138),
  ];
  const training = new Map([day('2026-11-22', 40, -12), day('2026-11-25', 42, 8), day('2026-11-01', 30, 2)]);
  const base = { all, athlete, asOf: '2026-11-25', training };

  it('lists this week first, back to the oldest week with an activity, skipping empty weeks', () => {
    const weeks = groupByWeek({ ...base, shown: all });
    expect(weeks.map((w) => w.start)).toEqual(['2026-11-23', '2026-11-16', '2026-10-26']);
    expect(weeks[0]!.days.map((d) => d.ahead)).toEqual([false, false, false, true, true, true, true]);
    expect(weeks[1]!.days[1]!.activities.map((a) => a.id)).toEqual(['run-tue', 'walk-tue']);
  });

  it('totals what the filter shows, but counts load from every activity', () => {
    const runs = all.filter((a) => a.sport === 'run');
    const week = groupByWeek({ ...base, shown: runs })[1]!;
    expect(week.distance).toBe(10000);
    const everything = all.slice(0, 3).reduce((sum, a) => sum + activityLoad(a, athlete), 0);
    expect(week.load).toBeCloseTo(everything);
  });

  it('takes form on Sunday for past weeks and today for this one, and words only finished weeks', () => {
    const [now, last] = groupByWeek({ ...base, shown: all });
    expect(now).toMatchObject({ current: true, zone: 'fresh', feel: null });
    expect(last).toMatchObject({ current: false, zone: 'optimal' });
    expect(last!.feel).toBe(weekFeel(last!.load / 7, 40));
  });

  it('keeps this week even when nothing in it is shown, and averages the week\'s sleep', () => {
    const weeks = groupByWeek({
      ...base,
      shown: [all[4]!],
      sleep: [
        { date: '2026-11-24', minutes: 400, score: 80 },
        { date: '2026-11-25', minutes: 460, score: null },
      ],
    });
    expect(weeks.map((w) => w.start)).toEqual(['2026-11-23', '2026-10-26']);
    expect(weeks[0]!.sleep).toBe(430);
    expect(weeks[1]!.sleep).toBeNull();
  });

  it('runs on the sample, with every week Monday to Sunday', () => {
    const weeks = groupByWeek({
      shown: SAMPLE.activities,
      all: SAMPLE.activities,
      athlete: SAMPLE.athlete,
      asOf: SAMPLE.asOf,
      training: trainingByDay(SAMPLE),
    });
    expect(weeks[0]!.start).toBe('2026-11-23');
    for (const w of weeks) expect(w.days).toHaveLength(7);
    expect(weeks.slice(1).every((w) => w.feel !== null)).toBe(true);
  });
});

describe('weekFeel', () => {
  it('reads a week against fitness like the Fatigue tile', () => {
    expect(weekFeel(30, 40)).toBe('easy');
    expect(weekFeel(40, 40)).toBe('steady');
    expect(weekFeel(50, 40)).toBe('hard');
  });
});
