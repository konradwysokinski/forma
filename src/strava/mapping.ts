/**
 * Strava's activity list (GET /athlete/activities) → Forma's Activity. Pure,
 * so it is tested without the network. Only the fields Forma uses are typed;
 * all of them come in the list, so no request per activity is needed.
 */
import type { Activity, Sport } from '../domain/types';

export interface StravaActivity {
  id: number;
  name: string;
  sport_type?: string;
  /** Local wall-clock time, written with a misleading "Z": "2026-11-09T08:12:00Z". */
  start_date_local: string;
  /** Metres. */
  distance: number;
  /** Seconds. */
  moving_time?: number;
  /** Metres. */
  total_elevation_gain?: number;
  average_heartrate?: number;
  has_heartrate?: boolean;
}

const RUNS = new Set(['Run', 'TrailRun', 'VirtualRun']);
const RIDES = new Set(['Ride', 'VirtualRide', 'EBikeRide', 'GravelRide', 'MountainBikeRide', 'EMountainBikeRide']);

export function sportOf(sportType: string | undefined): Sport {
  if (sportType && RUNS.has(sportType)) return 'run';
  if (sportType && RIDES.has(sportType)) return 'ride';
  return 'other';
}

export function toActivity(a: StravaActivity): Activity {
  return {
    id: String(a.id),
    name: a.name,
    sport: sportOf(a.sport_type),
    start: a.start_date_local.replace(/Z$/, ''),
    distance: a.distance,
    movingTime: a.moving_time ?? 0,
    elevationGain: a.total_elevation_gain ?? 0,
    ...(a.has_heartrate !== false && a.average_heartrate ? { averageHeartrate: a.average_heartrate } : {}),
  };
}
