import { createContext, useContext } from 'react';
import type { TrainingSettings } from '../domain/settings';
import type { Athlete, Dataset } from '../domain/types';
import type { Format, Locale, Messages } from '../i18n';

/** Where the data comes from: nothing chosen yet (Start), the sample, or the athlete's COROS account. */
export type Source = 'loading' | 'none' | 'sample' | 'coros';

export type Theme = 'light' | 'dark';
/** 'system' follows the computer's light or dark setting. */
export type ThemePref = Theme | 'system';

export type SyncState =
  | { status: 'idle' }
  /** `progress` 0–1; only the first, long sync reports it. */
  | { status: 'syncing'; progress: number | null }
  /** `signedOut`: COROS no longer accepts the sign-in, so the athlete must connect again. */
  | { status: 'error'; message: string; signedOut: boolean };

/** Runs' elevation being fetched in the background, after a sync. */
export interface ElevationProgress {
  done: number;
  total: number;
}

export interface AppState {
  source: Source;
  /** The data the screens show; empty until the first COROS sync has finished. */
  data: Dataset;
  sync: SyncState;
  /** Set while runs' elevation is being fetched; null otherwise. */
  elevation: ElevationProgress | null;
  /** Milliseconds since the epoch, null before the first sync. */
  lastSync: number | null;
  showSample: () => void;
  /** Back to Start, keeping nothing chosen. */
  chooseSource: () => void;
  connectCoros: () => Promise<void>;
  /** Called on COROS's redirect back with its `location.search`. */
  finishCorosSignIn: (search: string) => Promise<void>;
  syncNow: () => void;
  disconnectCoros: () => Promise<void>;
  /** Deletes everything Forma keeps in this browser except theme and language, and goes back to Start. */
  removeAllData: () => Promise<void>;
  /** What the athlete set in Settings (heart rate, easy pace); the data above already uses it. */
  training: TrainingSettings;
  setTraining: (next: TrainingSettings) => void;
  /** The heart rates Forma would use without settings; `restFromCoros` when rest is COROS's median. */
  estimate: Athlete & { restFromCoros: boolean };
  /** The theme in use, with 'system' resolved. */
  theme: Theme;
  themePref: ThemePref;
  setThemePref: (pref: ThemePref) => void;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Messages;
  f: Format;
}

// Kept in its own module so hot reloads of the provider don't recreate the context.
export const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const state = useContext(AppContext);
  if (!state) throw new Error('useApp outside AppProvider');
  return state;
}
