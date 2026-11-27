import { useId, useMemo, useState, type CSSProperties } from 'react';
import { useApp } from '../app/context';
import { trainingByDay } from '../domain/activities';
import { activityLoad } from '../domain/load';
import { zoneOf, type TrainingDay } from '../domain/training';
import type { Activity, DayKey } from '../domain/types';
import { groupByWeek, type ActivityWeek, type WeekDay } from '../domain/weeks';
import { dateOf } from '../lib/days';
import { ActivityNumbers, FormThatDay, LoadNote, zoneStyle } from './ActivityParts';
import s from './ActivityWeeks.module.css';

/** Weeks listed at first, and added by "Show older weeks". */
const WEEKS_STEP = 4;

/** Block height: room for its two lines, then taller with load, capped so one long day can't stretch the week. A wrapped name can make it taller still. */
const blockHeight = (load: number) => Math.min(170, 48 + Math.round(load * 0.55));

/**
 * Activities as a calendar, one card per week (Monday to Sunday), after
 * Focus's week view: a pastel block per run or ride, taller with more load;
 * other activities stay one quiet line. A day opens its numbers under the week.
 */
export function ActivityWeeks({ activities }: { activities: readonly Activity[] }) {
  const { data, t } = useApp();
  const [shown, setShown] = useState(WEEKS_STEP);
  const [selected, setSelected] = useState<DayKey | null>(null);
  const training = useMemo(() => trainingByDay(data), [data]);
  const weeks = useMemo(
    () =>
      groupByWeek({
        shown: activities,
        all: data.activities,
        athlete: data.athlete,
        asOf: data.asOf,
        training,
        sleep: data.sleep,
      }),
    [activities, data, training],
  );
  // With only "Other" shown, those are the blocks; next to runs and rides they stay quiet.
  const quietOther = activities.some((a) => a.sport !== 'other');

  return (
    <div className={s.weeks}>
      <p className={s.legend}>
        <span className={s.key}>
          <span className={`${s.swatch} ${s.run}`} aria-hidden="true" />
          {t.activities.legendRun}
        </span>
        <span className={s.key}>
          <span className={`${s.swatch} ${s.ride}`} aria-hidden="true" />
          {t.activities.legendRide}
        </span>
        <span className={s.key}>
          <span className={`${s.swatch} ${s.other}`} aria-hidden="true" />
          {t.activities.legendOther}
        </span>
        <span>{t.activities.legendHeight}</span>
      </p>

      {weeks.slice(0, shown).map((week) => (
        <Week
          key={week.start}
          week={week}
          training={training}
          quietOther={quietOther}
          selected={selected}
          onSelect={(day) => setSelected((d) => (d === day ? null : day))}
        />
      ))}

      {weeks.length > shown && (
        <div>
          <button type="button" className={s.secondary} onClick={() => setShown((n) => n + WEEKS_STEP)}>
            {t.activities.olderWeeks}
          </button>
        </div>
      )}
    </div>
  );
}

