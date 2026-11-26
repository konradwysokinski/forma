import type { Locale } from './types';

const NBSP = ' ';
const MINUS = '−';

/** 3214 → "3 214" in both languages. */
export function formatInt(n: number): string {
  const rounded = Math.round(n);
  const digits = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return rounded < 0 ? `${MINUS}${digits}` : digits;
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export interface Format {
  int: (n: number) => string;
  /** +12 / −3 / 0, with a real minus sign. */
  signed: (n: number) => string;
  /** "24 Nov" / "24 lis" */
  dayMonth: (d: Date) => string;
  /** "Wed 19 Nov" / "śr. 19 lis" */
  weekdayDate: (d: Date) => string;
  /** "November" / "listopad" */
  monthName: (d: Date) => string;
  /** "Nov" / "Lis", for chart labels */
  monthShort: (d: Date) => string;
  /** "November 2026" / "Listopad 2026" */
  monthYear: (d: Date) => string;
  /** 28.4 km / 28,4 km */
  kmPrecise: (metres: number) => string;
  /** 142 km, whole kilometres */
  km: (metres: number) => string;
  /** 28.7 km/h / 28,7 km/h */
  speed: (kmPerHour: number) => string;
  /** Longer spans: "18 h 20 min" / "18 godz. 20 min" */
  hours: (seconds: number) => string;
  /** Seconds as "52:30" or "1:04:12". */
  duration: (seconds: number) => string;
  /** Seconds per km as "5:45 /km". */
  pace: (secondsPerKm: number) => string;
  /** "5:30" for a range's ends */
  paceShort: (secondsPerKm: number) => string;
  bpm: (n: number) => string;
  /** How long ago a moment was: "12 min ago" / "12 min temu", "now" / "teraz". */
  ago: (ms: number, now?: number) => string;
}

/** 3125 → "52:05", 3852 → "1:04:12". */
function clock(seconds: number): string {
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = String(total % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

export function createFormat(locale: Locale): Format {
  const tag = locale === 'pl' ? 'pl-PL' : 'en-GB';
  const month = new Intl.DateTimeFormat(tag, { month: 'long' });
  const weekdayDate = new Intl.DateTimeFormat(tag, { weekday: 'short', day: 'numeric', month: 'short' });
  const dayMonth = new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short' });
  // en-GB writes "Sept"; chart labels want three letters.
  const monthShort = new Intl.DateTimeFormat(locale === 'pl' ? tag : 'en-US', { month: 'short' });
  const monthYear = new Intl.DateTimeFormat(tag, { month: 'long', year: 'numeric' });
  const relative = new Intl.RelativeTimeFormat(tag, { numeric: 'auto', style: 'short' });
  const oneDecimal = (n: number) => (locale === 'pl' ? n.toFixed(1).replace('.', ',') : n.toFixed(1));

  return {
    int: formatInt,
    signed: (n) => (Math.round(n) > 0 ? `+${formatInt(n)}` : formatInt(n)),
    // en-GB writes "14 Sept"; three letters like every other month.
    dayMonth: (d) => dayMonth.format(d).replace('.', '').replace('Sept', 'Sep'),
    weekdayDate: (d) => capitalise(weekdayDate.format(d).replace(/,/g, '').replace('Sept', 'Sep')),
    monthName: (d) => month.format(d),
    monthShort: (d) => capitalise(monthShort.format(d).replace('.', '')),
    monthYear: (d) => capitalise(monthYear.format(d)),
    kmPrecise: (metres) => `${oneDecimal(metres / 1000)}${NBSP}km`,
    km: (metres) => `${formatInt(metres / 1000)}${NBSP}km`,
    speed: (kmPerHour) => `${oneDecimal(kmPerHour)}${NBSP}km/h`,
    hours: (seconds) => {
      const total = Math.round(seconds / 60);
      const h = Math.floor(total / 60);
      const m = total % 60;
      const hUnit = locale === 'pl' ? 'godz.' : 'h';
      if (!h) return `${m}${NBSP}min`;
      return m ? `${formatInt(h)}${NBSP}${hUnit} ${m}${NBSP}min` : `${formatInt(h)}${NBSP}${hUnit}`;
    },
    duration: clock,
    pace: (secondsPerKm) => `${clock(secondsPerKm)}${NBSP}/km`,
    paceShort: clock,
    bpm: (n) => `${formatInt(n)}${NBSP}bpm`,
    ago: (ms, now = Date.now()) => {
      const minutes = Math.max(0, Math.round((now - ms) / 60_000));
      if (minutes < 60) return relative.format(-minutes, 'minute');
      const hours = Math.round(minutes / 60);
      return hours < 24 ? relative.format(-hours, 'hour') : relative.format(-Math.round(hours / 24), 'day');
    },
  };
}
