import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../app/context';
import b from '../components/Button.module.css';
import s from './CorosCallback.module.css';

/** COROS sends the athlete back here with a one-time code; the first sync then runs on the Form screen. */
export function CorosCallback() {
  const { t, finishCorosSignIn, chooseSource } = useApp();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // the code works once; StrictMode runs effects twice
    started.current = true;
    finishCorosSignIn(window.location.search).then(
      () => navigate('/', { replace: true }),
      (e: Error) => setError(e.message),
    );
  }, [finishCorosSignIn, navigate]);

  return (
    <div className={s.page}>
      <div className={s.wordmark}>Forma</div>
      {error ? (
        <div className={s.box} role="alert">
          <h1 className={s.title}>{t.callback.failed}</h1>
          <p className={s.muted}>{error}</p>
          <button
            type="button"
            className={b.secondary}
            onClick={() => {
              chooseSource();
              navigate('/', { replace: true });
            }}
          >
            {t.callback.back}
          </button>
        </div>
      ) : (
        <p className={s.muted} role="status">
          {t.callback.finishing}
        </p>
      )}
    </div>
  );
}
