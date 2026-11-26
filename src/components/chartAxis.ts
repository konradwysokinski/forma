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

export function barWidth(n: number, width: number) {
  const step = (width - AXIS_LEFT - AXIS_RIGHT) / Math.max(1, n - 1);
  return Math.min(6, Math.max(1, step * 0.6));
}

/** Labels under the chart: months for 3 months and a year, a date a week for 6 weeks. */
export function timeLabels(days: readonly TrainingDay[], period: Period, f: Format) {
  const n = days.length;
  if (period === '6w') {
    const labels = [];
    for (let i = n - 1; i >= 0; i -= 7) labels.unshift({ i, label: f.dayMonth(dateOf(days[i]!.date)) });
    return labels;
  }
  return days.flatMap((d, i) =>
    d.date.endsWith('-01') && i < n - 4 ? [{ i, label: f.monthShort(dateOf(d.date)) }] : [],
  );
}

/** A round step for value gridlines, about five lines up to max. */
export function niceStep(max: number) {
  const raw = max / 5;
  const steps = [5, 10, 20, 25, 40, 50, 100];
  return steps.find((s) => s >= raw) ?? Math.ceil(raw / 100) * 100;
}
