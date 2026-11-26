import { describe, expect, it } from 'vitest';
import { averageSleep, sleepByDay, sleepLevel } from './sleep';
import type { SleepNight } from './types';

const night = (date: string, minutes: number, score: number | null = 80): SleepNight => ({ date, minutes, score });

describe('sleepByDay', () => {
  it('puts each night on its wake-up day and leaves gaps empty', () => {
    const days = [{ date: '2026-11-23' }, { date: '2026-11-24' }, { date: '2026-11-25' }];
    const nights = [night('2026-11-20', 400), night('2026-11-23', 420), night('2026-11-25', 380)];
    expect(sleepByDay(nights, days)).toEqual([nights[1], null, nights[2]]);
  });
});

describe('averageSleep', () => {
  it('averages only the nights there are', () => {
    expect(averageSleep([night('2026-11-23', 420), null, night('2026-11-25', 360)])).toBe(390);
  });

  it('is null without any night', () => {
    expect(averageSleep([null, null])).toBeNull();
    expect(averageSleep([])).toBeNull();
  });
});

describe('sleepLevel', () => {
  it('splits scores into three steps', () => {
    expect(sleepLevel(80)).toBe('good');
    expect(sleepLevel(79)).toBe('mid');
    expect(sleepLevel(65)).toBe('mid');
    expect(sleepLevel(64)).toBe('low');
  });

  it('draws a night without a score as the lightest step', () => {
    expect(sleepLevel(null)).toBe('low');
  });
});
