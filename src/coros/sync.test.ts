import { describe, expect, it } from 'vitest';
import { addDays, dayOf } from '../lib/days';
import type { Activity } from '../domain/types';
import { HISTORY_DAYS, merge, PAGE_LIMIT, syncActivities, syncFrom, windows, type CorosSource, type DateWindow } from './sync';

const run = (id: string, day: string): Activity => ({
  id,
  name: 'Run',
  sport: 'run',
  start: `${day}T07:00:00`,
  distance: 8000,
  movingTime: 2700,
  elevationGain: 0,
});

/** A fake COROS holding `all`, answering like the real one: newest first, capped at PAGE_LIMIT. */
function fakeSource(all: Activity[]) {
  const calls: DateWindow[] = [];
  const source: CorosSource = {
    async activities(w) {
      calls.push(w);
      return all
        .filter((a) => dayOf(a.start) >= w.from && dayOf(a.start) <= w.to)
        .sort((a, b) => (a.start < b.start ? 1 : -1))
        .slice(0, PAGE_LIMIT);
    },
  };
  return { source, calls };
}

describe('windows', () => {
  it('covers the range newest first without gaps or overlap', () => {
    expect(windows('2026-10-01', '2026-11-26', 31)).toEqual([
      { from: '2026-10-27', to: '2026-11-26' },
      { from: '2026-10-01', to: '2026-10-26' },
    ]);
  });

  it('is one window for a single day', () => {
    expect(windows('2026-11-26', '2026-11-26')).toEqual([{ from: '2026-11-26', to: '2026-11-26' }]);
  });
});

describe('syncFrom', () => {
  it('goes a year and a bit back when nothing is stored', () => {
    expect(syncFrom([], '2026-11-26')).toBe(addDays('2026-11-26', -(HISTORY_DAYS - 1)));
  });

  it('starts a few days before the newest stored activity', () => {
    expect(syncFrom([run('a', '2026-11-01'), run('b', '2026-11-20')], '2026-11-26')).toBe('2026-11-17');
  });
});

describe('merge', () => {
  it('keeps older stored activities and takes re-fetched days from COROS', () => {
    const stored = [run('old', '2026-11-01'), run('gone', '2026-11-20'), run('same', '2026-11-21')];
    const fresh = [run('same', '2026-11-21'), run('new', '2026-11-25')];
    expect(merge(stored, fresh, '2026-11-17').map((a) => a.id)).toEqual(['old', 'same', 'new']);
  });
});

describe('syncActivities', () => {
  it('fetches the whole history on the first sync', async () => {
    const all = [run('a', '2026-01-10'), run('b', '2026-06-01'), run('c', '2026-11-26')];
    const { source, calls } = fakeSource(all);
    const progress: number[] = [];
    const got = await syncActivities(source, [], '2026-11-26', (p) => progress.push(p));
    expect(got.map((a) => a.id)).toEqual(['a', 'b', 'c']);
    expect(calls).toHaveLength(Math.ceil(HISTORY_DAYS / 31));
    expect(progress.at(-1)).toBe(1);
  });

  it('splits a window COROS returns full', async () => {
    // 150 activities in five days: one call can't hold them.
    const all = Array.from({ length: 150 }, (_, i) => run(`r${i}`, addDays('2026-11-22', i % 5)));
    const { source } = fakeSource(all);
    const got = await syncActivities(source, [run('x', '2026-11-25')], '2026-11-26');
    expect(got).toHaveLength(150);
  });

  it('only asks for recent days once history is stored', async () => {
    const { source, calls } = fakeSource([run('new', '2026-11-26')]);
    const got = await syncActivities(source, [run('old', '2026-11-24')], '2026-11-26');
    expect(calls).toEqual([{ from: '2026-11-21', to: '2026-11-26' }]);
    expect(got.map((a) => a.id)).toEqual(['new']);
  });

  it('stops with a clear error when one day holds more than a page', async () => {
    const all = Array.from({ length: PAGE_LIMIT }, (_, i) => run(`r${i}`, '2026-11-26'));
    const { source } = fakeSource(all);
    await expect(syncActivities(source, [run('x', '2026-11-25')], '2026-11-26')).rejects.toThrow(/one day/);
  });
});
