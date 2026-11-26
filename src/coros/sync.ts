/**
 * Fetching activities from COROS. COROS returns at most 100 records per call,
 * newest first, for a date range, so history is fetched in windows: about a
 * year back on the first sync, then from the last stored activity on. A
 * window that comes back full is split in half until every record fits.
 *
 * The COROS calls come in through `CorosSource`, so this is tested without the network.
 */
import { addDays, dayOf, daysBetween } from '../lib/days';
import type { Activity, DayKey } from '../domain/types';

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

/** First day to fetch: a year and a bit back, or a few days before the newest stored activity. */
export function syncFrom(stored: readonly Activity[], today: DayKey): DayKey {
  const historyStart = addDays(today, -(HISTORY_DAYS - 1));
  let newest: DayKey | null = null;
  for (const a of stored) if (!newest || dayOf(a.start) > newest) newest = dayOf(a.start);
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
