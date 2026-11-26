import { useId, useMemo, useState, type ReactNode } from 'react';
import { useApp } from '../app/context';
import {
  ACTIVITY_FILTERS,
  countBySport,
  filterActivities,
  groupByMonth,
  zoneOn,
  zonesByDay,
  type ActivityFilter,
} from '../domain/activities';
import type { Zone } from '../domain/training';
import type { Activity } from '../domain/types';
import { Segmented } from '../components/Segmented';
import { dateOf, dayOf } from '../lib/days';
import { ActivityNumbers, FormThatDay, LoadNote } from './ActivityParts';
import { ActivityWeeks } from './ActivityWeeks';
import { readView, saveView, type ActivitiesView } from './activitiesView';
import s from './Activities.module.css';

/** Months listed at first, and added by "Show older months". Only the newest starts open. */
const MONTHS_STEP = 6;

const VIEWS: readonly ActivitiesView[] = ['list', 'weeks'];

/** Every activity by month, newest first; a row opens in place to show its numbers and load. */
export function ActivitiesScreen() {
  const { data, t, f } = useApp();
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [view, setView] = useState<ActivitiesView>(readView);
  const [shown, setShown] = useState(MONTHS_STEP);
  // One activity open at a time: opening another closes the last.
  const [open, setOpen] = useState<string | null>(null);
  // Months the athlete opened or closed; the rest follow the default (only the newest open).
  const [monthOpen, setMonthOpen] = useState<Record<string, boolean>>({});

  const counts = useMemo(() => countBySport(data.activities), [data.activities]);
  const shownActivities = useMemo(() => filterActivities(data.activities, filter), [data.activities, filter]);
  const months = useMemo(() => groupByMonth(shownActivities), [shownActivities]);
  const zones = useMemo(() => zonesByDay(data), [data]);
  // Filters only when there is more than one sport to tell apart.
  const filters = ACTIVITY_FILTERS.filter((k) => k === 'all' || counts[k] > 0);

  return (
    <>
      <header className={s.header}>
        <div className={s.titleBlock}>
          <h1 className={s.title}>{t.activities.title}</h1>
          <p className={s.lead}>{t.activities.lead}</p>
        </div>
        {data.activities.length > 0 && (
          <Segmented<ActivitiesView>
            label={t.activities.view}
            size="box"
            value={view}
            onChange={(v) => {
              setView(v);
              saveView(v);
            }}
            options={VIEWS.map((v) => ({ value: v, label: t.activities.views[v] }))}
          />
        )}
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

          {view === 'weeks' && <ActivityWeeks activities={shownActivities} />}

          {view === 'list' && months.slice(0, shown).map((m, i) => (
            <Month
              key={m.month}
              label={f.monthYear(dateOf(`${m.month}-01`))}
              totals={[m.distance > 0 && f.km(m.distance), f.hours(m.movingTime)].filter(Boolean).join(' · ')}
              open={monthOpen[m.month] ?? i === 0}
              onToggle={(next) => setMonthOpen((o) => ({ ...o, [m.month]: next }))}
            >
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
            </Month>
          ))}

          {view === 'list' && months.length > shown && (
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

/** A month as an accordion: its name and totals are the button; the rows show only while open. */
function Month({
  label,
  totals,
  open,
  onToggle,
  children,
}: {
  label: string;
  totals: string;
  open: boolean;
  onToggle: (open: boolean) => void;
  children: ReactNode;
}) {
  const panelId = useId();
  return (
    <section aria-label={label} className={`${s.month} ${open ? s.monthOpen : ''}`}>
      <h2 className={s.monthTitle}>
        <button
          type="button"
          className={s.monthHead}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => onToggle(!open)}
        >
          <span className={s.monthName}>{label}</span>
          <span className="visually-hidden">, </span>
          <span className={s.muted}>{totals}</span>
          <svg className={s.chevron} width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M4 5.5l3 3 3-3" />
          </svg>
        </button>
      </h2>
      <div id={panelId} hidden={!open}>
        {open && children}
      </div>
    </section>
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
        <span className={s.hr}>{a.averageHeartrate ? f.bpm(a.averageHeartrate) : <span aria-hidden="true">–</span>}</span>
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
  const { t, f } = useApp();
  return (
    <div
      id={id}
      role="region"
      aria-label={t.activities.details(a.name, f.dayMonth(dateOf(dayOf(a.start))))}
      className={s.details}
    >
      <ActivityNumbers activity={a} />
      {/* Form that day first: it is what Forma adds to the numbers; where the load comes from, quieter, after it. */}
      <div className={s.detailFoot}>
        {zone && <FormThatDay zone={zone} />}
        <LoadNote activity={a} />
      </div>
    </div>
  );
}
