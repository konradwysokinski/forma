import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import b from '../components/Button.module.css';
import { Icon } from '../components/Icon';
import { SettingsDialog } from '../components/SettingsDialog';
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
  const { t, f, source, sync, elevation, lastSync, syncNow, connectCoros, chooseSource } = useApp();
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

  // Runs' elevation, fetched quietly after a sync: the same row, a busy dot and a count (no source label, so it fits on one line).
  if (elevation) {
    return (
      <button type="button" className={`${s.status} ${s.statusButton}`} onClick={syncNow} title={t.sidebar.elevationHint}>
        <span className={`${s.dot} ${s.dotBusy}`} aria-hidden="true" />
        <span className={s.statusText}>{t.sidebar.elevation(f.int(elevation.done), f.int(elevation.total))}</span>
        <span className="visually-hidden">, {t.sidebar.syncNow}</span>
      </button>
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
      <span className={s.source}>COROS</span>
      <span className="visually-hidden">, {t.sidebar.syncNow}</span>
    </button>
  );
}

export const SETTINGS_PATH = '/settings';
export const ACTIVITIES_PATH = '/activities';

/**
 * Tinted sidebar plus one white content panel, as in Kilometr. Settings open
 * at /settings as a modal over the screen that was showing.
 */
export function Layout() {
  const { t } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const fromApp = (location.state as { fromApp?: boolean } | null)?.fromApp;
  const closeSettings = () => (fromApp ? navigate(-1) : navigate('/', { replace: true }));
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
          <NavLink to={ACTIVITIES_PATH} className={({ isActive }) => `${s.navRow} ${isActive ? s.active : ''}`}>
            <Icon name="activities" className={s.navIcon} />
            {t.nav.activities}
          </NavLink>
        </div>
        <div className={s.footer}>
          <SourceStatus />
          <NavLink
            to={SETTINGS_PATH}
            state={{ fromApp: true, from: location.pathname }}
            className={({ isActive }) => `${s.navRow} ${isActive ? s.active : ''}`}
          >
            <Icon name="settings" className={s.navIcon} />
            <span className={s.navLabel}>{t.nav.settings}</span>
          </NavLink>
        </div>
      </nav>
      <main className={s.panel}>
        <Outlet />
      </main>
      {location.pathname === SETTINGS_PATH && <SettingsDialog onClose={closeSettings} />}
    </div>
  );
}
