/**
 * COROS's MCP tools answer with text written for an AI assistant, not with
 * structured data. The text is regular, so it is parsed here, strictly:
 * anything unexpected throws a CorosFormatError naming the line, so a change
 * on COROS's side shows up as a clear error, never as quietly missing runs.
 *
 * Only what Forma needs is read. Location, start coordinates, calories,
 * birthday, height, weight and name are skipped and never stored.
 * From sleep only the hours and the score are kept.
 */
import type { Activity, Athlete, RestingHrDay, SleepNight, Sport } from '../domain/types';
import type { ToolResult } from './mcp';

export class CorosFormatError extends Error {
  constructor(what: string, line?: string) {
    super(`COROS sent ${what} in a format Forma doesn't know${line === undefined ? '' : `: "${line.trim().slice(0, 120)}"`}`);
    this.name = 'CorosFormatError';
  }
}

/** The tool's text. COROS wraps it in a JSON string inside `content[0].text`. */
export function toolText(result: ToolResult, tool: string): string {
  const raw = result.content?.find((c) => c.type === 'text')?.text;
  if (raw === undefined) throw new CorosFormatError(`a ${tool} reply without text`);
  let text = raw;
  if (raw.startsWith('"')) {
    try {
      text = JSON.parse(raw) as string;
    } catch {
      throw new CorosFormatError(`a ${tool} reply`, raw);
    }
  }
  if (result.isError) throw new Error(`COROS ${tool} failed: ${text.slice(0, 300)}`);
  return text;
}

/** COROS running codes: run, indoor run, trail run, track run. 104 (hike) is not one. */
const RUN_CODES = new Set([100, 101, 102, 103]);

/** COROS sport codes → Forma's sports: 2xx is cycling. Everything else (walks, hikes, gym, table tennis…) still counts as load. */
export function sportOfCode(code: number): Sport {
  if (RUN_CODES.has(code)) return 'run';
  if (code >= 200 && code < 300) return 'ride';
  return 'other';
}

/** "58:03" or "2:03:41" → seconds. */
function seconds(value: string, line: string): number {
  const parts = value.split(':').map(Number);
  if (parts.length < 2 || parts.length > 3 || parts.some((p) => !Number.isFinite(p))) {
    throw new CorosFormatError('a duration', line);
  }
  return parts.reduce((total, p) => total * 60 + p, 0);
}

/** "10.98 km" or "979 m" → metres. */
function metres(value: string, line: string): number {
  const m = /^([\d.]+) (km|m)$/.exec(value);
  if (!m) throw new CorosFormatError('a distance', line);
  return Math.round(Number(m[1]) * (m[2] === 'km' ? 1000 : 1));
}

