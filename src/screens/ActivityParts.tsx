import type { CSSProperties } from 'react';
import { useApp } from '../app/context';
import { activityDetail } from '../domain/activities';
import type { Zone } from '../domain/training';
import type { Activity } from '../domain/types';
import s from './Activities.module.css';

/** Shared by the list's open row and the week calendar's open day. */

export const zoneStyle = (zone: Zone) =>
  ({ '--zone': `var(--zone-${zone})`, '--zone-ink': `var(--zone-${zone}-ink)` }) as CSSProperties;

/** An activity's numbers, load first: the open row in the list and a day in the week calendar. */
export function ActivityNumbers({ activity: a }: { activity: Activity }) {
  const { data, t, f } = useApp();
  const d = activityDetail(a, data.athlete);
  const stats = [
    { label: t.activities.load, value: f.int(d.load) },
    a.distance > 0 && { label: t.activities.distance, value: f.kmPrecise(a.distance) },
    d.movingTime !== null && { label: t.activities.movingTime, value: f.duration(d.movingTime) },
    d.pace !== null && { label: t.activities.pace, value: f.pace(d.pace) },
    d.speed !== null && { label: t.activities.speed, value: f.speed(d.speed) },
    d.heartRate !== null && { label: t.activities.heartRate, value: f.bpm(d.heartRate) },
  ].filter((x): x is { label: string; value: string } => !!x);
  return (
    <dl className={s.stats}>
      {stats.map((x) => (
        <div key={x.label} className={s.stat}>
          <dt>{x.label}</dt>
          <dd>{x.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function FormThatDay({ zone }: { zone: Zone }) {
  const { t } = useApp();
  return (
    <span className={s.formDay}>
      {t.activities.formThatDay}
      <span className={s.chip} style={zoneStyle(zone)}>
        {t.zones[zone].name}
      </span>
    </span>
  );
}

/** Where an activity's load comes from, in a quiet line. */
export function LoadNote({ activity: a }: { activity: Activity }) {
  const { t, f } = useApp();
  const time = f.duration(a.movingTime);
  return (
    <span className={s.loadNote}>
      {a.averageHeartrate ? t.activities.loadFrom(time, f.bpm(a.averageHeartrate)) : t.activities.loadNoHr(time)}
    </span>
  );
}
