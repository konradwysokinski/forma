import { describe, expect, it } from 'vitest';
import { addDays, dayOf } from '../lib/days';
import type { Activity } from '../domain/types';
import type { SleepNight } from '../domain/types';
import { CorosFormatError } from './parse';
import { ELEVATION_BATCH, elevationTodo, HISTORY_DAYS, merge, needsSync, syncElevation, withElevation, PAGE_LIMIT, RESYNC_AFTER_MS, syncActivities, syncFrom, syncSleep, windows, type CorosSource, type DateWindow } from './sync';

const run = (id: string, day: string): Activity => ({
  id,
  name: 'Run',
  sport: 'run',
  start: `${day}T07:00:00`,
  distance: 8000,
  movingTime: 2700,
  elevationGain: 0,
  sportCode: 100,
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
    async sleep() {
      return [];
    },
    async elevation() {
      return 0;
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

describe('syncSleep', () => {
  const night = (date: string, minutes = 420, score: number | null = 80): SleepNight => ({ date, minutes, score });

  function fakeSleep(all: SleepNight[]) {
    const calls: DateWindow[] = [];
    const source: CorosSource = {
      async activities() {
        return [];
      },
      async sleep(w) {
        calls.push(w);
        return all.filter((n) => n.date >= w.from && n.date <= w.to);
      },
      async elevation() {
        return 0;
      },
    };
    return { source, calls };
  }

  it('fetches the whole history in one call the first time', async () => {
    const { source, calls } = fakeSleep([night('2025-01-01'), night('2026-11-01'), night('2026-11-25')]);
    const out = await syncSleep(source, [], '2026-11-26');
    expect(calls).toEqual([{ from: addDays('2026-11-26', -(HISTORY_DAYS - 1)), to: '2026-11-26' }]);
    expect(out.map((n) => n.date)).toEqual(['2026-11-01', '2026-11-25']);
  });

  it('re-fetches from a few days before the newest night and replaces those days', async () => {
    const stored = [night('2026-11-10'), night('2026-11-22', 400, null), night('2026-11-23')];
    // COROS now has a score for the 22nd and no longer has the 23rd.
    const { source, calls } = fakeSleep([night('2026-11-10'), night('2026-11-22', 400, 77), night('2026-11-26')]);
    const out = await syncSleep(source, stored, '2026-11-26');
    expect(calls).toEqual([{ from: '2026-11-20', to: '2026-11-26' }]);
    expect(out).toEqual([night('2026-11-10'), night('2026-11-22', 400, 77), night('2026-11-26')]);
  });
});

describe('needsSync', () => {
  const now = Date.UTC(2026, 10, 26, 12);

  it('waits an hour between syncs', () => {
    expect(needsSync({ lastSync: now - 10 * 60_000, sleep: [], elevation: {} }, now)).toBe(false);
    expect(needsSync({ lastSync: now - RESYNC_AFTER_MS - 1, sleep: [], elevation: {} }, now)).toBe(true);
  });

  it('syncs at once data saved before Forma read sleep', () => {
    expect(needsSync({ lastSync: now - 60_000 }, now)).toBe(true);
  });
});

describe('elevation', () => {
  const coded = (id: string, day: string, sportCode: number): Activity => ({ ...run(id, day), sportCode, sport: sportCode < 200 ? 'run' : 'other' });
  const acts = [
    coded('road', '2026-11-20', 100),
    coded('trail', '2026-11-22', 102),
    coded('indoor', '2026-11-23', 101),
    coded('hike', '2026-11-24', 104),
    coded('track', '2026-11-25', 103),
    { ...run('old', '2026-11-19'), sportCode: undefined },
  ];

  function elevationSource(answer: (id: string) => number | null | Error) {
    const asked: string[] = [];
    const source: CorosSource = {
      activities: async () => [],
      sleep: async () => [],
      async elevation({ id }) {
        asked.push(id);
        const a = answer(id);
        if (a instanceof Error) throw a;
        return a;
      },
    };
    return { source, asked };
  }

  it('asks only for outdoor, trail and track runs not known yet, newest first', () => {
    expect(elevationTodo(acts, { road: 40 }).map((a) => a.id)).toEqual(['track', 'trail']);
  });

  it('fetches what is missing and hands it over to be saved', async () => {
    const { source, asked } = elevationSource((id) => (id === 'trail' ? 640 : 30));
    const batches: Record<string, number>[] = [];
    const all = await syncElevation(source, acts, { road: 40 }, { onBatch: (b) => void batches.push(b), pauseMs: 0 });
    expect(asked).toEqual(['track', 'trail']);
    expect(all).toEqual({ road: 40, track: 30, trail: 640 });
    expect(batches).toEqual([all]);
  });

  it('saves every batch, so a closed tab carries on where it stopped', async () => {
    const many = Array.from({ length: ELEVATION_BATCH * 2 + 3 }, (_, i) => coded(`r${i}`, addDays('2026-01-01', i), 100));
    const { source } = elevationSource(() => 10);
    const sizes: number[] = [];
    const progress: number[] = [];
    await syncElevation(source, many, {}, { onBatch: (b) => void sizes.push(Object.keys(b).length), onProgress: (d) => progress.push(d), pauseMs: 0 });
    expect(sizes).toEqual([ELEVATION_BATCH, ELEVATION_BATCH * 2, many.length]);
    expect(progress.at(-1)).toBe(many.length);
  });

  it('skips a run still in progress, to ask again next time', async () => {
    const { source } = elevationSource((id) => (id === 'track' ? null : 100));
    expect(await syncElevation(source, acts, {}, { onBatch: () => {}, pauseMs: 0 })).toEqual({ trail: 100, road: 100 });
  });

  it('skips an unreadable reply, but stops after a few in a row', async () => {
    const one = elevationSource((id) => (id === 'trail' ? new CorosFormatError('x') : 5));
    expect(await syncElevation(one.source, acts, {}, { onBatch: () => {}, pauseMs: 0 })).toEqual({ track: 5, road: 5 });
    const all = elevationSource(() => new CorosFormatError('x'));
    await expect(syncElevation(all.source, acts, {}, { onBatch: () => {}, pauseMs: 0 })).rejects.toThrow(CorosFormatError);
  });

  it('stops on a network error, keeping what it already fetched', async () => {
    const { source } = elevationSource((id) => (id === 'trail' ? new Error('offline') : 70));
    const saved: Record<string, number>[] = [];
    await expect(syncElevation(source, acts, {}, { onBatch: (b) => void saved.push(b), pauseMs: 0 })).rejects.toThrow('offline');
    expect(saved).toEqual([{ track: 70 }]);
  });

  it('fills known elevation into the activities', () => {
    expect(withElevation(acts, { trail: 640 }).find((a) => a.id === 'trail')?.elevationGain).toBe(640);
    expect(withElevation(acts, undefined)[0]?.elevationGain).toBe(0);
  });

  it('re-fetches the whole history once when stored runs have no sport code', () => {
    const today = '2026-11-26';
    const { sportCode: _, ...uncoded } = run('a', '2026-11-20');
    expect(syncFrom([uncoded], today)).toBe(addDays(today, -(HISTORY_DAYS - 1)));
    expect(syncFrom([coded('a', '2026-11-20', 100)], today)).toBe('2026-11-17');
  });

  it('syncs at once when stored data has no elevation yet', () => {
    expect(needsSync({ lastSync: 0, sleep: [] }, 1)).toBe(true);
    expect(needsSync({ lastSync: 0, sleep: [], elevation: {} }, 1)).toBe(false);
  });
});
