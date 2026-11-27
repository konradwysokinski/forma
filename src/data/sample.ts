/**
 * Sample data for the Form screen, matching the mockup (design/Form.dc.html):
 * 400 days of running ending 25 Nov 2026 in blocks of three build weeks and an
 * easy week, the last days easy, so today reads "Fresh". Volume grows slowly,
 * easy-pace heart rate drifts down over the months, and four runs set the records.
 * Sleep is invented too: a little shorter after hard days, slowly better
 * scored, with the odd night the watch stayed on the charger.
 */
import { addDays } from '../lib/days';
import { DEFAULT_EASY_PACE } from '../domain/settings';
import type { Activity, Dataset, RestingHrDay, SleepNight } from '../domain/types';

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
      // Invented: the long run goes up into the hills, the rest stays flat-ish.
      elevationGain: Math.round(km * (slot.name === 'Long run' ? 24 : 6)),
      averageHeartrate: Math.round(slot.hr - 1 + drift),
    });
  }
  return activities;
}

/** A night per wake-up day, from a fixed seed so the sample never changes. */
function buildSleep(activities: readonly Activity[]): SleepNight[] {
  const hardDays = new Set(activities.filter((a) => a.movingTime > 3600 || a.name === 'Intervals').map((a) => a.start.slice(0, 10)));
  const first = addDays(SAMPLE_AS_OF, -(DAYS - 1));
  let seed = 11;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const nights: SleepNight[] = [];
  for (let d = 1; d < DAYS; d++) {
    const date = addDays(first, d);
    const a = random();
    const b = random();
    if (d % 23 === 5) continue;
    const afterHard = hardDays.has(addDays(date, -1));
    const weekend = d % 7 === 4 || d % 7 === 5;
    const hours = Math.max(5.2, Math.min(9, 7.1 + (a - 0.5) * 1.6 - (afterHard ? 0.5 : 0) + (weekend ? 0.5 : 0)));
    const score = Math.round(Math.max(48, Math.min(95, 58 + (hours - 5.5) * 8 + d / 40 + (b - 0.5) * 12)));
    nights.push({ date, minutes: Math.round(hours * 60), score });
  }
  return nights;
}

/** Resting heart rate for the last 30 mornings, as COROS gives it; invented, around 50, a beat or two up after hard days. */
function buildRestingHr(activities: readonly Activity[]): RestingHrDay[] {
  const hardDays = new Set(activities.filter((a) => a.movingTime > 3600 || a.name === 'Intervals').map((a) => a.start.slice(0, 10)));
  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const days: RestingHrDay[] = [];
  for (let d = 29; d >= 0; d--) {
    const date = addDays(SAMPLE_AS_OF, -d);
    const up = hardDays.has(addDays(date, -1)) ? 2 : 0;
    days.push({ date, bpm: Math.round(49 + up + (random() - 0.5) * 3) });
  }
  return days;
}

const ACTIVITIES = buildActivities();

export const SAMPLE: Dataset = {
  source: 'sample',
  activities: ACTIVITIES,
  sleep: buildSleep(ACTIVITIES),
  restingHr: buildRestingHr(ACTIVITIES),
  athlete: { maxHr: 192, restHr: 50 },
  easyPace: DEFAULT_EASY_PACE,
  asOf: SAMPLE_AS_OF,
};
