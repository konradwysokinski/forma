import { useApp } from '../app/context';
import b from '../components/Button.module.css';
import s from './FirstSync.module.css';

/** Shown instead of the Form screen until the first COROS sync has brought in data. */
export function FirstSync() {
  const { t, sync, syncNow, connectCoros } = useApp();
  const progress = sync.status === 'syncing' ? (sync.progress ?? 0) : 0;

  return (
    <>
      <header>
        <h1 className={s.title}>
          {t.firstSync.title} <span className={s.muted}>{t.firstSync.titleMuted}</span>
        </h1>
      </header>
      <section className={s.card}>
        {sync.status === 'error' ? (
          <div className={s.error} role="alert">
            <p className={s.errorTitle}>{t.firstSync.failed}</p>
            <p className={s.muted}>{sync.message}</p>
            <button
              type="button"
              className={b.secondary}
              onClick={() => (sync.signedOut ? void connectCoros() : syncNow())}
            >
              {sync.signedOut ? t.firstSync.reconnect : t.firstSync.retry}
            </button>
          </div>
        ) : (
          <>
            <p className={s.muted}>{t.firstSync.body}</p>
            <div
              className={s.track}
              role="progressbar"
              aria-label={t.firstSync.progressLabel}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
            >
              <div className={s.fill} style={{ width: `${Math.max(3, progress * 100)}%` }} />
            </div>
          </>
        )}
      </section>
    </>
  );
}
