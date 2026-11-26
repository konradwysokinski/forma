/** Everything the Form screen shows, computed from the activities in one pass. */
import { addDays, addMonths, monthOf } from '../lib/days';
import { easyHrByMonth, type EasyHrMonth } from './easyHr';
import { dailyLoads, firstDay } from './load';
import { records, type RecordId, type RunRecord } from './records';
import { FITNESS_DAYS, trainingDays, zoneOf, type TrainingDay, type Zone } from './training';
import type { Dataset, DayKey } from './types';

export type Period = '6w' | '3m' | 'year';
export const PERIOD_DAYS: Record<Period, number> = { '6w': 42, '3m': 91, year: 365 };

/** The zones where training does what it should: building fitness, or ready to use it. */
const GOOD_ZONES: ReadonlySet<Zone> = new Set(['optimal', 'fresh']);

export type WeekFeel = 'easy' | 'steady' | 'hard';

export interface FormSummary {
  asOf: DayKey;
  /** The chart's days, oldest first, ending today. */
  days: TrainingDay[];
  today: TrainingDay;
  /** Today's form, from yesterday's fitness and fatigue. */
  form: number | null;
  zone: Zone | null;
  /** Yesterday's fitness − fatigue, the gap behind the form figure. */
  formGap: number;
  /** Fitness now minus fitness on the period's first day. */
  fitnessChange: number;
  /** Days of the period in the Optimal or Fresh zone, out of the days with a form figure. */
  goodDays: { count: number; of: number };
  /** Fatigue against fitness: below it an easy week, well above it a hard one. */
  week: WeekFeel;
  /** Load over the last 7 days. */
  load7: number;
  /** Fitness now against last month's average, for the title. */
  trend: { month: string; change: number } | null;
  /** Best runs within the period. */
  records: Partial<Record<RecordId, RunRecord>>;
  /** Best runs in everything Forma holds (about 14 months from COROS), and where that starts. */
  recordsAll: Partial<Record<RecordId, RunRecord>>;
  historyFrom: DayKey;
  easyHr: EasyHrMonth[];
  /** The latest easy-pace month against two months before it. */
  easyHrNow: { bpm: number; month: string; change: number | null; comparedMonth: string } | null;
}

export function formSummary(data: Dataset, period: Period): FormSummary {
  const { asOf, activities, athlete } = data;
  const span = PERIOD_DAYS[period];
  // Start early enough that 42-day fitness has settled before the first day on the chart.
  const from = [firstDay(activities, asOf), addDays(asOf, -(span + FITNESS_DAYS))].sort()[0]!;
  const all = trainingDays(dailyLoads(activities, athlete, from, asOf), from);
  const at = (daysAgo: number) => all[Math.max(0, all.length - 1 - daysAgo)]!;

  const days = all.slice(-span);
  const today = at(0);
  const yesterday = at(1);
  const lastMonth = addMonths(monthOf(asOf), -1);
  const lastMonthDays = all.filter((d) => monthOf(d.date) === lastMonth);

  const easyHr = easyHrByMonth(activities, asOf, 6, data.easyPace);
  const latest = [...easyHr].reverse().find((m) => m.bpm !== null);
  const before = latest && easyHr.find((m) => m.month === addMonths(latest.month, -2));

  return {
    asOf,
    days,
    today,
    form: today.form,
    zone: today.form === null ? null : zoneOf(today.form),
    formGap: yesterday.fitness - yesterday.fatigue,
    fitnessChange: today.fitness - days[0]!.fitness,
    goodDays: {
      count: days.filter((d) => d.form !== null && GOOD_ZONES.has(zoneOf(d.form))).length,
      of: days.filter((d) => d.form !== null).length,
    },
    week: today.fatigue < today.fitness * 0.9 ? 'easy' : today.fatigue > today.fitness * 1.15 ? 'hard' : 'steady',
    load7: all.slice(-7).reduce((sum, d) => sum + d.load, 0),
    trend: lastMonthDays.length
      ? {
          month: lastMonth,
          change: today.fitness - lastMonthDays.reduce((sum, d) => sum + d.fitness, 0) / lastMonthDays.length,
        }
      : null,
    records: records(activities, asOf, days[0]!.date),
    recordsAll: records(activities, asOf),
    historyFrom: firstDay(activities, asOf),
    easyHr,
    easyHrNow: latest
      ? {
          bpm: latest.bpm!,
          month: latest.month,
          change: before?.bpm != null ? latest.bpm! - before.bpm : null,
          comparedMonth: addMonths(latest.month, -2),
        }
      : null,
  };
}
