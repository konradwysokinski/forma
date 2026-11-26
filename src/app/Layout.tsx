import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router';
import b from '../components/Button.module.css';
import { Icon } from '../components/Icon';
import { Segmented } from '../components/Segmented';
import { LOCALES, MESSAGES, type Locale } from '../i18n';
import { useApp } from './context';
import s from './Layout.module.css';

/** Re-renders every minute, so "Synced 3 min ago" stays true. */
function useMinuteTick() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);
}

/** Where the data comes from and how fresh it is, with the one action that fits. */
function SourceStatus() {
  const { t, f, source, sync, lastSync, syncNow, connectCoros, chooseSource } = useApp();
  useMinuteTick();

  if (source === 'sample') {
    return (
      <div className={s.status}>
        <span className={`${s.dot} ${s.dotQuiet}`} aria-hidden="true" />
        <span className={s.statusText}>{t.sidebar.sampleData}</span>
        <button type="button" className={`${b.text} ${s.action}`} onClick={chooseSource}>
          {t.sidebar.connect}
        </button>
      </div>
    );
  }

  if (sync.status === 'syncing') {
    return (
      <div className={s.status} role="status">
        <span className={`${s.dot} ${s.dotBusy}`} aria-hidden="true" />
        <span className={s.statusText}>{t.sidebar.syncing}</span>
      </div>
    );
  }

  if (sync.status === 'error') {
    return (
      <div className={s.status} role="alert" title={sync.message}>
        <span className={`${s.dot} ${s.dotWarn}`} aria-hidden="true" />
        <span className={s.statusText}>{t.sidebar.syncFailed}</span>
        <button
          type="button"
          className={`${b.text} ${s.action}`}
          onClick={() => (sync.signedOut ? void connectCoros() : syncNow())}
        >
          {sync.signedOut ? t.sidebar.reconnect : t.sidebar.retry}
        </button>
      </div>
    );
  }

  const synced = !lastSync
    ? t.sidebar.syncing
    : Date.now() - lastSync < 60_000
      ? t.sidebar.syncedJustNow
      : t.sidebar.synced(f.ago(lastSync));

  return (
    <button type="button" className={`${s.status} ${s.statusButton}`} onClick={syncNow} title={t.sidebar.syncNow}>
      <span className={s.dot} aria-hidden="true" />
      <span className={s.statusText}>{synced}</span>
      <span className="visually-hidden">, {t.sidebar.syncNow}</span>
    </button>
  );
}

/** Tinted sidebar plus one white content panel, as in Kilometr. */
export function Layout() {
  const { t, locale, setLocale, source, disconnectCoros } = useApp();
  return (
    <div className={s.app}>
      <nav aria-label={t.nav.label} className={s.sidebar}>
        <NavLink to="/" className={s.wordmark}>
          Forma
        </NavLink>
        <div className={s.group}>
          <NavLink to="/" end className={({ isActive }) => `${s.navRow} ${isActive ? s.active : ''}`}>
            <Icon name="form" className={s.navIcon} />
            {t.nav.form}
          </NavLink>
        </div>
        <div className={s.footer}>
          <SourceStatus />
          <div className={s.footerRow}>
            <Segmented<Locale>
              label={t.nav.language}
              value={locale}
              onChange={setLocale}
              options={LOCALES.map((l) => ({
                value: l,
                label: l.toUpperCase(),
                ariaLabel: MESSAGES[l].languageName,
                lang: l,
              }))}
            />
            {source === 'coros' && (
              <button
                type="button"
                className={`${b.text} ${s.quiet}`}
                onClick={() => void disconnectCoros()}
                title={t.sidebar.disconnectHint}
              >
                {t.sidebar.disconnect}
              </button>
            )}
          </div>
        </div>
      </nav>
      <main className={s.panel}>
        <Outlet />
      </main>
    </div>
  );
}
