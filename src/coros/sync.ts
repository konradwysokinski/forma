/**
 * Fetching activities from COROS. COROS returns at most 100 records per call,
 * newest first, for a date range, so history is fetched in windows: about a
 * year back on the first sync, then from the last stored activity on. A
 * window that comes back full is split in half until every record fits.
 *
 * The COROS calls come in through `CorosSource`, so this is tested without the network.
 */
import { addDays, dayOf, daysBetween } from '../lib/days';
import type { Activity, DayKey, SleepNight } from '../domain/types';
import { CorosFormatError } from './parse';

/** COROS's cap on records per call. */
export const PAGE_LIMIT = 100;
/** Days fetched on the first sync. Fitness needs 42 days to settle, the Year chart 365 more. */
export const HISTORY_DAYS = 420;
/** Days per call; a month of training fits comfortably under the cap. */
export const WINDOW_DAYS = 31;
/** Days re-fetched before the last stored activity, for activities synced to COROS late. */
export const OVERLAP_DAYS = 3;

export interface DateWindow {
  from: DayKey;
  to: DayKey;
}

export interface CorosSource {
  /** Activities that started between `from` and `to`, both inclusive, at most PAGE_LIMIT. */
  activities(window: DateWindow): Promise<Activity[]>;
  /** Nights with sleep whose wake-up day is between `from` and `to`; COROS has no cap here. */
  sleep(window: DateWindow): Promise<SleepNight[]>;
  /** One activity's metres climbed; null while it is still in progress. One request each. */
  elevation(activity: { id: string; sportCode: number }): Promise<number | null>;
}

/** Windows of `size` days covering `from`–`to`, newest first. */
export function windows(from: DayKey, to: DayKey, size = WINDOW_DAYS): DateWindow[] {
  const out: DateWindow[] = [];
  for (let end = to; end >= from; end = addDays(end, -size)) {
    const start = addDays(end, -(size - 1));
    out.push({ from: start < from ? from : start, to: end });
  }
  return out;
}

/**
 * First day to fetch: a year and a bit back, or a few days before the newest
 * stored activity. Also the whole history once when stored runs lack their
 * sport code (saved before Forma read elevation), since asking COROS for a
 * run's details needs it.
 */
export function syncFrom(stored: readonly Activity[], today: DayKey): DayKey {
  const historyStart = addDays(today, -(HISTORY_DAYS - 1));
  let newest: DayKey | null = null;
  for (const a of stored) {
    const day = dayOf(a.start);
    if (a.sport === 'run' && a.sportCode === undefined && day >= historyStart) return historyStart;
    if (!newest || day > newest) newest = day;
  }
  if (!newest) return historyStart;
  const from = addDays(newest, -OVERLAP_DAYS);
  return from < historyStart ? historyStart : from > today ? today : from;
}

/** One window, split in halves while COROS returns a full page. */
async function fetchWindow(source: CorosSource, window: DateWindow): Promise<Activity[]> {
  const found = await source.activities(window);
  if (found.length < PAGE_LIMIT) return found;
  const days = daysBetween(window.from, window.to) + 1;
  if (days === 1) {
    throw new Error(`COROS returned ${PAGE_LIMIT} activities for ${window.from}; Forma can't read more than that for one day.`);
  }
  const mid = addDays(window.from, Math.floor(days / 2) - 1);
  const newer = await fetchWindow(source, { from: addDays(mid, 1), to: window.to });
  const older = await fetchWindow(source, { from: window.from, to: mid });
  return [...newer, ...older];
}

/**
 * Stored activities before `from`, then the fresh ones, one per id, oldest
 * first. The fetched days come from COROS alone, so an activity deleted
 * there disappears here too.
 */
export function merge(stored: readonly Activity[], fresh: readonly Activity[], from: DayKey): Activity[] {
  const byId = new Map(stored.filter((a) => dayOf(a.start) < from).map((a) => [a.id, a]));
  for (const a of fresh) byId.set(a.id, a);
  return [...byId.values()].sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
}

/**
 * Brings `stored` up to date. `onProgress` gets the share done, 0–1, after
 * every window, so the first, longer sync can show how far it has got.
 */
export async function syncActivities(
  source: CorosSource,
  stored: readonly Activity[],
  today: DayKey,
  onProgress?: (done: number) => void,
): Promise<Activity[]> {
  const from = syncFrom(stored, today);
  const todo = windows(from, today);
  const fresh: Activity[] = [];
  for (const [i, w] of todo.entries()) {
    fresh.push(...(await fetchWindow(source, w)));
    onProgress?.((i + 1) / todo.length);
  }
  return merge(stored, fresh, from);
}

