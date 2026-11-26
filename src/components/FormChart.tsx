import { useApp } from '../app/context';
import type { Period } from '../domain/formSummary';
import { ZONES, zoneOf, type TrainingDay, type Zone } from '../domain/training';
import { useWidth } from '../lib/useWidth';
import { AXIS_LEFT, barWidth, dayX } from './chartAxis';
import s from './Charts.module.css';

const HEIGHT = 150;
/** Form shown from +40% down to −50%; days beyond are drawn at the edge. */
const TOP_PCT = 40;
const BOTTOM_PCT = -50;
const PLOT = 148;

/** Each zone's band on the chart: from its lower edge up to the next zone's. */
const BANDS: readonly { id: Zone; from: number; to: number }[] = ZONES.map((z, i) => ({
  id: z.id,
  from: Math.max(BOTTOM_PCT, z.above),
  to: i === 0 ? TOP_PCT : ZONES[i - 1]!.above,
}));

/** Form as daily bars around zero, each coloured by its zone, over faint zone bands. */
export function FormChart({ days, period }: { days: readonly TrainingDay[]; period: Period }) {
  const { t, f } = useApp();
  const [ref, width] = useWidth<HTMLDivElement>(630);
  const n = days.length;
  if (!n) return null;

  const y = (pct: number) => 1 + ((TOP_PCT - pct) / (TOP_PCT - BOTTOM_PCT)) * PLOT;
  const x = (i: number) => dayX(i, n, width);
  const bw = barWidth(n, width);
  const last = days[n - 1]!;

  return (
    <div ref={ref} className={s.chart}>
      <svg
        role="img"
        aria-label={
          last.form === null
            ? t.form.noData
            : t.form.formAria(t.period.over[period], f.signed(last.form), t.zones[zoneOf(last.form)].name)
        }
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        className={s.svg}
      >
        {BANDS.map((b) => (
          <rect
            key={b.id}
            x={AXIS_LEFT - 4}
            y={y(b.to)}
            width={width - AXIS_LEFT + 4}
            height={y(b.from) - y(b.to)}
            fill={`var(--zone-${b.id}-tint)`}
          />
        ))}
        {[20, 5, -10, -30].map((v) => (
          <text key={v} x={0} y={y(v) + 4} className={s.label}>
            {f.signed(v)}
          </text>
        ))}
        <line x1={AXIS_LEFT - 4} x2={width} y1={y(0)} y2={y(0)} className={s.zero} />
        {days.map((d, i) => {
          if (d.form === null) return null;
          const pct = Math.min(TOP_PCT - 2, Math.max(BOTTOM_PCT + 2, d.form));
          return (
            <rect
              key={d.date}
              x={x(i) - bw / 2}
              y={Math.min(y(pct), y(0))}
              width={bw}
              height={Math.max(1.5, Math.abs(y(pct) - y(0)))}
              rx={Math.min(1.25, bw / 2)}
              fill={`var(--zone-${zoneOf(d.form)})`}
            />
          );
        })}
        <line x1={x(n - 1)} x2={x(n - 1)} y1={0} y2={HEIGHT} className={s.today} />
      </svg>
    </div>
  );
}
