/** Everything the Form screen shows, computed from the activities in one pass. */
import { addDays, addMonths, monthOf } from '../lib/days';
import { easyHrByMonth, type EasyHrMonth } from './easyHr';
import { dailyLoads, firstDay } from './load';
import { records, type RecordId, type RunRecord } from './records';
import { FITNESS_DAYS, trainingDays, zoneOf, type TrainingDay, type Zone } from './training';
import type { Dataset, DayKey } from './types';

export type Period = '6w' | '3m' | 'year';
export const PERIOD_DAYS: Record<Period, number> = { '6w': 42, '3m': 91, year: 365 };

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
  /** Fitness now minus fitness 42 days ago. */
  fitnessChange: number;
  /** Fatigue against fitness: below it an easy week, well above it a hard one. */
  week: WeekFeel;
  /** Load over the last 7 days. */
  load7: number;
  /** Fitness now against last month's average, for the title. */
  trend: { month: string; change: number } | null;
  records: Partial<Record<RecordId, RunRecord>>;
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

  const today = at(0);
  const yesterday = at(1);
  const lastMonth = addMonths(monthOf(asOf), -1);
  const lastMonthDays = all.filter((d) => monthOf(d.date) === lastMonth);

  const easyHr = easyHrByMonth(activities, asOf);
  const latest = [...easyHr].reverse().find((m) => m.bpm !== null);
  const before = latest && easyHr.find((m) => m.month === addMonths(latest.month, -2));

  return {
    asOf,
    days: all.slice(-span),
    today,
    form: today.form,
    zone: today.form === null ? null : zoneOf(today.form),
    formGap: yesterday.fitness - yesterday.fatigue,
    fitnessChange: today.fitness - at(FITNESS_DAYS).fitness,
    week: today.fatigue < today.fitness * 0.9 ? 'easy' : today.fatigue > today.fitness * 1.15 ? 'hard' : 'steady',
    load7: all.slice(-7).reduce((sum, d) => sum + d.load, 0),
    trend: lastMonthDays.length
      ? {
          month: lastMonth,
          change: today.fitness - lastMonthDays.reduce((sum, d) => sum + d.fitness, 0) / lastMonthDays.length,
        }
      : null,
    records: records(activities, asOf),
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
