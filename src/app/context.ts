import { createContext, useContext } from 'react';
import type { Dataset } from '../domain/types';
import type { Format, Locale, Messages } from '../i18n';

export interface AppState {
  data: Dataset;
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
