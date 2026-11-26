import type { Period } from '../domain/formSummary';
import type { TrainingDay } from '../domain/training';
import type { Format } from '../i18n';
import { dateOf } from '../lib/days';

/** Where the day bars start (room for the value labels on the left) and end. */
export const AXIS_LEFT = 44;
export const AXIS_RIGHT = 8;

/** x of day i of n, shared by both charts so their days line up. */
export function dayX(i: number, n: number, width: number) {
  return AXIS_LEFT + (n > 1 ? i / (n - 1) : 1) * (width - AXIS_LEFT - AXIS_RIGHT);
}

/** The day under a pointer at `px` from the chart's left edge. */
export function dayAt(px: number, n: number, width: number) {
  const share = (px - AXIS_LEFT) / Math.max(1, width - AXIS_LEFT - AXIS_RIGHT);
  return Math.min(n - 1, Math.max(0, Math.round(share * (n - 1))));
}

export function barWidth(n: number, width: number) {
  const step = (width - AXIS_LEFT - AXIS_RIGHT) / Math.max(1, n - 1);
  return Math.min(6, Math.max(1, step * 0.6));
}

/** Space a label needs, in px: "Sep" or "24 Nov" at 12px plus a gap. */
const LABEL_SPACE = { month: 34, date: 52 };

/**
 * Labels under the chart: months for 3 months and a year, a date a week for
 * 6 weeks. On narrow charts every second (third…) one is kept, counting back
 * from the newest, so they never run into each other.
 */
export function timeLabels(days: readonly TrainingDay[], period: Period, f: Format, width: number) {
  const n = days.length;
  const all: { i: number; label: string }[] = [];
  if (period === '6w') {
    for (let i = n - 1; i >= 0; i -= 7) all.unshift({ i, label: f.dayMonth(dateOf(days[i]!.date)) });
  } else {
    days.forEach((d, i) => {
      if (d.date.endsWith('-01') && i < n - 4) all.push({ i, label: f.monthShort(dateOf(d.date)) });
    });
  }
  if (all.length < 2) return all;
  const gap = dayX(all[1]!.i, n, width) - dayX(all[0]!.i, n, width);
  const every = Math.max(1, Math.ceil(LABEL_SPACE[period === '6w' ? 'date' : 'month'] / gap));
  return all.filter((_, k) => (all.length - 1 - k) % every === 0);
}

/** A round step for value gridlines, about five lines up to max. */
export function niceStep(max: number) {
  const raw = max / 5;
  const steps = [5, 10, 20, 25, 40, 50, 100];
  return steps.find((s) => s >= raw) ?? Math.ceil(raw / 100) * 100;
}
