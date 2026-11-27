/**
 * Hand-written COROS replies for tests, shaped like the real ones (spaces,
 * separators, the line break before " | Avg HR" on records without a
 * distance) but invented: no real names, places, coordinates or dates of birth.
 * Never paste a real reply here.
 */
import type { ToolResult } from './mcp';

/** As COROS sends it: the text as a JSON string inside content[0].text. */
export const wrap = (text: string): ToolResult => ({
  content: [{ type: 'text', text: JSON.stringify(text) }],
  isError: false,
});

export const SPORT_RECORDS = [
  'Sport Records — 2026-11-20 to 2026-11-26 (5 records)',
  '========================',
  '',
  '1. Outdoor Run — 2026-11-25',
  '   Location: Sample Park Run',
  '   Start Coordinates: 10.000000, 10.000000',
  '   Time Window: startTimestamp=1795600000 | endTimestamp=1795603600',
  '   Duration: 58:03 | Distance: 10.98 km',
  '   Average Pace: 5:17 /km | Avg HR: 140 bpm | Calories: 750 kcal',
  '   LabelId: 100000000000000005 | SportType: 100',
  '',
  '2. Ping Pong — 2026-11-24',
  '   Location: Table Tennis',
  '   Time Window: startTimestamp=1795500000 | endTimestamp=1795502600',
  '   Duration: 43:07',
  ' | Avg HR: 90 bpm | Calories: 210 kcal',
  '   LabelId: 100000000000000004 | SportType: 1001',
  '',
  '3. Hike — 2026-11-23',
  '   Location: Sample Hill Hike',
  '   Start Coordinates: 10.000000, 10.000000',
  '   Time Window: startTimestamp=1795420000 | endTimestamp=1795421100',
  '   Duration: 17:06 | Distance: 979 m',
  '   Average Speed: 3.4 km/h | Avg HR: 78 bpm | Calories: 60 kcal',
  '   LabelId: 100000000000000003 | SportType: 104',
  '',
  '4. Trail Run — 2026-11-22',
  '   Location: Sample Forest Trail Run',
  '   Start Coordinates: 10.000000, 10.000000',
  '   Time Window: startTimestamp=1795330000 | endTimestamp=1795338000',
  '   Duration: 2:03:41 | Distance: 22.06 km',
  '   Average Pace: 5:36 /km | Avg HR: 128 bpm | Calories: 1100 kcal',
  '   LabelId: 100000000000000002 | SportType: 102',
  '',
  '5. Gravel Bike — 2026-11-21',
  '   Location: Sample Valley Gravel Bike',
  '   Start Coordinates: 10.000000, 10.000000',
  '   Time Window: startTimestamp=1795250000 | endTimestamp=1795255000',
  '   Duration: 1:10:42 | Distance: 25.55 km',
  '   Average Speed: 21.7 km/h',
  '   LabelId: 100000000000000001 | SportType: 203',
].join('\n');

export const RESTING_HR = [
  'Resting Heart Rate — Last 30 days',
  '========================',
  '',
  '2026-11-25: 45 bpm',
  '2026-11-24: 43 bpm',
  '2026-11-23: 47 bpm',
  '2026-11-22: 52 bpm',
].join('\n');

export const USER_INFO = [
  'User Profile Information',
  '========================',
  '',
  'Height: 175.0 cm',
  'Weight: 70.0 kg',
  'Birthday: 1990-01-01 (Age: 36)',
  'Gender: Female',
  'Nickname: Sample Runner',
].join('\n');

/**
 * querySleepOverview, oldest first, by wake-up day: an older day without
 * "Daily Sleep" (main sleep + naps), newer days in both labellings, a nap-only
 * day, a day without a score, and days COROS hasn't finished.
 */
