/**
 * What the athlete can set in Settings, over the estimates: max and resting
 * heart rate (for the load formula) and the easy-pace band (for heart rate at
 * easy pace). Anything left unset falls back to the estimate.
 */
import type { Athlete, PaceBand } from './types';

export interface TrainingSettings {
  maxHr?: number;
  restHr?: number;
  easyPace?: PaceBand;
}

/** Seconds per km: 5:30 to 6:00 /km. */
export const DEFAULT_EASY_PACE: PaceBand = { from: 330, to: 360 };

/** Plausible values; anything outside is a typo. */
export const LIMITS = {
  maxHr: { min: 140, max: 230 },
  restHr: { min: 30, max: 100 },
  /** Seconds per km, 2:30 to 12:00. */
  pace: { min: 150, max: 720 },
} as const;

/** Resting heart rate must stay this far below max, or the heart-rate reserve means nothing. */
export const MIN_RESERVE = 40;

export type SettingsError = 'maxHrRange' | 'restHrRange' | 'reserve' | 'paceFormat' | 'paceRange' | 'paceOrder';

export function athleteWith(estimate: Athlete, settings: TrainingSettings): Athlete {
  return {
    ...estimate,
    maxHr: settings.maxHr ?? estimate.maxHr,
    restHr: settings.restHr ?? estimate.restHr,
  };
}

/** Checks one heart rate against its limits and against the other bound. */
export function checkHeartRate(
  which: 'maxHr' | 'restHr',
  value: number,
  other: number,
): SettingsError | null {
  const { min, max } = LIMITS[which];
  if (!Number.isInteger(value) || value < min || value > max) return which === 'maxHr' ? 'maxHrRange' : 'restHrRange';
  const [maxHr, restHr] = which === 'maxHr' ? [value, other] : [other, value];
  return maxHr - restHr < MIN_RESERVE ? 'reserve' : null;
}

/** "5:30" → 330 seconds per km; null when it isn't m:ss. */
export function parsePace(text: string): number | null {
  const m = /^\s*(\d{1,2})[:.](\d{2})\s*$/.exec(text);
  if (!m) return null;
  const seconds = Number(m[2]);
  return seconds < 60 ? Number(m[1]) * 60 + seconds : null;
}

export function checkPaceBand(band: PaceBand): SettingsError | null {
  const { min, max } = LIMITS.pace;
  if ([band.from, band.to].some((p) => p < min || p > max)) return 'paceRange';
  return band.from < band.to ? null : 'paceOrder';
}

/** Reads saved settings, dropping anything that no longer passes the checks. */
export function readSettings(raw: unknown): TrainingSettings {
  if (!raw || typeof raw !== 'object') return {};
  const r = raw as Record<string, unknown>;
  const out: TrainingSettings = {};
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
  const maxHr = num(r.maxHr);
  const restHr = num(r.restHr);
  if (maxHr !== undefined && checkHeartRate('maxHr', maxHr, restHr ?? LIMITS.restHr.min) === null) out.maxHr = maxHr;
  if (restHr !== undefined && checkHeartRate('restHr', restHr, out.maxHr ?? LIMITS.maxHr.max) === null)
    out.restHr = restHr;
  const pace = r.easyPace as Record<string, unknown> | undefined;
  const from = num(pace?.from);
  const to = num(pace?.to);
  if (from !== undefined && to !== undefined && checkPaceBand({ from, to }) === null) out.easyPace = { from, to };
  return out;
}