/**
 * Brings stored sleep up to date in one call: the whole history the first
 * time (COROS returns every day of a 420-day range at once), then from a few
 * days before the newest stored night, since a night's score can arrive
 * late. Fetched days replace stored ones.
 */
export async function syncSleep(source: CorosSource, stored: readonly SleepNight[], today: DayKey): Promise<SleepNight[]> {
  const historyStart = addDays(today, -(HISTORY_DAYS - 1));
  const newest = stored.at(-1)?.date;
  const back = newest ? addDays(newest, -OVERLAP_DAYS) : historyStart;
  const from = back < historyStart ? historyStart : back > today ? today : back;
  const fresh = await source.sleep({ from, to: today });
  const byDay = new Map(stored.filter((n) => n.date < from).map((n) => [n.date, n]));
  for (const n of fresh) if (n.date >= from && n.date <= today) byDay.set(n.date, n);
  return [...byDay.values()].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** Data older than this is refreshed when Forma opens or comes back into view. */
export const RESYNC_AFTER_MS = 60 * 60 * 1000;

/**
 * Whether stored COROS data should be synced now: when it is over an hour
 * old, or when it was saved before Forma read sleep, so an update brings
 * sleep on the first open instead of an hour later.
 */
export function needsSync(stored: { lastSync: number; sleep?: unknown; elevation?: unknown }, now: number): boolean {
  return stored.sleep === undefined || stored.elevation === undefined || now - stored.lastSync > RESYNC_AFTER_MS;
}

/**
 * COROS codes whose elevation Forma fetches: run, trail run, track run.
 * Indoor runs (101) are left out: a treadmill's ascent is its incline or noise.
 */
export const ELEVATION_CODES: ReadonlySet<number> = new Set([100, 102, 103]);
/** Pause between two detail requests, to go gently on COROS (its limits aren't published). */
export const ELEVATION_PAUSE_MS = 1000;
/** Fetched elevations are handed over (to be saved) after this many, so a closed tab loses little. */
export const ELEVATION_BATCH = 10;
/** Format errors in a row after which the run stops: COROS has probably changed its text. */
const MAX_FORMAT_ERRORS = 3;

/** Metres climbed per activity id; 0 when COROS lists none. */
export type ElevationMap = Record<string, number>;

/** Runs whose elevation isn't known yet, newest first, so recent weeks fill in first. */
export function elevationTodo(activities: readonly Activity[], known: ElevationMap): (Activity & { sportCode: number })[] {
  return activities
    .filter((a): a is Activity & { sportCode: number } => a.sportCode !== undefined && ELEVATION_CODES.has(a.sportCode) && !(a.id in known))
    .sort((a, b) => (a.start < b.start ? 1 : a.start > b.start ? -1 : 0));
}

/**
 * Fetches elevation for runs that don't have it, one request at a time with
 * a pause between them. `onBatch` gets everything known so far after every
 * ELEVATION_BATCH runs and at the end; `onProgress` how many of how many are
 * done. A run still in progress is skipped (asked again next sync); a reply
 * Forma can't read is skipped too, until a few in a row stop the run.
 * Network and sign-in errors stop it and are thrown.
 */
export async function syncElevation(
  source: CorosSource,
  activities: readonly Activity[],
  known: ElevationMap,
  options: {
    onBatch: (all: ElevationMap) => void | Promise<void>;
    onProgress?: (done: number, total: number) => void;
    pauseMs?: number;
    signal?: { cancelled: boolean };
  },
): Promise<ElevationMap> {
  const { onBatch, onProgress, pauseMs = ELEVATION_PAUSE_MS, signal } = options;
  const todo = elevationTodo(activities, known);
  const all: ElevationMap = { ...known };
  let unsaved = 0;
  let formatErrors = 0;
  for (const [i, activity] of todo.entries()) {
    if (signal?.cancelled) break;
    if (i > 0 && pauseMs > 0) await new Promise((r) => setTimeout(r, pauseMs));
    try {
      const gain = await source.elevation(activity);
      formatErrors = 0;
      if (gain !== null) {
        all[activity.id] = gain;
        unsaved++;
      }
    } catch (e) {
      if (!(e instanceof CorosFormatError) || ++formatErrors >= MAX_FORMAT_ERRORS) {
        if (unsaved) await onBatch({ ...all });
        throw e;
      }
    }
    onProgress?.(i + 1, todo.length);
    if (unsaved >= ELEVATION_BATCH) {
      await onBatch({ ...all });
      unsaved = 0;
    }
  }
  if (unsaved) await onBatch({ ...all });
  return all;
}

/** Activities with their known elevation filled in. */
export function withElevation(activities: readonly Activity[], known: ElevationMap | undefined): Activity[] {
  if (!known) return [...activities];
  return activities.map((a) => (a.id in known ? { ...a, elevationGain: known[a.id]! } : a));
}
