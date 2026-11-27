import type { CSSProperties } from 'react';
import { useApp } from '../app/context';
import { variantOf, type Signal, type Today } from '../domain/today';
import type { Zone } from '../domain/training';
import s from './TodayCard.module.css';

/**
 * Today's verdict and the signals behind it, on a soft tint of today's zone:
 * a headline (one of a few, the next one each day), a line of advice, then
 * a line per signal with a small mark (good, neutral, watch) that the line's
 * own words always explain.
 */
export function TodayCard({ today, asOf, zone }: { today: Today; asOf: string; zone: Zone | null }) {
  const { t } = useApp();
  const headlines = t.today.headline[today.verdict];
  const advice = t.today.advice[today.verdict];
  // Advice moves on a day later than the headline, so the pairs change too.
  const day = variantOf(asOf, headlines.length * advice.length);
  const tint = { '--tint': zone ? `var(--zone-${zone})` : 'var(--ink-muted)' } as CSSProperties;
  return (
    <section aria-labelledby="today-heading" className={s.card} style={tint}>
      <div className={s.inner}>
        <div className={s.verdictBlock}>
          <h2 id="today-heading" className={s.verdict}>
            {headlines[day % headlines.length]}
          </h2>
          <p className={s.advice}>{advice[Math.floor(day / headlines.length) % advice.length]}</p>
        </div>
        {today.signals.length > 0 && (
          <ul className={s.signals}>
            {today.signals.map((signal) => (
              <li key={signal.id} className={s.signal}>
                <span className={s.mark} data-rating={signal.rating} aria-hidden="true" />
                <span className="visually-hidden">{t.today.rating[signal.rating]}: </span>
                <SignalText signal={signal} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function SignalText({ signal }: { signal: Signal }) {
  const { t, f } = useApp();
  switch (signal.id) {
    case 'form':
      return <>{t.today.form(t.zones[signal.zone].name, signal.zone)}</>;
    case 'load':
      return <>{t.today.load(signal.level, f.int(signal.load7), f.int(signal.usual))}</>;
    case 'restHr':
      return <>{t.today.restHr(f.bpm(signal.bpm), Math.round(signal.change))}</>;
    case 'sleep':
      return <>{t.today.sleep(f.hours(signal.minutes * 60), signal.change, f.hours(Math.abs(signal.change ?? 0) * 60))}</>;
  }
}
