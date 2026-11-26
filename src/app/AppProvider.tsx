import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { corosAthlete, corosSource } from '../coros/client';
import { corosTokens, finishCorosSignIn, forgetCoros, startCorosSignIn } from '../coros/oauth';
import { clearCorosData, loadCorosData, saveCorosData, type CorosData } from '../coros/store';
import { syncActivities } from '../coros/sync';
import { SAMPLE } from '../data/sample';
import { estimateAthlete } from '../domain/load';
import type { Dataset } from '../domain/types';
import { createFormat, detectLocale, LOCALES, MESSAGES, type Locale } from '../i18n';
import { todayKey } from '../lib/days';
import { AppContext, type AppState, type Source, type SyncState } from './context';

const KEY_LOCALE = 'forma.locale';
/** Remembers that the athlete chose the sample on Start. */
const KEY_SAMPLE = 'forma.sample';
const DARK_QUERY = '(prefers-color-scheme: dark)';
/** Data older than this is refreshed when Forma opens or comes back into view. */
const RESYNC_AFTER_MS = 60 * 60 * 1000;

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
 * background when it is more than an hour old.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readLocale);
  // Until Settings exists, the theme follows the system.
  const dark = useSyncExternalStore(subscribeDark, () => window.matchMedia(DARK_QUERY).matches);
  const [source, setSource] = useState<Source>('loading');
  const [coros, setCoros] = useState<CorosData | null>(null);
  const [sync, setSync] = useState<SyncState>({ status: 'idle' });
  const corosRef = useRef<CorosData | null>(null);
  const syncing = useRef(false);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);

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
      const [activities, athlete] = await Promise.all([
        syncActivities(
          corosSource(tokens),
          stored?.activities ?? [],
          todayKey(),
          first ? (progress) => setSync({ status: 'syncing', progress }) : undefined,
        ),
        corosAthlete(tokens),
      ]);
      const next: CorosData = { activities, lastSync: Date.now(), ...athlete };
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
    if (stored && Date.now() - stored.lastSync > RESYNC_AFTER_MS) void runSync();
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

  const data = useMemo<Dataset>(() => {
    if (source !== 'coros') return SAMPLE;
    const activities = coros?.activities ?? [];
    const estimated = estimateAthlete(activities);
    return {
      source: 'coros',
      activities,
      athlete: { ...estimated, restHr: coros?.restHr ?? estimated.restHr, sex: coros?.sex },
      asOf: todayKey(),
    };
  }, [source, coros]);

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
      disconnectCoros: async () => {
        forgetCoros();
        await clearCorosData();
        corosRef.current = null;
        setCoros(null);
        setSync({ status: 'idle' });
        setSource('none');
      },
      locale,
      setLocale: (next) => {
        setLocaleState(next);
        storage.set(KEY_LOCALE, next);
      },
      t: MESSAGES[locale],
      f: createFormat(locale),
    }),
    [source, data, sync, coros, runSync, locale],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