function Week({
  week,
  training,
  quietOther,
  selected,
  onSelect,
}: {
  week: ActivityWeek;
  training: ReadonlyMap<DayKey, TrainingDay>;
  quietOther: boolean;
  selected: DayKey | null;
  onSelect: (day: DayKey) => void;
}) {
  const { t, f } = useApp();
  const panelId = useId();
  const range = f.dayRange(dateOf(week.start), dateOf(week.end));
  const open = week.days.find((d) => d.date === selected && !d.ahead) ?? null;

  return (
    <section aria-label={range} className={s.week}>
      <div className={s.head}>
        <h2 className={s.range}>{range}</h2>
        <span className={s.muted}>
          {[
            week.distance > 0 && f.km(week.distance),
            week.movingTime > 0 && f.hours(week.movingTime),
            week.elevationGain > 0 && f.climb(week.elevationGain),
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
        <span className={s.muted}>{t.activities.weekLoad(f.int(week.load), week.feel)}</span>
        {week.sleep !== null && <span className={s.muted}>{t.activities.sleep(f.hours(week.sleep * 60))}</span>}
        {week.zone && (
          <span className={s.zone}>
            {week.current ? t.activities.formToday : t.activities.formOnSunday}
            <span className={s.chip} style={zoneStyle(week.zone)}>
              {t.zones[week.zone].name}
            </span>
          </span>
        )}
      </div>

      <div className={s.days}>
        {week.days.map((d) => (
          <Day
            key={d.date}
            day={d}
            quietOther={quietOther}
            open={open?.date === d.date}
            panelId={panelId}
            onSelect={() => onSelect(d.date)}
          />
        ))}
      </div>

      {open && <DayPanel id={panelId} day={open} training={training} />}
    </section>
  );
}

function Day({
  day,
  quietOther,
  open,
  panelId,
  onSelect,
}: {
  day: WeekDay;
  quietOther: boolean;
  open: boolean;
  panelId: string;
  onSelect: () => void;
}) {
  const { data, t, f } = useApp();
  const date = dateOf(day.date);
  const blocks = quietOther ? day.activities.filter((a) => a.sport !== 'other') : day.activities;
  const quiet = quietOther ? day.activities.filter((a) => a.sport === 'other') : [];
  const today = day.date === data.asOf;

  return (
    <button
      type="button"
      className={`${s.day} ${open ? s.open : ''} ${day.ahead ? s.ahead : ''}`}
      aria-expanded={day.ahead ? undefined : open}
      aria-controls={day.ahead ? undefined : panelId}
      aria-label={t.activities.dayLabel(f.weekdayDate(date), day.activities.map((a) => a.name))}
      disabled={day.ahead}
      onClick={onSelect}
    >
      <span className={s.dayHead}>
        <span className={`${s.date} ${today ? s.today : ''}`}>
          <span className={s.dow}>{f.weekdayShort(date)}</span>
          <span className={s.num}>{date.getDate()}</span>
        </span>
      </span>
      {blocks.map((a) => {
        const load = activityLoad(a, data.athlete);
        return (
          <span
            key={a.id}
            className={`${s.block} ${s[a.sport]}`}
            style={{ '--h': `${blockHeight(load)}px` } as CSSProperties}
          >
            <span className={s.blockName}>{a.name}</span>
            <span className={`${s.blockKm} ${blockHeight(load) >= 100 ? s.blockKmLarge : ''}`}>
              {a.distance > 0 ? f.kmPrecise(a.distance) : f.duration(a.movingTime)}
            </span>
          </span>
        );
      })}
      {quiet.length > 0 && <span className={s.quiet}>{quiet.map((a) => a.name).join(' · ')}</span>}
      {!day.ahead && !day.activities.length && <span className={s.rest}>{t.activities.rest}</span>}
    </button>
  );
}

/** A day's activities with the numbers an open row shows, and that day's form. */
function DayPanel({ id, day, training }: { id: string; day: WeekDay; training: ReadonlyMap<DayKey, TrainingDay> }) {
  const { t, f } = useApp();
  const form = training.get(day.date)?.form;
  const zone = form != null ? zoneOf(form) : null;
  const title = f.weekdayDate(dateOf(day.date));

  return (
    <div id={id} role="region" aria-label={t.activities.dayDetails(title)} className={s.panel}>
      <div className={s.panelHead}>
        <h3 className={s.panelTitle}>{title}</h3>
        {zone && <FormThatDay zone={zone} />}
      </div>
      {day.activities.length ? (
        day.activities.map((a) => (
          <div key={a.id} className={s.panelActivity}>
            <span className={s.panelName}>
              <span className={`${s.swatch} ${s[a.sport]}`} aria-hidden="true" />
              {a.name}
            </span>
            <div className={s.panelNumbers}>
              <ActivityNumbers activity={a} />
              <LoadNote activity={a} />
            </div>
          </div>
        ))
      ) : (
        <p className={s.muted}>{t.activities.restDay}</p>
      )}
    </div>
  );
}
