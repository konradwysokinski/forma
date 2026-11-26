import type { CSSProperties } from 'react';
import { useApp } from '../app/context';
import { zoneOf, type TrainingDay } from '../domain/training';
import type { Activity, SleepNight } from '../domain/types';
import { dateOf } from '../lib/days';
import s from './DayTooltip.module.css';

/** Activities listed before "+2 more". */
const MAX_ACTIVITIES = 4;

/** One activity in a line: name · distance (or time when it has none) · heart rate. */
export function activityLine(a: Activity, f: ReturnType<typeof useApp>['f']) {
  return [a.name, a.distance > 0 ? f.kmPrecise(a.distance) : f.duration(a.movingTime), a.averageHeartrate && f.bpm(a.averageHeartrate)]
    .filter(Boolean)
    .join(' · ');
}

/** A night in a line: hours asleep · score. */
export function sleepLine(night: SleepNight, t: ReturnType<typeof useApp>['t'], f: ReturnType<typeof useApp>['f']) {
  return [f.hours(night.minutes * 60), night.score !== null && t.sleep.score(night.score)].filter(Boolean).join(' · ');
}

/** What a day on the charts holds: form, fitness, fatigue, load and its activities. */
export function DayTooltip({
  day,
  activities,
  night,
  style,
  side,
}: {
  day: TrainingDay;
  activities: readonly Activity[];
  /** The night that ended this day; undefined while the sleep strip is off, null when there is none. */
  night?: SleepNight | null;
  style: CSSProperties;
  /** Which side of the guide line the card sits on. */
  side: 'left' | 'right';
}) {
  const { t, f } = useApp();
  const zone = day.form === null ? null : zoneOf(day.form);
  const shown = activities.slice(0, MAX_ACTIVITIES);
  const rows: { key: 'fitness' | 'fatigue' | 'load' | 'sleep'; label: string; value: string }[] = [
    { key: 'fitness', label: t.form.fitness, value: f.int(day.fitness) },
    { key: 'fatigue', label: t.form.fatigue, value: f.int(day.fatigue) },
    { key: 'load', label: t.form.dayLoad, value: f.int(day.load) },
  ];
  if (night !== undefined) rows.push({ key: 'sleep', label: t.sleep.label, value: night ? sleepLine(night, t, f) : '–' });

  return (
    <div className={s.tip} data-side={side} style={style} aria-hidden="true">
      <span className={s.date}>{f.weekdayDate(dateOf(day.date))}</span>
      {day.form !== null && zone && (
        <span className={s.form}>
          <span>{t.form.kpiForm}</span>
          <span className={s.formValue} style={{ color: `var(--zone-${zone}-ink)` }}>
            {f.signed(day.form)}%
          </span>
          <span
            className={s.chip}
            style={{ '--zone': `var(--zone-${zone})`, '--zone-ink': `var(--zone-${zone}-ink)` } as CSSProperties}
          >
            {t.zones[zone].name}
          </span>
        </span>
      )}
      <dl className={s.rows}>
        {rows.map((r) => (
          <div key={r.key} className={s.row}>
            <dt className={s.label}>
              <span className={`${s.key} ${s[`key_${r.key}`]}`} />
              {r.label}
            </dt>
            <dd className={s.value}>{r.value}</dd>
          </div>
        ))}
      </dl>
      <ul className={s.activities}>
        {shown.length ? (
          shown.map((a) => <li key={a.id}>{activityLine(a, f)}</li>)
        ) : (
          <li className={s.muted}>{t.form.restDay}</li>
        )}
        {activities.length > shown.length && (
          <li className={s.muted}>{t.form.moreActivities(activities.length - shown.length)}</li>
        )}
      </ul>
    </div>
  );
}
