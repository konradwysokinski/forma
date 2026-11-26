import { describe, expect, it } from 'vitest';
import { activityLoad, dailyLoads, estimateAthlete, trimp } from './load';
import { trainingDays, zoneOf } from './training';
import type { Activity } from './types';

const athlete = { maxHr: 190, restHr: 50 };
const run = (start: string, minutes: number, hr?: number): Activity => ({
  id: start,
  name: 'Run',
  sport: 'run',
  start: `${start}T07:00:00`,
  distance: minutes * 180,
  movingTime: minutes * 60,
  elevationGain: 0,
  ...(hr ? { averageHeartrate: hr } : {}),
});

describe('trimp', () => {
  it('follows Banister: an hour at 70% heart-rate reserve is about 103', () => {
    // 60 × 0.7 × 0.64 × e^(1.92 × 0.7) ≈ 102.6
    expect(trimp(3600, 50 + 0.7 * 140, athlete)).toBeCloseTo(102.6, 0);
  });

  it('grows with time and with heart rate', () => {
    expect(trimp(7200, 150, athlete)).toBeCloseTo(2 * trimp(3600, 150, athlete));
    expect(trimp(3600, 170, athlete)).toBeGreaterThan(trimp(3600, 150, athlete));
  });

  it('uses the women’s constants when set', () => {
    expect(trimp(3600, 150, { ...athlete, sex: 'female' })).not.toBeCloseTo(trimp(3600, 150, athlete));
  });

  it('counts an activity without heart rate as easy effort', () => {
    const easy = activityLoad(run('2026-11-01', 60), athlete);
    expect(easy).toBeCloseTo(trimp(3600, 50 + 0.55 * 140, athlete));
  });
});

describe('dailyLoads', () => {
  it('sums activities per day and leaves rest days at zero', () => {
    const loads = dailyLoads(
      [run('2026-11-01', 30, 140), run('2026-11-01', 30, 140), run('2026-11-03', 60, 140)],
      athlete,
      '2026-11-01',
      '2026-11-04',
    );
    expect(loads).toHaveLength(4);
    expect(loads[0]).toBeCloseTo(loads[2]!);
    expect(loads[1]).toBe(0);
    expect(loads[3]).toBe(0);
  });
});

describe('trainingDays', () => {
  it('moves fitness by 1/42 and fatigue by 1/7 of the gap each day', () => {
    const [day] = trainingDays([42], '2026-11-01', 0);
    expect(day!.fitness).toBeCloseTo(1);
    expect(day!.fatigue).toBeCloseTo(6);
  });

  it('settles at a steady load, with form near zero', () => {
    const days = trainingDays(new Array(400).fill(50), '2026-01-01');
    const last = days.at(-1)!;
    expect(last.fitness).toBeCloseTo(50, 0);
    expect(last.fatigue).toBeCloseTo(50, 0);
    expect(Math.abs(last.form!)).toBeLessThan(1);
  });

  it("takes form from yesterday's values, so today's run doesn't change it", () => {
    const loads = new Array(100).fill(50);
    const rested = trainingDays([...loads, 0], '2026-01-01').at(-1)!;
    const hard = trainingDays([...loads, 300], '2026-01-01').at(-1)!;
    expect(hard.form).toBeCloseTo(rested.form!);
    expect(hard.fatigue).toBeGreaterThan(rested.fatigue);
  });

  it('shows no form in the first week, or without fitness to divide by', () => {
    expect(trainingDays(new Array(10).fill(50), '2026-01-01').map((d) => d.form === null)).toEqual([
      true, true, true, true, true, true, true, false, false, false,
    ]);
    expect(trainingDays(new Array(10).fill(0), '2026-01-01').every((d) => d.form === null)).toBe(true);
  });

  it('starts from the first six weeks’ average load, so history doesn’t open in high risk', () => {
    const days = trainingDays(new Array(60).fill(50), '2026-01-01');
    expect(days[0]!.fitness).toBeCloseTo(50);
    expect(Math.abs(days[10]!.form!)).toBeLessThan(1);
  });

  it('turns fresh after rest and negative after a hard block', () => {
    const base = new Array(120).fill(50);
    expect(trainingDays([...base, ...new Array(7).fill(0)], '2026-01-01').at(-1)!.form).toBeGreaterThan(5);
    expect(trainingDays([...base, ...new Array(7).fill(120)], '2026-01-01').at(-1)!.form).toBeLessThan(-30);
  });
});

describe('zoneOf', () => {
  it.each([
    [25, 'transition'],
    [20, 'fresh'],
    [12, 'fresh'],
    [5, 'grey'],
    [0, 'grey'],
    [-10, 'optimal'],
    [-20, 'optimal'],
    [-30, 'risk'],
    [-45, 'risk'],
  ])('%d%% is %s', (pct, zone) => {
    expect(zoneOf(pct)).toBe(zone);
  });
});

describe('estimateAthlete', () => {
  it('reads max heart rate from the hardest average, within sane bounds', () => {
    expect(estimateAthlete([run('2026-11-01', 20, 175)]).maxHr).toBe(190);
    expect(estimateAthlete([]).maxHr).toBe(190);
    expect(estimateAthlete([run('2026-11-01', 20, 120)]).maxHr).toBe(170);
  });
});
