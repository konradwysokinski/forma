import type { DayKey } from '../domain/types';

/** Calendar-day arithmetic on "YYYY-MM-DD" keys, done in UTC so daylight saving never shifts a day. */
const MS_PER_DAY = 86_400_000;

const toUtc = (key: DayKey) => Date.UTC(+key.slice(0, 4), +key.slice(5, 7) - 1, +key.slice(8, 10));
const fromUtc = (ms: number): DayKey => new Date(ms).toISOString().slice(0, 10);

export const dayOf = (localDateTime: string): DayKey => localDateTime.slice(0, 10);
export const addDays = (key: DayKey, n: number): DayKey => fromUtc(toUtc(key) + n * MS_PER_DAY);
export const daysBetween = (from: DayKey, to: DayKey) => Math.round((toUtc(to) - toUtc(from)) / MS_PER_DAY);

/** The day's date at local noon, safe for Intl formatting. */
export const dateOf = (key: DayKey) => new Date(+key.slice(0, 4), +key.slice(5, 7) - 1, +key.slice(8, 10), 12);

/** Today in the browser's time zone. */
export function todayKey(now = new Date()): DayKey {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** "2026-11" */
export const monthOf = (key: DayKey) => key.slice(0, 7);

/** The month key n months before (or after, n > 0) the given one. */
export function addMonths(month: string, n: number): string {
  const total = +month.slice(0, 4) * 12 + (+month.slice(5, 7) - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}
