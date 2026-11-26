import { useApp } from '../app/context';
import type { Period } from '../domain/formSummary';
import { sleepLevel, type SleepLevel } from '../domain/sleep';
import type { SleepNight } from '../domain/types';
import { useWidth } from '../lib/useWidth';
import { AXIS_LEFT, barWidth, dayX } from './chartAxis';
import s from './Charts.module.css';

const HEIGHT = 56;
const BASE = 52;
/** Bars are drawn on a 0–10 h scale; longer nights stop at the top. */
const MAX_HOURS = 10;
const PLOT = 46;
const GRID_HOURS = [4, 8];
/** Three steps of the sleep colour: darker for a better score. */
const SHADE: Record<SleepLevel, number> = { low: 0.3, mid: 0.6, good: 1 };

/**
 * One bar per night, on the day it ended, at the same x as the fitness and
 * form charts: hours asleep (naps included), shaded by sleep score.
 */
export function SleepChart({
  nights,
  average,
  period,
  active = null,
}: {
  /** One entry per chart day, null where there is no night. */
  nights: readonly (SleepNight | null)[];
  /** Average minutes over the nights shown. */
  average: number;
  period: Period;
  active?: number | null;
}) {
  const { t, f } = useApp();
  const [ref, width] = useWidth<HTMLDivElement>(630);
  const n = nights.length;
  if (!n) return null;

  const y = (hours: number) => BASE - (Math.min(hours, MAX_HOURS) / MAX_HOURS) * PLOT;
  const x = (i: number) => dayX(i, n, width);
  const bw = barWidth(n, width);

  return (
    <div ref={ref} className={s.chart}>
      <svg
        role="img"
        aria-label={t.sleep.aria(t.period.over[period], f.hours(average * 60))}
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        className={s.svg}
      >
        {GRID_HOURS.map((h) => (
          <g key={h}>
            <line x1={AXIS_LEFT - 4} x2={width} y1={y(h)} y2={y(h)} className={s.grid} />
            <text x={0} y={y(h) + 4} className={s.label}>
              {t.sleep.axis(h)}
            </text>
          </g>
        ))}
        {nights.map((night, i) => {
          if (!night) return null;
          const top = y(night.minutes / 60);
          return (
            <rect
              key={night.date}
              x={x(i) - bw / 2}
              y={top}
              width={bw}
              height={BASE - top}
              rx={Math.min(1.25, bw / 2)}
              className={s.sleep}
              fillOpacity={SHADE[sleepLevel(night.score)] * (active === null || i === active ? 1 : 0.45)}
            />
          );
        })}
        <line x1={AXIS_LEFT - 4} x2={width} y1={BASE} y2={BASE} className={s.baseline} />
        <line x1={x(n - 1)} x2={x(n - 1)} y1={0} y2={HEIGHT} className={s.today} />
        {active !== null && active !== n - 1 && (
          <line x1={x(active)} x2={x(active)} y1={0} y2={HEIGHT} className={s.guide} />
        )}
      </svg>
    </div>
  );
}
