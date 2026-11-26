import { createContext, useContext } from 'react';
import type { Dataset } from '../domain/types';
import type { Format, Locale, Messages } from '../i18n';

/** Where the data comes from: nothing chosen yet (Start), the sample, or the athlete's COROS account. */
export type Source = 'loading' | 'none' | 'sample' | 'coros';

export type SyncState =
  | { status: 'idle' }
  /** `progress` 0–1; only the first, long sync reports it. */
  | { status: 'syncing'; progress: number | null }
  /** `signedOut`: COROS no longer accepts the sign-in, so the athlete must connect again. */
  | { status: 'error'; message: string; signedOut: boolean };

export interface AppState {
  source: Source;
  /** The data the screens show; empty until the first COROS sync has finished. */
  data: Dataset;
  sync: SyncState;
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
