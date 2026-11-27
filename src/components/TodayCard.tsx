import { useApp } from "../app/context";
import { variantOf, type Signal, type Today } from "../domain/today";
import s from "./TodayCard.module.css";

/**
 * Today's verdict and the signals behind it: one sentence on what to do,
 * then a line per signal with a small mark (good, neutral, watch) that the
 * line's own words always explain.
 */
export function TodayCard({ today, asOf }: { today: Today; asOf: string }) {
  const { t } = useApp();
  const advice = t.today.advice[today.verdict];
  return (
    <section aria-labelledby="today-heading" className={s.card}>
      <div className={s.inner}>
        <div className={s.verdictBlock}>
          <h2 id="today-heading" className={s.verdict}>
            <span className={s.label}>{t.today.label}</span>
            {t.today.verdict[today.verdict]}
          </h2>
          <p className={s.advice}>{advice[variantOf(asOf, advice.length)]}</p>
        </div>
        {today.signals.length > 0 && (
          <ul className={s.signals}>
            {today.signals.map((signal) => (
              <li key={signal.id} className={s.signal}>
                <span
                  className={s.mark}
                  data-rating={signal.rating}
                  aria-hidden="true"
                />
                <span className="visually-hidden">
                  {t.today.rating[signal.rating]}:{" "}
                </span>
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
    case "form":
      return <>{t.today.form(t.zones[signal.zone].name, signal.zone)}</>;
    case "load":
      return (
        <>
          {t.today.load(signal.level, f.int(signal.load7), f.int(signal.usual))}
        </>
      );
    case "restHr":
      return (
        <>{t.today.restHr(f.bpm(signal.bpm), Math.round(signal.change))}</>
      );
    case "sleep":
      return (
        <>
          {t.today.sleep(
            f.hours(signal.minutes * 60),
            signal.change,
            f.hours(Math.abs(signal.change ?? 0) * 60),
          )}
        </>
      );
  }
}
