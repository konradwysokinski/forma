import type { CSSProperties } from 'react';
import { useApp } from '../app/context';
import type { EasyHrMonth } from '../domain/easyHr';
import { dateOf, dayOf } from '../lib/days';
import s from './EasyHr.module.css';

/** Bar heights: the lowest month still shows a stub, the highest fills the plot. */
const BAR_MIN = 28;
const BAR_SPAN = 120;
/** Runs listed in a month's tooltip before "+2 more". */
const MAX_RUNS = 4;

const monthDate = (month: string) => dateOf(`${month}-15`);
const monthIndex = (month: string) => +month.slice(5) - 1;

/**
 * Easy-pace heart rate: the latest month large, against the first month shown,
 * then one bar per month with its value and how many runs it rests on. A
 * dashed line marks the average; hovering or focusing a bar opens the month:
 * heart rate, pace and its runs.
 */
export function EasyHrChart({ months }: { months: readonly EasyHrMonth[] }) {
  const { t, f } = useApp();
  const known = months.filter((m) => m.bpm !== null);
  if (!known.length) return <p className={s.empty}>{t.easyHr.empty}</p>;

  const first = known[0]!;
  const last = known[known.length - 1]!;
  const values = known.map((m) => m.bpm!);
  const lo = Math.min(...values) - 3;
  const hi = Math.max(...values);
  const height = (bpm: number) => BAR_MIN + ((bpm - lo) / Math.max(1, hi - lo)) * BAR_SPAN;
  // Time-weighted would need the runs' times; months weigh equally, as the bars do.
  const average = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const columns = { '--months': months.length } as CSSProperties;

  return (
    <div className={s.body}>
      <div className={s.headline}>
        <span className={s.big}>
          <span className={s.number}>{f.int(last.bpm!)}</span>
          <span className={s.unit}>{t.easyHr.unit(monthIndex(last.month))}</span>
        </span>
        {known.length > 1 && (
          <span className={s.chip}>{t.easyHr.change(last.bpm! - first.bpm!, monthIndex(first.month))}</span>
        )}
      </div>

      <div
        className={s.bars}
        role="group"
        aria-label={t.easyHr.aria(
          f.int(first.bpm!),
          f.monthName(monthDate(first.month)),
          f.int(last.bpm!),
          f.monthName(monthDate(last.month)),
        )}
        style={columns}
      >
        {known.length > 1 && (
          <span className={s.average} style={{ bottom: height(average) }} aria-hidden="true">
            <span className={s.averageLabel}>{t.easyHr.average(f.int(average))}</span>
          </span>
        )}
        {months.map((m, i) =>
          m.bpm === null ? (
            <div key={m.month} className={s.col}>
              <span className={s.value}>–</span>
            </div>
          ) : (
            <button
              key={m.month}
              type="button"
              className={s.col}
              data-latest={m.month === last.month || undefined}
              data-edge={i === 0 ? 'start' : i === months.length - 1 ? 'end' : undefined}
              aria-label={t.easyHr.barLabel(f.monthYear(monthDate(m.month)), f.bpm(m.bpm), t.easyHr.runs(m.runs))}
            >
              <span className={s.value}>{f.int(m.bpm)}</span>
              <span className={s.bar} style={{ height: height(m.bpm) }} />
              <MonthTip month={m} />
            </button>
          ),
        )}
      </div>

      <div className={s.labels} style={columns} aria-hidden="true">
        {months.map((m) => (
          <span key={m.month} className={s.label}>
            <span>{f.monthShort(monthDate(m.month))}</span>
            <span className={s.runs}>{m.runs ? t.easyHr.runs(m.runs) : ''}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** A month in detail, shown over its bar on hover or focus. */
function MonthTip({ month }: { month: EasyHrMonth }) {
  const { t, f } = useApp();
  const shown = month.list.slice(0, MAX_RUNS);
  return (
    <span className={s.tip} role="tooltip">
      <span className={s.tipTitle}>{f.monthYear(monthDate(month.month))}</span>
      <span className={s.tipRow}>
        <span className={s.tipLabel}>{t.easyHr.heartRate}</span>
        <span>{f.bpm(month.bpm!)}</span>
      </span>
      {month.pace !== null && (
        <span className={s.tipRow}>
          <span className={s.tipLabel}>{t.easyHr.pace}</span>
          <span>{f.pace(month.pace)}</span>
        </span>
      )}
      <span className={s.tipRuns}>
        {shown.map((a) => (
          <span key={a.id}>
            {[
              f.dayMonth(dateOf(dayOf(a.start))),
              f.kmPrecise(a.distance),
              f.pace(a.movingTime / (a.distance / 1000)),
              a.averageHeartrate && f.bpm(a.averageHeartrate),
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        ))}
        {month.list.length > shown.length && (
          <span className={s.tipLabel}>{t.form.moreActivities(month.list.length - shown.length)}</span>
        )}
      </span>
    </span>
  );
}
