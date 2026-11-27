import { useApp } from '../app/context';
import type { Period } from '../domain/formSummary';
import { useWidth } from '../lib/useWidth';
import { AXIS_LEFT, dayX } from './chartAxis';
import s from './Charts.module.css';

const HEIGHT = 56;
const TOP = 6;
const BASE = 50;

/**
 * Resting heart rate each morning, a thin line in --heart at the same x as
 * the other charts; gaps where COROS has no value. The scale fits the
 * period's own range, so a rise of a few beats shows.
 */
export function RestHrChart({
  days,
  average,
  period,
  active = null,
}: {
  /** One entry per chart day, null where there is no morning value. */
  days: readonly (number | null)[];
  average: number;
  period: Period;
  active?: number | null;
}) {
  const { t, f } = useApp();
  const [ref, width] = useWidth<HTMLDivElement>(630);
  const n = days.length;
  const known = days.filter((d): d is number => d !== null);
  if (!n || !known.length) return null;

  const lo = Math.min(...known) - 2;
  const hi = Math.max(...known) + 2;
  const y = (bpm: number) => BASE - ((bpm - lo) / Math.max(1, hi - lo)) * (BASE - TOP);
  const x = (i: number) => dayX(i, n, width);
  // A path that lifts the pen over missing mornings.
  let path = '';
  days.forEach((bpm, i) => {
    if (bpm === null) return;
    path += `${i > 0 && days[i - 1] !== null ? 'L' : 'M'}${x(i).toFixed(1)},${y(bpm).toFixed(1)} `;
  });
  const shownActive = active !== null ? days[active] : null;

  return (
    <div ref={ref} className={s.chart}>
      <svg
        role="img"
        aria-label={t.restHr.aria(t.period.over[period], f.bpm(Math.round(average)))}
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        className={s.svg}
      >
        {[Math.ceil(lo + 2), Math.floor(hi - 2)].map((bpm) => (
          <g key={bpm}>
            <line x1={AXIS_LEFT - 4} x2={width} y1={y(bpm)} y2={y(bpm)} className={s.grid} />
            <text x={0} y={y(bpm) + 4} className={s.label}>
              {bpm}
            </text>
          </g>
        ))}
        <path d={path} className={s.restHr} />
        {/* A lone morning between gaps still shows as a dot. */}
        {days.map((bpm, i) =>
          bpm !== null && days[i - 1] == null && days[i + 1] == null ? (
            <circle key={i} cx={x(i)} cy={y(bpm)} r={1.5} className={s.restHrDot} />
          ) : null,
        )}
        <line x1={x(n - 1)} x2={x(n - 1)} y1={0} y2={HEIGHT} className={s.today} />
        {active !== null && active !== n - 1 && (
          <line x1={x(active)} x2={x(active)} y1={0} y2={HEIGHT} className={s.guide} />
        )}
        {shownActive != null && <circle cx={x(active!)} cy={y(shownActive)} r={3} className={s.restHrDot} />}
      </svg>
    </div>
  );
}
