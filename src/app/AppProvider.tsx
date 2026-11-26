import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { corosAthlete, corosSource } from '../coros/client';
import { corosTokens, finishCorosSignIn, forgetCoros, startCorosSignIn } from '../coros/oauth';
import { clearCorosData, loadCorosData, saveCorosData, type CorosData } from '../coros/store';
import { needsSync, syncActivities, syncSleep } from '../coros/sync';
import { SAMPLE } from '../data/sample';
import { estimateAthlete } from '../domain/load';
import { athleteWith, DEFAULT_EASY_PACE, readSettings, type TrainingSettings } from '../domain/settings';
import type { Dataset } from '../domain/types';
import { createFormat, detectLocale, LOCALES, MESSAGES, type Locale } from '../i18n';
import { todayKey } from '../lib/days';
import { AppContext, type AppState, type Source, type SyncState, type ThemePref } from './context';

const KEY_LOCALE = 'forma.locale';
/** Remembers that the athlete chose the sample on Start. */
const KEY_SAMPLE = 'forma.sample';
/** Light, dark or system; index.html reads it too, before the first paint. */
const KEY_THEME = 'forma.theme';
/** Heart rate and easy pace set in Settings. */
const KEY_TRAINING = 'forma.training';
const DARK_QUERY = '(prefers-color-scheme: dark)';

const storage = {
  get: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string | null) => {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      /* remembered for this visit only */
    }
  },
};

function readLocale(): Locale {
  const saved = storage.get(KEY_LOCALE);
  return saved && (LOCALES as string[]).includes(saved) ? (saved as Locale) : detectLocale();
}

function readThemePref(): ThemePref {
  const saved = storage.get(KEY_THEME);
  return saved === 'dark' || saved === 'system' ? saved : 'light';
}

function readTraining(): TrainingSettings {
  try {
    return readSettings(JSON.parse(storage.get(KEY_TRAINING) ?? 'null'));
  } catch {
    return {};
  }
}

