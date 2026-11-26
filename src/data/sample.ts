/**
 * Sample data for the Form screen, matching the mockup (design/Form.dc.html):
 * 400 days of running ending 25 Nov 2026 in blocks of three build weeks and an
 * easy week, the last days easy, so today reads "Fresh". Volume grows slowly,
 * easy-pace heart rate drifts down over the months, and four runs set the records.
 */
import { addDays } from '../lib/days';
import { DEFAULT_EASY_PACE } from '../domain/settings';
import type { Activity, Dataset } from '../domain/types';

export const SAMPLE_AS_OF = '2026-11-25';
const DAYS = 400;
/** The mockup's 200 days; the earlier ones lead into them at lower volume. */
const RECENT = 200;

/** One week, by day: base distance (km), pace (s/km), heart rate at the start of the period. */
const WEEK: readonly ({ name: string; km: number; pace: number; hr: number } | null)[] = [
  { name: 'Easy run', km: 8, pace: 345, hr: 142 },
  { name: 'Recovery run', km: 5, pace: 360, hr: 136 },
  { name: 'Intervals', km: 9, pace: 300, hr: 158 },
  { name: 'Easy run', km: 6, pace: 350, hr: 140 },
  null,
  { name: 'Long run', km: 14, pace: 355, hr: 147 },
  { name: 'Steady run', km: 10, pace: 320, hr: 152 },
];

/** The record runs, replacing whatever the pattern put on that day. */
const SPECIAL: Record<string, Omit<Activity, 'id' | 'start' | 'sport' | 'elevationGain'>> = {
  '2026-09-14': { name: '10 km race', distance: 10000, movingTime: 2772, averageHeartrate: 172 },
  '2026-10-05': { name: 'Half marathon', distance: 21098, movingTime: 6270, averageHeartrate: 168 },
  '2026-10-26': { name: 'Long run', distance: 28400, movingTime: 10082, averageHeartrate: 150 },
  '2026-11-09': { name: '5 km race', distance: 5000, movingTime: 1308, averageHeartrate: 176 },
};

function buildActivities(): Activity[] {
  const first = addDays(SAMPLE_AS_OF, -(DAYS - 1));
  const activities: Activity[] = [];
  for (let d = 0; d < DAYS; d++) {
    const date = addDays(first, d);
    const id = `s${d}`;
    const start = `${date}T07:30:00`;
    const special = SPECIAL[date];
    if (special) {
      activities.push({ id, start, sport: 'run', elevationGain: 40, ...special });
      continue;
    }
    const recent = d - (DAYS - RECENT);
    const slot = WEEK[((recent % 7) + 7) % 7];
    if (!slot) continue;
    // Weeks counted back from today: this week easy, then three build weeks (hardest last) and an easy one, repeating.
    const weeksAgo = Math.floor((DAYS - 1 - d) / 7);
    const phase = (weeksAgo - 1) % 4;
    const scale = weeksAgo === 0 ? 0.68 : phase === 3 ? 0.6 : 1.16 - phase * 0.07;
    const ramp = Math.max(0.5, 0.75 + recent / 500);
    const km = slot.km * ramp * scale;
    const drift = Math.min(14, 9 * (1 - recent / (RECENT - 1)));
    activities.push({
      id,
      name: slot.name,
      sport: 'run',
      start,
      distance: Math.round(km * 1000),
      movingTime: Math.round(km * slot.pace),
      elevationGain: Math.round(km * 6),
      averageHeartrate: Math.round(slot.hr - 1 + drift),
    });
  }
  return activities;
}

export const SAMPLE: Dataset = {
  source: 'sample',
  activities: buildActivities(),
  athlete: { maxHr: 192, restHr: 50 },
  easyPace: DEFAULT_EASY_PACE,
  asOf: SAMPLE_AS_OF,
};
