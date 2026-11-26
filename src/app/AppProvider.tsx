import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { SAMPLE } from '../data/sample';
import { createFormat, detectLocale, LOCALES, MESSAGES, type Locale } from '../i18n';
import { AppContext, type AppState } from './context';

const KEY_LOCALE = 'forma.locale';
const DARK_QUERY = '(prefers-color-scheme: dark)';

function readLocale(): Locale {
  try {
    const saved = localStorage.getItem(KEY_LOCALE);
    if (saved && (LOCALES as string[]).includes(saved)) return saved as Locale;
  } catch {
    /* storage blocked: follow the browser */
  }
  return detectLocale();
}

const subscribeDark = (onChange: () => void) => {
  const mq = window.matchMedia(DARK_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
};

/**
 * App-wide state. For now the data is the sample; connecting Strava will swap
 * it for the athlete's own, kept in IndexedDB (src/lib/db.ts).
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readLocale);
  // Until Settings exists, the theme follows the system.
  const dark = useSyncExternalStore(subscribeDark, () => window.matchMedia(DARK_QUERY).matches);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<AppState>(
    () => ({
      data: SAMPLE,
      locale,
      setLocale: (next) => {
        setLocaleState(next);
        try {
          localStorage.setItem(KEY_LOCALE, next);
        } catch {
          /* remembered for this visit only */
        }
      },
      t: MESSAGES[locale],
      f: createFormat(locale),
    }),
    [locale],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
