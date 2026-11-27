/**
 * Today: one verdict on whether today suits a harder session, and the signals
 * behind it. Plain rules, no model: each signal is good, neutral or poor, and
 * the verdict follows from the zone, the week's load and how many are poor.
 * A signal without data is left out, never guessed.
 */
import { addDays } from '../lib/days';
import type { Zone } from './training';
import type { DayKey, RestingHrDay, SleepNight } from './types';

export type Verdict = 'harder' | 'easy' | 'rest';
export type Rating = 'good' | 'neutral' | 'poor';
export type LoadLevel = 'low' | 'normal' | 'high';

export type Signal =
  | { id: 'form'; rating: Rating; form: number; zone: Zone }
  | { id: 'load'; rating: Rating; level: LoadLevel; load7: number; usual: number }
  | { id: 'restHr'; rating: Rating; bpm: number; average: number; change: number }
  | { id: 'sleep'; rating: Rating; minutes: number; average: number | null; change: number | null };

export interface Today {
  verdict: Verdict;
  signals: Signal[];
}

/** The thresholds, in one place (also in CLAUDE.md §2). */
export const TODAY = {
  /** 7-day load against fitness × 7 (fitness is the 42-day average daily load). */
  loadLow: 0.75,
  loadHigh: 1.3,
  /** Resting HR this morning against the average of the days before it. */
  restDays: 14,
  restMinDays: 4,
  restPoor: 5,
  restNeutral: 3,
  /** Last night, in minutes, against the average of the nights before it. */
  sleepDays: 14,
  sleepMinNights: 4,
  sleepGood: 7 * 60,
  sleepPoor: 6 * 60,
  /** Under the usual by this much: a good night becomes fair, a fair one poor. */
  sleepDropFair: 45,
  sleepDropPoor: 90,
} as const;

const ZONE_RATING: Record<Zone, Rating> = {
  transition: 'good',
  fresh: 'good',
  grey: 'good',
  optimal: 'neutral',
  risk: 'poor',
};

/** Rested enough that hard work lands well. Transition counts: well rested, if losing a little fitness. */
const READY_ZONES: ReadonlySet<Zone> = new Set(['transition', 'fresh', 'grey']);

export interface TodayInput {
  asOf: DayKey;
  form: number | null;
  zone: Zone | null;
  /** Fitness now: the 42-day average daily load. */
  fitness: number;
  /** Load over the last 7 days, today included. */
  load7: number;
  sleep?: readonly SleepNight[];
  restingHr?: readonly RestingHrDay[];
}

const mean = (values: readonly number[]) => values.reduce((a, b) => a + b, 0) / values.length;

/** The values of the `days` days before `asOf`, oldest first. */
function before<T extends { date: DayKey }>(list: readonly T[], asOf: DayKey, days: number): T[] {
  const from = addDays(asOf, -days);
  return list.filter((x) => x.date >= from && x.date < asOf);
}

export function loadSignal(load7: number, fitness: number): Signal | null {
  const usual = fitness * 7;
  // Too little history to call a week heavy or light.
  if (usual < 1) return null;
  const ratio = load7 / usual;
  const level: LoadLevel = ratio < TODAY.loadLow ? 'low' : ratio > TODAY.loadHigh ? 'high' : 'normal';
  return { id: 'load', rating: level === 'high' ? 'poor' : level === 'low' ? 'good' : 'neutral', level, load7, usual };
}

export function restHrSignal(days: readonly RestingHrDay[], asOf: DayKey): Signal | null {
  const morning = days.find((d) => d.date === asOf);
  const earlier = before(days, asOf, TODAY.restDays);
  if (!morning || earlier.length < TODAY.restMinDays) return null;
  const average = mean(earlier.map((d) => d.bpm));
  const change = morning.bpm - average;
  const rating: Rating = change >= TODAY.restPoor ? 'poor' : change >= TODAY.restNeutral ? 'neutral' : 'good';
  return { id: 'restHr', rating, bpm: morning.bpm, average, change };
}

export function sleepSignal(nights: readonly SleepNight[], asOf: DayKey): Signal | null {
  const night = nights.find((n) => n.date === asOf);
  if (!night) return null;
  const earlier = before(nights, asOf, TODAY.sleepDays);
  const average = earlier.length >= TODAY.sleepMinNights ? mean(earlier.map((n) => n.minutes)) : null;
  const change = average === null ? null : night.minutes - average;
  const drop = change === null ? 0 : -change;
  let rating: Rating =
    night.minutes < TODAY.sleepPoor ? 'poor' : night.minutes >= TODAY.sleepGood ? 'good' : 'neutral';
  if (drop >= TODAY.sleepDropPoor) rating = 'poor';
  else if (drop >= TODAY.sleepDropFair && rating === 'good') rating = 'neutral';
  return { id: 'sleep', rating, minutes: night.minutes, average, change };
}

/**
 * Rest: High risk, two or more poor signals, or a poor night after a heavy week.
 * Harder: rested (Transition, Fresh, Grey zone), the week's load not high, nothing poor.
 * Otherwise: easy. Without a form figure (the first week of history) never harder.
 */
export function today(input: TodayInput): Today {
  const signals: Signal[] = [];
  if (input.form !== null && input.zone) {
    signals.push({ id: 'form', rating: ZONE_RATING[input.zone], form: input.form, zone: input.zone });
  }
  const load = loadSignal(input.load7, input.fitness);
  if (load) signals.push(load);
  const rest = input.restingHr && restHrSignal(input.restingHr, input.asOf);
  if (rest) signals.push(rest);
  const sleep = input.sleep && sleepSignal(input.sleep, input.asOf);
  if (sleep) signals.push(sleep);

  const poor = signals.filter((s) => s.rating === 'poor').length;
  const loadHigh = load?.id === 'load' && load.level === 'high';
  const verdict: Verdict =
    input.zone === 'risk' || poor >= 2 || (sleep?.rating === 'poor' && loadHigh)
      ? 'rest'
      : input.zone && READY_ZONES.has(input.zone) && !loadHigh && poor === 0
        ? 'harder'
        : 'easy';
  return { verdict, signals };
}

/**
 * Which sentence variant to show: steady through the day, and the next one
 * the day after, so a verdict doesn't repeat its words on consecutive days.
 */
export function variantOf(date: DayKey, count: number): number {
  const [y, m, d] = date.split('-').map(Number);
  const day = Math.floor(Date.UTC(y!, m! - 1, d!) / 86_400_000);
  return ((day % count) + count) % count;
}
