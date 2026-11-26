import { useState } from 'react';
import { useApp } from '../app/context';
import b from '../components/Button.module.css';
import { Segmented } from '../components/Segmented';
import { LOCALES, MESSAGES, type Locale } from '../i18n';
import s from './Start.module.css';

/** First visit: connect COROS, or look around with the sample. */
export function Start() {
  const { t, connectCoros, showSample, locale, setLocale } = useApp();
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    setOpening(true);
    setError(null);
    try {
      await connectCoros(); // leaves the page for COROS's sign-in
    } catch (e) {
      setError((e as Error).message);
      setOpening(false);
    }
  };

  return (
    <div className={s.page}>
      <div className={s.intro}>
        <div className={s.wordmark}>Forma</div>
        <h1 className={s.title}>
          {t.start.title} <span className={s.muted}>{t.start.titleMuted}</span>
        </h1>
        <p className={s.lead}>{t.start.lead}</p>
      </div>

      <section aria-labelledby="connect-h" className={s.card}>
        <h2 id="connect-h" className={s.cardTitle}>
          {t.start.connectTitle}
        </h2>
        <p className={s.body}>{t.start.connectBody}</p>
        <div className={s.connect}>
          <button type="button" className={`${b.primary} ${b.large}`} onClick={connect} disabled={opening}>
            {opening ? t.start.connecting : t.start.connectButton}
          </button>
        </div>
        <p className={`${s.note} ${error ? s.error : ''}`} role="status">
          {error ? t.start.connectFailed(error) : t.start.connectNote}
        </p>
      </section>

      <footer className={s.footer}>
        <button type="button" className={b.text} onClick={showSample}>
          {t.start.sample}
        </button>
        <span aria-hidden="true">·</span>
        <span>{t.start.openSource}</span>
        <Segmented<Locale>
          label={t.nav.language}
          value={locale}
          onChange={setLocale}
          options={LOCALES.map((l) => ({ value: l, label: l.toUpperCase(), ariaLabel: MESSAGES[l].languageName, lang: l }))}
        />
      </footer>
    </div>
  );
}
