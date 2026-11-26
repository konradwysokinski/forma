import { describe, expect, it } from 'vitest';
import { SAMPLE } from '../data/sample';
import { easyHrByMonth } from './easyHr';
import { formSummary } from './formSummary';
import { records } from './records';
import type { Activity } from './types';

const run = (id: string, day: string, km: number, seconds: number, hr?: number): Activity => ({
  id,
  name: 'Run',
  sport: 'run',
  start: `${day}T07:00:00`,
  distance: km * 1000,
  movingTime: seconds,
  elevationGain: 0,
  ...(hr ? { averageHeartrate: hr } : {}),
});

describe('records', () => {
  it('takes the fastest whole run of each distance, scaled to it, and the longest run', () => {
    const r = records(
      [
        run('a', '2026-10-01', 5, 1400),
        run('b', '2026-11-20', 5.2, 1404), // 1350 s for 5 km: faster
        run('c', '2026-10-02', 5.5, 1300), // too long to count for 5 km
        run('d', '2026-10-03', 24, 8000),
      ],
      '2026-11-25',
    );
    expect(r['5k']).toMatchObject({ activityId: 'b', time: 1350, isNew: true });
    expect(r['10k']).toBeUndefined();
    expect(r.longest).toMatchObject({ activityId: 'd', distance: 24000, isNew: false });
  });

  it('keeps to the period and carries the run\'s heart rate', () => {
    const all = [run('a', '2026-06-01', 10, 2700, 160), run('b', '2026-11-01', 10, 3000, 150), run('m', '2026-10-01', 42.5, 12000)];
    const r = records(all, '2026-11-25', '2026-09-01');
    expect(r['10k']).toMatchObject({ activityId: 'b', time: 3000, heartRate: 150 });
    expect(r.marathon).toMatchObject({ activityId: 'm' });
    expect(r.marathon!.heartRate).toBeUndefined();
    expect(records(all, '2026-11-25')['10k']).toMatchObject({ activityId: 'a' });
  });

  it('ignores rides and future days', () => {
    const ride: Activity = { ...run('r', '2026-10-01', 50, 5000), sport: 'ride' };
    expect(records([ride, run('f', '2026-12-01', 5, 1200)], '2026-11-25')).toEqual({});
  });
});

describe('easyHrByMonth', () => {
  it('averages heart rate on easy-pace runs per month, weighted by time', () => {
    const months = easyHrByMonth(
      [
        run('a', '2026-11-02', 10, 3450, 140), // 5:45 /km
        run('b', '2026-11-05', 20, 6900, 146), // twice as long
        run('c', '2026-11-06', 10, 3000, 165), // 5:00 /km, too fast
        run('d', '2026-09-10', 10, 3450, 150),
      ],
      '2026-11-25',
      3,
    );
    expect(months).toEqual([
      { month: '2026-09', bpm: 150, runs: 1 },
      { month: '2026-10', bpm: null, runs: 0 },
      { month: '2026-11', bpm: 144, runs: 2 },
    ]);
  });
});

describe('formSummary on the sample', () => {
  const sum = formSummary(SAMPLE, '3m');

  it('reads Fresh after the easy week, as in the mockup', () => {
    expect(sum.zone).toBe('fresh');
    expect(sum.week).toBe('easy');
    expect(sum.trend!.change).toBeGreaterThan(1);
  });

  it('measures the fitness change and the good days over the chosen period', () => {
    expect(sum.fitnessChange).toBeCloseTo(sum.today.fitness - sum.days[0]!.fitness);
    const year = formSummary(SAMPLE, 'year');
    expect(year.fitnessChange).not.toBeCloseTo(sum.fitnessChange);
    expect(sum.goodDays.of).toBe(91);
    expect(sum.goodDays.count).toBeGreaterThan(0);
    expect(sum.goodDays.count).toBeLessThanOrEqual(91);
  });

  it('covers the period, ending today', () => {
    expect(sum.days).toHaveLength(91);
    expect(sum.days.at(-1)!.date).toBe('2026-11-25');
    expect(formSummary(SAMPLE, 'year').days).toHaveLength(365);
  });

  it('finds the four records and a lower easy-pace heart rate than in September', () => {
    expect(sum.records['5k']).toMatchObject({ time: 1308, date: '2026-11-09', isNew: true });
    expect(sum.records['10k']).toMatchObject({ time: 2772, date: '2026-09-14' });
    expect(sum.records.half).toMatchObject({ date: '2026-10-05' });
    expect(sum.records.longest).toMatchObject({ distance: 28400, date: '2026-10-26' });
    // All of history holds at least the period's records.
    expect(sum.recordsAll.longest!.distance!).toBeGreaterThanOrEqual(28400);
    expect(sum.historyFrom < sum.days[0]!.date).toBe(true);
    expect(sum.easyHrNow).toMatchObject({ bpm: 142, comparedMonth: '2026-09' });
    expect(sum.easyHrNow!.change).toBeLessThan(0);
  });
});
