/** What Forma keeps per activity: everything comes from the source's activity list (COROS, later Strava), no extra requests. */
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
  /** Metres climbed. */
  elevationGain: number;
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
  /** "Today" for this data, "2026-11-25". Sample data is pinned to a date; real data uses the real day. */
  asOf: string;
}

/** A pace range in seconds per km, `from` the faster end. */
export interface PaceBand {
  from: number;
  to: number;
}

/** "YYYY-MM-DD", a calendar day in the athlete's time zone. */
export type DayKey = string;
