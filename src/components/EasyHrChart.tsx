import type { CSSProperties } from 'react';
import { useApp } from '../app/context';
import type { EasyHrMonth } from '../domain/easyHr';
import { dateOf } from '../lib/days';
import s from './EasyHr.module.css';

/** Bar heights: the lowest month still shows a stub, the highest fills the plot. */
const BAR_MIN = 28;
const BAR_SPAN = 120;

const monthDate = (month: string) => dateOf(`${month}-15`);
const monthIndex = (month: string) => +month.slice(5) - 1;

/**
 * Easy-pace heart rate: the latest month large, against the first month shown,
 * then one bar per month with its value and how many runs it rests on.
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
        role="img"
        aria-label={t.easyHr.aria(
          f.int(first.bpm!),
          f.monthName(monthDate(first.month)),
          f.int(last.bpm!),
          f.monthName(monthDate(last.month)),
        )}
        style={{ '--months': months.length } as CSSProperties}
      >
        {months.map((m) => (
          <div key={m.month} className={s.col} data-latest={m.month === last.month || undefined}>
            <span className={s.value}>{m.bpm === null ? '–' : f.int(m.bpm)}</span>
            {m.bpm !== null && <span className={s.bar} style={{ height: height(m.bpm) }} />}
          </div>
        ))}
      </div>

      <div className={s.labels} style={{ '--months': months.length } as CSSProperties} aria-hidden="true">
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
