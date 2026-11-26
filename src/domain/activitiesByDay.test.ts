import { describe, expect, it } from 'vitest';
import { activitiesByDay } from './activitiesByDay';
import type { Activity } from './types';

const act = (id: string, start: string): Activity => ({
  id,
  name: 'Run',
  sport: 'run',
  start,
  distance: 5000,
  movingTime: 1500,
  elevationGain: 0,
});

describe('activitiesByDay', () => {
  it('groups by local start day, in start order', () => {
    const byDay = activitiesByDay([
      act('evening', '2026-11-19T18:30:00'),
      act('late', '2026-11-18T23:59:00'),
      act('morning', '2026-11-19T06:10:00'),
    ]);
    expect(byDay.get('2026-11-19')!.map((a) => a.id)).toEqual(['morning', 'evening']);
    expect(byDay.get('2026-11-18')!.map((a) => a.id)).toEqual(['late']);
    expect(byDay.has('2026-11-20')).toBe(false);
  });
});
