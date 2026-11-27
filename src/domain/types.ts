/**
 * What Forma keeps per activity: everything comes from the source's activity
 * list (COROS, later Strava), except runs' elevation gain, one request per run.
 */
export type Sport = 'run' | 'ride' | 'other';

export interface Activity {
  id: string;
  name: string;
  sport: Sport;
  /** Local start, "2026-11-09T08:12:00". */
  start: string;
  /** Metres. */
  distance: number;
  /** Seconds. */
  movingTime: number;
  /** Metres climbed; 0 until it is known (COROS: runs only, fetched after the list). */
  elevationGain: number;
  /** The source's own sport code (COROS: 100 run, 102 trail run…), needed to ask for an activity's details. */
  sportCode?: number;
  /** Beats per minute, when a heart-rate sensor was worn. */
  averageHeartrate?: number;
}

/** Heart-rate bounds the load formula needs: estimates, or what the athlete set in Settings. */
export interface Athlete {
  maxHr: number;
  restHr: number;
  sex?: 'male' | 'female';
}

export interface Dataset {
  source: 'sample' | 'coros' | 'strava';
  activities: Activity[];
  athlete: Athlete;
  /** Runs averaging a pace in this band count toward heart rate at easy pace. */
  easyPace: PaceBand;
  /** Nights of sleep, by wake-up day, oldest first; absent when the source has none. */
  sleep?: SleepNight[];
  /** "Today" for this data, "2026-11-25". Sample data is pinned to a date; real data uses the real day. */
  asOf: string;
}

/** One night's sleep, filed under the day it ended (the day it affects). */
export interface SleepNight {
  /** Wake-up day. */
  date: DayKey;
  /** Minutes asleep that day, naps included. */
  minutes: number;
  /** COROS's sleep score, 0–100, when it has one. */
  score: number | null;
}

/** A pace range in seconds per km, `from` the faster end. */
export interface PaceBand {
  from: number;
  to: number;
}

/** "YYYY-MM-DD", a calendar day in the athlete's time zone. */
export type DayKey = string;
