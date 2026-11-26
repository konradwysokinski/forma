import { useId } from 'react';
import { useApp } from '../app/context';
import type { EasyHrMonth } from '../domain/easyHr';
import { dateOf } from '../lib/days';
import { useWidth } from '../lib/useWidth';
import s from './Charts.module.css';

const HEIGHT = 150;
const BASE = 130;
const SIDE = 16;

const monthDate = (month: string) => dateOf(`${month}-15`);

/** Easy-pace heart rate per month: a red line over a gradient, each month's value above its point. */
export function EasyHrChart({ months }: { months: readonly EasyHrMonth[] }) {
  const { t, f } = useApp();
  const [ref, width] = useWidth<HTMLDivElement>(372);
  const gradient = useId();
  const known = months.filter((m) => m.bpm !== null);
  if (!known.length) return <p className={s.empty}>{t.easyHr.empty}</p>;

  const values = known.map((m) => m.bpm!);
  const lo = Math.min(...values) - 2;
  const hi = Math.max(...values) + 2;
  // Room above the highest point for its label.
  const y = (bpm: number) => BASE - 10 - ((bpm - lo) / Math.max(1, hi - lo)) * (BASE - 40);
  const x = (i: number) => SIDE + (months.length > 1 ? i / (months.length - 1) : 0.5) * (width - SIDE * 2);

  // The line (and the area under it) breaks over months without easy runs.
  const runs: { x: number; y: number }[][] = [];
  months.forEach((m, i) => {
    if (m.bpm === null) return runs.push([]);
    if (!runs.length) runs.push([]);
    runs[runs.length - 1]!.push({ x: x(i), y: y(m.bpm) });
  });
  const segments = runs.filter((r) => r.length);
  const pts = (r: { x: number; y: number }[]) => r.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L');
  const path = segments.map((r) => `M${pts(r)}`).join(' ');
  const area = segments
    .filter((r) => r.length > 1)
    .map((r) => `M${r[0]!.x.toFixed(1)},${BASE} L${pts(r)} L${r[r.length - 1]!.x.toFixed(1)},${BASE} Z`)
    .join(' ');

  const first = known[0]!;
  const last = known[known.length - 1]!;

  return (
    <div ref={ref} className={s.chart}>
      <svg
        role="img"
        aria-label={t.easyHr.aria(
          f.int(first.bpm!),
          f.monthName(monthDate(first.month)),
          f.int(last.bpm!),
          f.monthName(monthDate(last.month)),
        )}
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        className={s.svg}
      >
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--heart)" stopOpacity="0.28" />
            <stop offset="1" stopColor="var(--heart)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradient})`} />
        <line x1={0} x2={width} y1={BASE} y2={BASE} className={s.baseline} />
        <path d={path} className={s.heart} />
        {months.map((m, i) => (
          <g key={m.month}>
            {m.bpm !== null && (
              <>
                <circle cx={x(i)} cy={y(m.bpm)} r={3.5} className={s.heartDot} />
                <text x={x(i)} y={y(m.bpm) - 12} textAnchor="middle" className={s.heartLabel}>
                  {f.int(m.bpm)}
                </text>
              </>
            )}
            <text x={x(i)} y={HEIGHT - 2} textAnchor="middle" className={s.label}>
              {f.monthShort(monthDate(m.month))}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
