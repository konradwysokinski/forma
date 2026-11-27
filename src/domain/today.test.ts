import { describe, expect, it } from 'vitest';
import { addDays } from '../lib/days';
import { loadSignal, restHrSignal, sleepSignal, today, variantOf, type TodayInput } from './today';
import type { RestingHrDay, SleepNight } from './types';

const AS_OF = '2026-11-25';

/** `count` mornings before AS_OF at `bpm`, then this morning at `todayBpm`. */
const rest = (bpm: number, todayBpm: number | null, count = 14): RestingHrDay[] => [
  ...Array.from({ length: count }, (_, i) => ({ date: addDays(AS_OF, -(count - i)), bpm })),
  ...(todayBpm === null ? [] : [{ date: AS_OF, bpm: todayBpm }]),
];

/** `count` nights before AS_OF of `minutes`, then last night of `last`. */
const nights = (minutes: number, last: number | null, count = 14): SleepNight[] => [
  ...Array.from({ length: count }, (_, i) => ({ date: addDays(AS_OF, -(count - i)), minutes, score: 80 })),
  ...(last === null ? [] : [{ date: AS_OF, minutes: last, score: 80 }]),
];

/** Fitness 50: a usual week is 350. */
const base: TodayInput = { asOf: AS_OF, form: 10, zone: 'fresh', fitness: 50, load7: 300 };

describe('today', () => {
  it('is a day for a harder session when fresh, with a normal week and nothing poor', () => {
    const t = today({ ...base, sleep: nights(450, 460), restingHr: rest(48, 48) });
    expect(t.verdict).toBe('harder');
    expect(t.signals.map((s) => s.id)).toEqual(['form', 'load', 'restHr', 'sleep']);
  });

  it('counts Grey zone and Transition as rested', () => {
    expect(today({ ...base, form: 0, zone: 'grey' }).verdict).toBe('harder');
    expect(today({ ...base, form: 25, zone: 'transition' }).verdict).toBe('harder');
  });

  it('keeps it easy in Optimal', () => {
    expect(today({ ...base, form: -18, zone: 'optimal' }).verdict).toBe('easy');
  });

  it('keeps it easy when fresh but the week was heavy', () => {
    expect(today({ ...base, load7: 500 }).verdict).toBe('easy');
  });

  it('keeps it easy when fresh but one signal is poor', () => {
    expect(today({ ...base, restingHr: rest(48, 54) }).verdict).toBe('easy');
  });

  it('is a rest day in High risk', () => {
    expect(today({ ...base, form: -35, zone: 'risk' }).verdict).toBe('rest');
  });

  it('is a rest day with two poor signals', () => {
    expect(today({ ...base, form: -18, zone: 'optimal', restingHr: rest(48, 55), sleep: nights(450, 320) }).verdict).toBe(
      'rest',
    );
  });

  it('is a rest day after a poor night in a heavy week', () => {
    expect(today({ ...base, form: -18, zone: 'optimal', load7: 500, sleep: nights(450, 330) }).verdict).toBe('rest');
  });

  it('is easy, never harder, before form has a figure', () => {
    const t = today({ ...base, form: null, zone: null, load7: 0, fitness: 0 });
    expect(t).toEqual({ verdict: 'easy', signals: [] });
  });

  it('leaves out sleep and resting heart rate without data', () => {
    const t = today({ ...base, sleep: [], restingHr: [] });
    expect(t.signals.map((s) => s.id)).toEqual(['form', 'load']);
  });
});

describe('loadSignal', () => {
  it('compares the week with fitness × 7', () => {
    expect(loadSignal(200, 50)).toMatchObject({ level: 'low', rating: 'good', usual: 350 });
    expect(loadSignal(350, 50)).toMatchObject({ level: 'normal', rating: 'neutral' });
    expect(loadSignal(470, 50)).toMatchObject({ level: 'high', rating: 'poor' });
  });

  it('says nothing without fitness to compare with', () => {
    expect(loadSignal(40, 0)).toBeNull();
  });
});

describe('restHrSignal', () => {
  it('rates this morning against the days before', () => {
    expect(restHrSignal(rest(48, 49), AS_OF)).toMatchObject({ rating: 'good', bpm: 49, average: 48, change: 1 });
    expect(restHrSignal(rest(48, 51), AS_OF)).toMatchObject({ rating: 'neutral' });
    expect(restHrSignal(rest(48, 53), AS_OF)).toMatchObject({ rating: 'poor', change: 5 });
  });

  it('needs this morning and a few days before it', () => {
    expect(restHrSignal(rest(48, null), AS_OF)).toBeNull();
    expect(restHrSignal(rest(48, 50, 3), AS_OF)).toBeNull();
  });
});

describe('sleepSignal', () => {
  it('is good from 7 hours, fair from 6, poor under 6', () => {
    expect(sleepSignal(nights(440, 440), AS_OF)).toMatchObject({ rating: 'good', change: 0 });
    expect(sleepSignal(nights(400, 400), AS_OF)).toMatchObject({ rating: 'neutral' });
    expect(sleepSignal(nights(340, 340), AS_OF)).toMatchObject({ rating: 'poor' });
  });

  it('marks a clear drop against the usual', () => {
    expect(sleepSignal(nights(540, 480), AS_OF)).toMatchObject({ rating: 'neutral', change: -60 });
    expect(sleepSignal(nights(540, 440), AS_OF)).toMatchObject({ rating: 'poor', change: -100 });
  });

  it('rates the hours alone without nights to compare with', () => {
    expect(sleepSignal(nights(540, 440, 2), AS_OF)).toMatchObject({ rating: 'good', average: null, change: null });
  });

  it('needs last night', () => {
    expect(sleepSignal(nights(450, null), AS_OF)).toBeNull();
  });
});

describe('variantOf', () => {
  it('picks the same variant for the same day', () => {
    expect(variantOf(AS_OF, 3)).toBe(variantOf(AS_OF, 3));
    expect(variantOf(AS_OF, 3)).toBeLessThan(3);
  });

  it('moves to the next variant the next day', () => {
    expect(variantOf(addDays(AS_OF, 1), 6)).toBe((variantOf(AS_OF, 6) + 1) % 6);
  });
});
