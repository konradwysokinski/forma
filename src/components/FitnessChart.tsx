import { useId } from 'react';
import { useApp } from '../app/context';
import type { Period } from '../domain/formSummary';
import type { TrainingDay } from '../domain/training';
import { useWidth } from '../lib/useWidth';
import { barWidth, dayX, niceStep, timeLabels } from './chartAxis';
import s from './Charts.module.css';

const HEIGHT = 220;
const BASE = 200; // baseline y; labels sit below it
const TOP = 6;
/** The tallest load bar reaches this share of the plot, so bars stay a quiet background. */
const LOAD_SHARE = 0.55;

/** Fitness as a blue line with a soft gradient, fatigue in violet, daily load as grey bars behind. */
export function FitnessChart({
  days,
  period,
  active = null,
}: {
  days: readonly TrainingDay[];
  period: Period;
  /** The day the pointer or keyboard is on: a guide line and dots on both lines. */
  active?: number | null;
}) {
  const { t, f } = useApp();
  const [ref, width] = useWidth<HTMLDivElement>(630);
  const gradient = useId();
  const n = days.length;
  if (!n) return null;

  const peak = Math.max(1, ...days.map((d) => Math.max(d.fitness, d.fatigue)));
  const step = niceStep(peak * 1.05);
  const yMax = Math.ceil((peak * 1.05) / step) * step;
  const y = (v: number) => BASE - (v / yMax) * (BASE - TOP);
  const x = (i: number) => dayX(i, n, width);
  const maxLoad = Math.max(1, ...days.map((d) => d.load));
  const bw = barWidth(n, width);

  const line = (pick: (d: TrainingDay) => number) =>
    days.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(pick(d)).toFixed(1)}`).join(' ');
  const fitnessPath = line((d) => d.fitness);
  const area = `${fitnessPath} L${x(n - 1).toFixed(1)},${BASE} L${x(0).toFixed(1)},${BASE} Z`;
  const last = days[n - 1]!;
  const ticks = Array.from({ length: yMax / step + 1 }, (_, i) => i * step);

  return (
    <div ref={ref} className={s.chart}>
      <svg
        role="img"
        aria-label={t.form.chartAria(
          f.int(days[0]!.fitness),
          f.int(last.fitness),
          f.int(last.fatigue),
          t.period.over[period],
        )}
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        className={s.svg}
      >
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--fitness)" stopOpacity="0.18" />
            <stop offset="1" stopColor="var(--fitness)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((v) => (
          <g key={v}>
            {v > 0 && <line x1={32} x2={width} y1={y(v)} y2={y(v)} className={s.grid} />}
            <text x={0} y={y(v) + 4} className={s.label}>
              {f.int(v)}
            </text>
          </g>
        ))}
        <line x1={32} x2={width} y1={BASE} y2={BASE} className={s.baseline} />
        {days.map((d, i) =>
          d.load > 0 ? (
            <rect
              key={d.date}
              x={x(i) - bw / 2}
              y={BASE - (d.load / maxLoad) * (BASE - TOP) * LOAD_SHARE}
              width={bw}
              height={(d.load / maxLoad) * (BASE - TOP) * LOAD_SHARE}
              rx={Math.min(1.25, bw / 2)}
              className={i === active ? `${s.load} ${s.loadOn}` : s.load}
            />
          ) : null,
        )}
        <path d={area} fill={`url(#${gradient})`} />
        <path d={line((d) => d.fatigue)} className={s.fatigue} />
        <path d={fitnessPath} className={s.fitness} />
        <line x1={x(n - 1)} x2={x(n - 1)} y1={TOP} y2={BASE} className={s.today} />
        {active !== null && active !== n - 1 && (
          <line x1={x(active)} x2={x(active)} y1={TOP} y2={BASE} className={s.guide} />
        )}
        {(() => {
          const at = active ?? n - 1;
          const d = days[at]!;
          return (
            <>
              <circle cx={x(at)} cy={y(d.fatigue)} r={4} className={s.fatigueDot} />
              <circle cx={x(at)} cy={y(d.fitness)} r={4.5} className={s.fitnessDot} />
            </>
          );
        })()}
        {timeLabels(days, period, f, width).map(({ i, label }) => (
          <text key={i} x={x(i)} y={HEIGHT - 2} className={s.label}>
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}