export const SLEEP = [
  'Sleep Overview',
  '========================',
  'Note: each record below is dated by its wake-up day.',
  '',
  '2026-11-19',
  'Sleep Score: 71',
  'Main Sleep: 6h 40min',
  'Deep Sleep Ratio: 20%',
  'Light Sleep Ratio: 55%',
  'REM Ratio: 20%',
  'Awake Ratio: 5%',
  'Awake Time: 1h 5min',
  'Main Sleep Window: 2026-11-18 23:30 - 2026-11-19 07:15',
  'Naps Total: 20 min (includes legacy reported durations)',
  'Nap Window: 2026-11-19 14:00 - 2026-11-19 14:20',
  '',
  '2026-11-20',
  'Sleep Score: 84',
  'Daily Sleep: 7h 12min (incl. naps)',
  'Main Sleep: 7h 5min',
  'Deep Sleep Ratio: 22%',
  'Light Sleep Ratio: 52%',
  'REM Ratio: 21%',
  'Awake Ratio: 5%',
  'Awake Time: 15 min',
  'Awake Count (>5 min): 1',
  'Main Sleep Window: 2026-11-19 23:00 - 2026-11-20 06:30',
  'Naps Total: 0 min',
  '',
  '2026-11-21',
  'Sleep Score: 62',
  'Daily Sleep: 8h 1min (incl. naps)',
  'Main Sleep (asleep): 7h 0min',
  'Main Sleep Period (incl. awake): 7h 30min',
  'Sleep metrics scope: daily',
  'Deep Sleep Ratio: 18%',
  'Light Sleep Ratio: 58%',
  'REM Ratio: 19%',
  'Awake Ratio: 5%',
  'Awake Time: 30 min',
  'Awake Count (>5 min): 2',
  'Main Sleep Window: 2026-11-20 23:15 - 2026-11-21 06:45',
  'Naps Total (asleep): 1h 1min',
  'Naps Period (incl. awake): 1h 5min',
  'Nap Window: 2026-11-21 13:00 - 2026-11-21 14:05',
  '',
  '2026-11-22',
  'Sleep Score: 55',
  'Daily Sleep: 45min (incl. naps)',
  'Sleep metrics scope: main sleep',
  'Naps Total (asleep): 45 min',
  'Naps Period (incl. awake): 50 min',
  'Nap Window: 2026-11-22 15:00 - 2026-11-22 15:50',
  '',
  '2026-11-23',
  'Sleep Score: -1',
  'Daily Sleep: 6h 30min (incl. naps)',
  'Main Sleep (asleep): 6h 30min',
  'Naps Total: 0 min',
  '',
  '2026-11-24',
  'Sleep Score: 80',
  'Sleep detail for this day is not available yet.',
  '',
  '2026-11-25',
  'Sleep detail for this day is not available yet.',
].join('\n');

/** getActivityDetail for a trail run (invented numbers). */
export const DETAIL_TRAIL = [
  '🏃 Trail Run Activity Details',
  '========================================',
  '',
  'Workout Time: 2:15:10',
  'Distance: 22.06 km',
  'Total Time: 2:20:02',
  'Average Pace: 6:07 /km',
  'Moving Average Pace: 5:36 /km',
  'Adjusted Pace: 4:58 /km',
  'Best Kilometer: 4:40 /km',
  'Average Heart Rate: 128 bpm',
  'Average Cadence: 170 spm',
  'Average Stride Length: 1.02 m',
  'Average Power: 250 W',
  'Elevation Gain / Loss: 1240 m / 1235 m',
  'Calories: 1100 kcal',
  'Training Load: 180',
  'Aerobic TE: 3.4',
  'Anaerobic TE: 0.8',
  'Training Focus: Base',
].join('\n');

/** getActivityDetail for an indoor run: "Total Ascent" instead of gain / loss. */
export const DETAIL_INDOOR = [
  '🏃 Indoor Run Activity Details',
  '========================================',
  '',
  'Workout Time: 40:00',
  'Distance: 8.00 km',
  'Average Heart Rate: 140 bpm',
  'Total Ascent: 35 m',
  'Calories: 500 kcal',
  'Training Focus: Threshold',
].join('\n');

/** An activity still being recorded, as COROS's docs describe it. */
export const DETAIL_IN_PROGRESS = [
  '🏃 Outdoor Run Activity Details',
  'Status: in progress. Metrics reflect data uploaded so far and will change when the activity ends.',
  '========================================',
  '',
  'Workout Time: 12:00',
  'Elevation Gain / Loss: 20 m / 18 m',
].join('\n');