const subscribeDark = (onChange: () => void) => {
  const mq = window.matchMedia(DARK_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
};

class SignedOutError extends Error {}

/** COROS answers 401 to an expired sign-in, and refuses to refresh one that has run out. */
const isSignedOut = (e: unknown) =>
  e instanceof SignedOutError || /token request failed \(4\d\d\)|\(401\)/.test((e as Error).message ?? '');

/**
 * App-wide state: the language, the data source and the data. COROS data
 * lives in IndexedDB (src/coros/store.ts) and is brought up to date in the
 * background when it is more than an hour old, or has no sleep yet.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readLocale);
  const [themePref, setThemePrefState] = useState<ThemePref>(readThemePref);
  const systemDark = useSyncExternalStore(subscribeDark, () => window.matchMedia(DARK_QUERY).matches);
  const theme = themePref === 'system' ? (systemDark ? 'dark' : 'light') : themePref;
  const [training, setTrainingState] = useState<TrainingSettings>(readTraining);
  const [source, setSource] = useState<Source>('loading');
  const [coros, setCoros] = useState<CorosData | null>(null);
  const [sync, setSync] = useState<SyncState>({ status: 'idle' });
  const corosRef = useRef<CorosData | null>(null);
  const syncing = useRef(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const runSync = useCallback(async () => {
    if (syncing.current) return;
    syncing.current = true;
    const stored = corosRef.current;
    const first = !stored?.activities.length;
    setSync({ status: 'syncing', progress: first ? 0 : null });
    try {
      const tokens = await corosTokens();
      if (!tokens) throw new SignedOutError('Not signed in to COROS.');
      const source = corosSource(tokens);
      const [activities, sleep, athlete] = await Promise.all([
        syncActivities(
          source,
          stored?.activities ?? [],
          todayKey(),
          first ? (progress) => setSync({ status: 'syncing', progress }) : undefined,
        ),
        syncSleep(source, stored?.sleep ?? [], todayKey()),
        corosAthlete(tokens),
      ]);
      const next: CorosData = { activities, sleep, lastSync: Date.now(), ...athlete };
      await saveCorosData(next);
      corosRef.current = next;
      setCoros(next);
      setSync({ status: 'idle' });
    } catch (e) {
      setSync({ status: 'error', message: (e as Error).message, signedOut: isSignedOut(e) });
    } finally {
      syncing.current = false;
    }
  }, []);

  const syncIfStale = useCallback(() => {
    const stored = corosRef.current;
    if (stored && needsSync(stored, Date.now())) void runSync();
  }, [runSync]);

  // Where the data comes from: stored COROS data, the remembered sample, a sign-in without data yet, or Start.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadCorosData().catch(() => undefined);
      if (cancelled) return;
      if (stored) {
        corosRef.current = stored;
        setCoros(stored);
        setSource('coros');
        syncIfStale();
      } else if (storage.get(KEY_SAMPLE)) {
        setSource('sample');
      } else if (await corosTokens().catch(() => null)) {
        if (cancelled) return;
        setSource('coros');
        void runSync();
      } else if (!cancelled) {
        setSource('none');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [runSync, syncIfStale]);

  // Coming back to Forma after a while: refresh.
  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && syncIfStale();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [syncIfStale]);

  // The heart rates Forma works out by itself; Settings can replace them.
  const estimate = useMemo(() => {
    if (source !== 'coros') return { ...SAMPLE.athlete, restFromCoros: false };
    const estimated = estimateAthlete(coros?.activities ?? []);
    return {
      ...estimated,
      restHr: coros?.restHr ?? estimated.restHr,
      sex: coros?.sex,
      restFromCoros: coros?.restHr !== undefined,
    };
  }, [source, coros]);

  const data = useMemo<Dataset>(() => {
    const { restFromCoros: _, ...base } = estimate;
    const athlete = athleteWith(base, training);
    const easyPace = training.easyPace ?? DEFAULT_EASY_PACE;
    if (source !== 'coros') return { ...SAMPLE, athlete, easyPace };
    return {
      source: 'coros',
      activities: coros?.activities ?? [],
      sleep: coros?.sleep ?? [],
      athlete,
      easyPace,
      asOf: todayKey(),
    };
  }, [source, coros, estimate, training]);

  const disconnectCoros = useCallback(async () => {
    forgetCoros();
    await clearCorosData();
    corosRef.current = null;
    setCoros(null);
    setSync({ status: 'idle' });
    setSource('none');
  }, []);

  const value = useMemo<AppState>(
    () => ({
      source,
      data,
      sync,
      lastSync: coros?.lastSync ?? null,
      showSample: () => {
        storage.set(KEY_SAMPLE, '1');
        setSource('sample');
      },
      chooseSource: () => {
        storage.set(KEY_SAMPLE, null);
        setSource('none');
      },
      connectCoros: startCorosSignIn,
      finishCorosSignIn: async (search) => {
        await finishCorosSignIn(search);
        storage.set(KEY_SAMPLE, null);
        setSource('coros');
        void runSync();
      },
      syncNow: () => void runSync(),
      disconnectCoros,
      removeAllData: async () => {
        storage.set(KEY_SAMPLE, null);
        storage.set(KEY_TRAINING, null);
        setTrainingState({});
        await disconnectCoros();
      },
      training,
      setTraining: (patch) => {
        // Unset values (back to the estimate) are dropped, not saved as undefined.
        const next = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
        setTrainingState(next);
        storage.set(KEY_TRAINING, Object.keys(next).length ? JSON.stringify(next) : null);
      },
      estimate,
      theme,
      themePref,
      setThemePref: (next) => {
        setThemePrefState(next);
        storage.set(KEY_THEME, next);
      },
      locale,
      setLocale: (next) => {
        setLocaleState(next);
        storage.set(KEY_LOCALE, next);
      },
      t: MESSAGES[locale],
      f: createFormat(locale),
    }),
    [source, data, sync, coros, runSync, disconnectCoros, training, estimate, theme, themePref, locale],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
