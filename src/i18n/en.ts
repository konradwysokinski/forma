import type { Zone } from '../domain/training';
import type { WeekFeel } from '../domain/formSummary';
import type { Locale } from './types';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
/** "in October"; month is 0–11. */
const inMonth = (month: number) => `in ${MONTHS[month]}`;

export const en = {
  locale: 'en' as Locale,
  languageName: 'English',

  nav: {
    label: 'Main',
    form: 'Form',
    language: 'Language',
  },

  sidebar: {
    sampleData: 'Sample data',
    connect: 'Connect COROS',
    synced: (ago: string) => `Synced ${ago}`,
    syncedJustNow: 'Synced just now',
    syncing: 'Syncing…',
    syncNow: 'Sync with COROS now',
    syncFailed: 'Sync failed',
    retry: 'Try again',
    reconnect: 'Connect again',
    disconnect: 'Disconnect',
    disconnectHint: 'Sign out of COROS and remove its data from this browser',
  },

  start: {
    title: 'Fitness, fatigue and form',
    titleMuted: 'from your own training',
    lead: 'Forma shows whether you are getting fitter, how tired you are, and whether today is a day for a hard run.',
    connectTitle: 'Connect COROS',
    connectBody:
      'Sign in with your COROS account. Forma reads a year of activities, your resting heart rate and sex, for the load formula. Nothing else.',
    connectButton: 'Connect COROS',
    connecting: 'Opening COROS…',
    connectNote: 'Your data stays in this browser: no account, no server.',
    connectFailed: (message: string) => `COROS sign-in didn't start. ${message}`,
    sample: 'Look around with sample data',
    openSource: 'Open source · MIT',
  },

  callback: {
    finishing: 'Finishing sign-in…',
    failed: "Sign-in didn't finish",
    back: 'Back to start',
  },

  firstSync: {
    title: 'Fetching your training',
    titleMuted: 'from COROS',
    body: 'A year of activities, a month at a time. Later syncs only fetch what is new.',
    progressLabel: 'Sync progress',
    failed: 'The sync stopped',
    retry: 'Try again',
    reconnect: 'Connect again',
  },

  period: {
    label: 'Period',
    '6w': '6 weeks',
    '3m': '3 months',
    year: 'Year',
    /** For chart descriptions. */
    over: { '6w': 'over 6 weeks', '3m': 'over 3 months', year: 'over the year' },
  },

  zones: {
    transition: { name: 'Transition', range: '+20% and up', note: 'Rested so long that fitness slips' },
    fresh: { name: 'Fresh', range: '+5 to +20%', note: 'Ready to race or run hard' },
    grey: { name: 'Grey zone', range: '−10 to +5%', note: 'Holding fitness, not building it' },
    optimal: { name: 'Optimal', range: '−30 to −10%', note: 'Tired in the right way: fitness grows' },
    risk: { name: 'High risk', range: 'below −30%', note: 'Rest soon: injury and illness risk' },
  } satisfies Record<Zone, { name: string; range: string; note: string }>,

  form: {
    /** The title's first, strong part. */
    state: {
      transition: 'Well rested',
      fresh: 'Fresh',
      grey: 'Holding steady',
      optimal: 'Building',
      risk: 'Overreaching',
    } satisfies Record<Zone, string>,
    noData: 'Not enough training yet',
    /** The title's quiet part: fitness today against last month's average. */
    trend: (change: number, month: number) =>
      change >= 1
        ? `and fitter than ${inMonth(month)}`
        : change <= -1
          ? `and less fit than ${inMonth(month)}`
          : `and as fit as ${inMonth(month)}`,

    kpiForm: 'Form',
    formSub: (zone: Zone, gap: string) =>
      ({
        transition: `Fatigue ${gap} below fitness: time to train again`,
        fresh: `Fatigue ${gap} below fitness: room for a hard run`,
        grey: 'Fatigue close to fitness: holding steady',
        optimal: `Fatigue ${gap} above fitness: building, as planned`,
        risk: `Fatigue ${gap} above fitness: time to rest`,
      })[zone],
    kpiFitness: 'Fitness',
    fitnessSub: (change: string) => `${change} in 6 weeks, from 42 days of training`,
    kpiFatigue: 'Fatigue',
    fatigueSub: (week: WeekFeel) =>
      ({ easy: 'From the last 7 days, an easy week', steady: 'From the last 7 days, a steady week', hard: 'From the last 7 days, a hard week' })[week],
    kpiEasyHr: 'Easy-pace heart rate',
    bpm: 'bpm',
    easyHrSub: (pace: string, change: number | null, month: number) =>
      change === null
        ? `At ${pace}`
        : change < 0
          ? `At ${pace}, ${-change} bpm lower than ${inMonth(month)}`
          : change > 0
            ? `At ${pace}, ${change} bpm higher than ${inMonth(month)}`
            : `At ${pace}, the same as ${inMonth(month)}`,
    easyHrNone: 'No easy runs with heart rate yet',

    chartTitle: 'Fitness, fatigue and form',
    today: (date: string) => `Today, ${date}`,
    fitness: 'Fitness',
    fitnessNote: 'Average load, last 42 days',
    fatigue: 'Fatigue',
    fatigueNote: 'Average load, last 7 days',
    load7: 'Load, 7 days',
    load7Note: 'From time and heart rate per activity',
    chartAria: (from: string, to: string, fatigue: string, over: string) =>
      `Fitness went from ${from} to ${to} ${over}; fatigue is ${fatigue} today. Grey bars show each day's load.`,

    formHeading: 'Form',
    formHeadingNote: '% of fitness, per day',
    formAria: (over: string, today: string, zone: string) => `Daily form ${over}, by zone. Today ${today}%, ${zone}.`,
    zonesLabel: 'Form zones',
  },

  records: {
    title: 'Records',
    '5k': '5 km',
    '10k': '10 km',
    half: 'Half marathon',
    longest: 'Longest run',
    isNew: (date: string) => `New · ${date}`,
    none: 'No run yet',
  },

  easyHr: {
    title: 'Heart rate at easy pace',
    note: (from: string, to: string) => `Average on runs at ${from}–${to} /km. Lower at the same pace means fitter.`,
    aria: (first: string, from: string, last: string, to: string) =>
      `Easy-pace heart rate went from ${first} bpm in ${from} to ${last} bpm in ${to}.`,
    empty: 'No easy runs with heart rate in these months.',
  },
};

export type Messages = typeof en;