/** Seconds since the epoch → local wall-clock time, "2026-11-25T07:16:33". */
export function localTime(epochSeconds: number, timeZone?: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(epochSeconds * 1000));
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`;
}

const HEADER = /^Sport Records — (\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2}) \((\d+) records?\)$/;
const RECORD_START = /^(\d+)\. (.+) — (\d{4}-\d{2}-\d{2})$/;
const RULE = /^=+$/;

/** One record's lines → Activity. */
function toActivity(lines: string[], timeZone?: string): Activity {
  const head = RECORD_START.exec(lines[0]!)!;
  const fields = new Map<string, { value: string; line: string }>();
  for (const line of lines.slice(1)) {
    // Free text Forma doesn't use (and may hold a "|"): skipped unread.
    if (/^\s*(Location|Start Coordinates):/.test(line)) continue;
    // "Time Window: startTimestamp=… | endTimestamp=…" is one field.
    const parts = /^\s*Time Window:/.test(line) ? [line] : line.split(' | ');
    for (const part of parts) {
      const m = /^\s*([A-Za-z][A-Za-z ]*?): (.+?)\s*$/.exec(part);
      if (!m) throw new CorosFormatError('an activity line', line);
      fields.set(m[1]!, { value: m[2]!, line });
    }
  }
  const need = (key: string) => {
    const f = fields.get(key);
    if (!f) throw new CorosFormatError(`an activity without "${key}"`, lines[0]);
    return f;
  };

  const window = need('Time Window');
  const start = /startTimestamp=(\d+)/.exec(window.value);
  if (!start) throw new CorosFormatError('a time window', window.line);
  const id = need('LabelId');
  if (!/^\d+$/.test(id.value)) throw new CorosFormatError('an activity id', id.line);
  const code = need('SportType');
  if (!/^\d+$/.test(code.value)) throw new CorosFormatError('a sport type', code.line);
  const duration = need('Duration');
  const distance = fields.get('Distance');
  const hr = fields.get('Avg HR');
  const bpm = hr && /^(\d+) bpm$/.exec(hr.value);
  if (hr && !bpm) throw new CorosFormatError('a heart rate', hr.line);

  return {
    id: id.value,
    name: head[2]!,
    sport: sportOfCode(Number(code.value)),
    start: localTime(Number(start[1]), timeZone),
    distance: distance ? metres(distance.value, distance.line) : 0,
    movingTime: seconds(duration.value, duration.line),
    // Not in COROS's list; runs get theirs from getActivityDetail (see parseElevation).
    elevationGain: 0,
    sportCode: Number(code.value),
    ...(bpm && Number(bpm[1]) > 0 ? { averageHeartrate: Number(bpm[1]) } : {}),
  };
}

/**
 * querySportRecords text → activities. `timeZone` places start times on the
 * athlete's clock; it defaults to the browser's.
 */
export function parseSportRecords(text: string, timeZone?: string): Activity[] {
  // Records without a distance break the line before " | Avg HR"; join those back.
  const lines = text.replace(/\n \|/g, ' |').split('\n');
  const header = HEADER.exec(lines[0]?.trim() ?? '');
  if (!header) {
    // An empty range may be worded differently; accept it only if it clearly says so.
    if (/\bno\b.*\brecords?\b/i.test(lines[0] ?? '') || /\(0 records?\)/.test(lines[0] ?? '')) return [];
    throw new CorosFormatError('activities', lines[0]);
  }

  const records: string[][] = [];
  for (const line of lines.slice(1)) {
    if (!line.trim() || RULE.test(line.trim())) continue;
    if (RECORD_START.test(line)) records.push([line]);
    else if (records.length && /^\s/.test(line)) records.at(-1)!.push(line);
    else throw new CorosFormatError('activities', line);
  }

  const expected = Number(header[3]);
  if (records.length !== expected) {
    throw new CorosFormatError(`${records.length} activities where it announced ${expected}`);
  }
  return records.map((r) => toActivity(r, timeZone));
}

/** queryRestingHeartRate text → each morning's resting heart rate, oldest first (days at 0 are left out). */
export function parseRestingHrDays(text: string): RestingHrDay[] {
  const lines = text.split('\n').map((l) => l.trim());
  if (!/^Resting Heart Rate\b/.test(lines[0] ?? '')) throw new CorosFormatError('resting heart rate', lines[0]);
  const days: RestingHrDay[] = [];
  for (const line of lines.slice(1)) {
    if (!line || RULE.test(line)) continue;
    const m = /^(\d{4}-\d{2}-\d{2}): (\d+) bpm$/.exec(line);
    if (!m) throw new CorosFormatError('resting heart rate', line);
    if (Number(m[2]) > 0) days.push({ date: m[1]!, bpm: Number(m[2]) });
  }
  return days.sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** The median of the mornings listed, or null when there are none. */
export function medianRestingHr(days: readonly RestingHrDay[]): number | null {
  if (!days.length) return null;
  const values = days.map((d) => d.bpm).sort((a, b) => a - b);
  const mid = values.length / 2;
  return Number.isInteger(mid) ? Math.round((values[mid - 1]! + values[mid]!) / 2) : values[Math.floor(mid)]!;
}

/** queryRestingHeartRate text → the median of the days listed, or null when none are. */
export const parseRestingHr = (text: string) => medianRestingHr(parseRestingHrDays(text));

/** queryUserInfo text → sex, for the load formula's constants. Nothing else from the profile is read. */
export function parseSex(text: string): Athlete['sex'] {
  if (!/^User Profile\b/.test(text.trim())) throw new CorosFormatError('the profile', text.split('\n')[0]);
  const m = /^Gender: (\w+)\s*$/im.exec(text);
  const value = m?.[1]?.toLowerCase();
  return value === 'male' || value === 'female' ? value : undefined;
}

/** Sleep lines Forma doesn't use: stage ratios, awake time and count, windows, periods incl. awake. Skipped unread. */
const SLEEP_SKIPPED =
  /^(Deep Sleep Ratio|Light Sleep Ratio|REM Ratio|Awake Ratio|Awake Time|Awake Count \(>\d+ min\)|Main Sleep Window|Main Sleep Period \(incl\. awake\)|Naps Period \(incl\. awake\)|Nap Window|Sleep metrics scope)$/;
const SLEEP_UNAVAILABLE = 'Sleep detail for this day is not available yet.';

/** "7h 12min", "45min", "0 min" → minutes. */
function sleepMinutes(value: string, line: string): number {
  const m = /^(?:(\d+)h)? ?(?:(\d+) ?min)?$/.exec(value);
  if (!m || (m[1] === undefined && m[2] === undefined)) throw new CorosFormatError('a sleep duration', line);
  return Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0);
}

/** One day's lines → a night, or null when COROS has no sleep for it. */
function toNight(lines: string[]): SleepNight | null {
  const date = lines[0]!;
  let score: number | null = null;
  let daily: number | undefined;
  let main: number | undefined;
  let naps = 0;
  for (const line of lines.slice(1)) {
    if (line === SLEEP_UNAVAILABLE) return null;
    const at = line.indexOf(': ');
    if (at < 0) throw new CorosFormatError('a sleep line', line);
    const key = line.slice(0, at);
    const value = line.slice(at + 2).trim();
    if (SLEEP_SKIPPED.test(key)) continue;
    switch (key) {
      case 'Sleep Score': {
        if (!/^-?\d+$/.test(value)) throw new CorosFormatError('a sleep score', line);
        const n = Number(value);
        score = n > 0 && n <= 100 ? n : null;
        break;
      }
      case 'Daily Sleep':
        daily = sleepMinutes(value.replace(/ \(incl\. naps\)$/, ''), line);
        break;
      case 'Main Sleep':
      case 'Main Sleep (asleep)':
        main = sleepMinutes(value, line);
        break;
      case 'Naps Total':
      case 'Naps Total (asleep)':
        naps = sleepMinutes(value.replace(/ \(includes legacy reported durations\)$/, ''), line);
        break;
      default:
        throw new CorosFormatError('a sleep line', line);
    }
  }
  // COROS's own daily total when it gives one (older days don't), otherwise main sleep plus naps.
  const minutes = daily ?? (main === undefined ? undefined : main + naps);
  return minutes ? { date, minutes, score } : null;
}

/** querySleepOverview text → nights with sleep, oldest first. */
export function parseSleep(text: string): SleepNight[] {
  const lines = text.split('\n').map((l) => l.trim());
  if (/^No sleep overview data\b/i.test(lines[0] ?? '')) return [];
  if (lines[0] !== 'Sleep Overview') throw new CorosFormatError('sleep', lines[0]);

  const days: string[][] = [];
  for (const line of lines.slice(1)) {
    if (!line || RULE.test(line) || /^Note:/.test(line)) continue;
    if (/^\d{4}-\d{2}-\d{2}$/.test(line)) days.push([line]);
    else if (days.length) days.at(-1)!.push(line);
    else throw new CorosFormatError('sleep', line);
  }
  return days
    .map(toNight)
    .filter((n): n is SleepNight => n !== null)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** "🏃 Trail Run Activity Details": an emoji (or none), the record's name, "Activity Details". */
const DETAIL_HEADER = /^(?:\S+ )?.+ Activity Details$/u;
/** Outdoor and trail runs. */
const GAIN_LOSS = /^(\d+(?:\.\d+)?) m \/ \d+(?:\.\d+)? m$/;
/** Indoor runs say "Total Ascent: 120 m" instead. */
const ASCENT = /^(\d+(?:\.\d+)?) m$/;

/**
 * getActivityDetail text → metres climbed: 0 when COROS lists no elevation,
 * null while the activity is still in progress (its numbers will change).
 * Every other line (pace, cadence, power, calories…) is skipped unread, but
 * must look like "Key: value".
 */
export function parseElevation(text: string): number | null {
  const lines = text.split('\n').map((l) => l.trim());
  if (!DETAIL_HEADER.test(lines[0] ?? '')) throw new CorosFormatError('activity details', lines[0]);
  let gain = 0;
  for (const line of lines.slice(1)) {
    if (!line || RULE.test(line)) continue;
    if (/^Status: in progress\b/.test(line)) return null;
    const at = line.indexOf(': ');
    if (at < 1) throw new CorosFormatError('an activity detail line', line);
    const key = line.slice(0, at);
    const value = line.slice(at + 2).trim();
    if (key === 'Elevation Gain / Loss' || key === 'Total Ascent') {
      const m = (key === 'Total Ascent' ? ASCENT : GAIN_LOSS).exec(value);
      if (!m) throw new CorosFormatError('an elevation', line);
      gain = Math.round(Number(m[1]));
    }
  }
  return gain;
}
