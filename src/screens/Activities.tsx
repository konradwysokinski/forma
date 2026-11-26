import { useId, useMemo, useState, type CSSProperties } from 'react';
import { useApp } from '../app/context';
import {
  ACTIVITY_FILTERS,
  activityDetail,
  countBySport,
  filterActivities,
  groupByMonth,
  zoneOn,
  zonesByDay,
  type ActivityFilter,
} from '../domain/activities';
import type { Zone } from '../domain/training';
import type { Activity } from '../domain/types';
import { dateOf, dayOf } from '../lib/days';
import s from './Activities.module.css';

/** Months shown at first, and added by "Show more months". */
const MONTHS_STEP = 3;

const zoneStyle = (zone: Zone) =>
  ({ '--zone': `var(--zone-${zone})`, '--zone-ink': `var(--zone-${zone}-ink)` }) as CSSProperties;

/** Every activity by month, newest first; a row opens in place to show its numbers and load. */
export function ActivitiesScreen() {
  const { data, t, f } = useApp();
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [shown, setShown] = useState(MONTHS_STEP);
  // One activity open at a time: opening another closes the last.
  const [open, setOpen] = useState<string | null>(null);

  const counts = useMemo(() => countBySport(data.activities), [data.activities]);
  const months = useMemo(() => groupByMonth(filterActivities(data.activities, filter)), [data.activities, filter]);
  const zones = useMemo(() => zonesByDay(data), [data]);
  // Filters only when there is more than one sport to tell apart.
  const filters = ACTIVITY_FILTERS.filter((k) => k === 'all' || counts[k] > 0);

  return (
    <>
      <header className={s.header}>
        <h1 className={s.title}>{t.activities.title}</h1>
        <p className={s.lead}>{t.activities.lead}</p>
      </header>

      {!data.activities.length ? (
        <p className={s.muted}>{t.activities.empty}</p>
      ) : (
        <div className={s.list}>
          {filters.length > 2 && (
            <div role="group" aria-label={t.activities.filterLabel} className={s.filters}>
              {filters.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filter === key}
                  className={s.filter}
                  onClick={() => {
                    setFilter(key);
                    setShown(MONTHS_STEP);
                  }}
                >
                  {t.activities.filters[key]}
                  <span className={s.count}>{f.int(counts[key])}</span>
                </button>
              ))}
            </div>
          )}

          {months.slice(0, shown).map((m) => {
            const label = f.monthYear(dateOf(`${m.month}-01`));
            return (
              <section key={m.month} aria-label={label} className={s.month}>
                <div className={s.monthHead}>
                  <h2 className={s.monthTitle}>{label}</h2>
                  <span className={s.muted}>
                    {[m.distance > 0 && f.km(m.distance), f.hours(m.movingTime)].filter(Boolean).join(' · ')}
                  </span>
                </div>
                <ul className={s.rows}>
                  {m.activities.map((a) => (
                    <ActivityRow
                      key={a.id}
                      activity={a}
                      zone={zoneOn(zones, a)}
                      open={open === a.id}
                      onToggle={() => setOpen((id) => (id === a.id ? null : a.id))}
                    />
                  ))}
                </ul>
              </section>
            );
          })}

          {months.length > shown && (
            <div>
              <button type="button" className={s.secondary} onClick={() => setShown((n) => n + MONTHS_STEP)}>
                {t.activities.older}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

/**
 * A row that opens in place: tap or click anywhere on it (the name is the
 * button, stretched over the row), so it works the same on phones.
 */
function ActivityRow({
  activity: a,
  zone,
  open,
  onToggle,
}: {
  activity: Activity;
  zone: Zone | null;
  open: boolean;
  onToggle: () => void;
}) {
  const { t, f } = useApp();
  const panelId = useId();
  return (
    <li className={`${s.item} ${open ? s.open : ''}`}>
      <div className={s.row}>
        <time className={s.date} dateTime={a.start}>
          {f.dayMonth(dateOf(dayOf(a.start)))}
        </time>
        <button
          type="button"
          className={s.rowName}
          title={t.activities.sports[a.sport]}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
        >
          {a.name}
        </button>
        {/* Without a distance, the time stays on phones too, in the distance's place. */}
        <span className={`${s.time} ${a.distance > 0 ? '' : s.timeOnly}`}>{f.duration(a.movingTime)}</span>
        <span className={s.km}>{a.distance > 0 ? f.kmPrecise(a.distance) : ''}</span>
        <svg className={s.chevron} width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M4 5.5l3 3 3-3" />
        </svg>
      </div>
      {open && <ActivityDetails id={panelId} activity={a} zone={zone} />}
    </li>
  );
}

function ActivityDetails({ id, activity: a, zone }: { id: string; activity: Activity; zone: Zone | null }) {
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
  const time = f.duration(a.movingTime);

  return (
    <div
      id={id}
      role="region"
      aria-label={t.activities.details(a.name, f.dayMonth(dateOf(dayOf(a.start))))}
      className={s.details}
    >
      <dl className={s.stats}>
        {stats.map((x) => (
          <div key={x.label} className={s.stat}>
            <dt>{x.label}</dt>
            <dd>{x.value}</dd>
          </div>
        ))}
      </dl>
      <div className={s.detailFoot}>
        <span className={s.muted}>
          {d.heartRate !== null ? t.activities.loadFrom(time, f.bpm(d.heartRate)) : t.activities.loadNoHr(time)}
        </span>
        {zone && (
          <span className={s.formDay}>
            {t.activities.formThatDay}
            <span className={s.chip} style={zoneStyle(zone)}>
              {t.zones[zone].name}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
