import { useMemo, useState, type CSSProperties } from 'react';
import { useApp } from '../app/context';
import { EasyHrChart } from '../components/EasyHrChart';
import { FitnessChart } from '../components/FitnessChart';
import { FormChart } from '../components/FormChart';
import { Icon } from '../components/Icon';
import { KpiCard } from '../components/KpiCard';
import { DayExplorer } from './DayExplorer';
import { Segmented } from '../components/Segmented';
import { RestHrChart } from '../components/RestHrChart';
import { SleepChart } from '../components/SleepChart';
import { TodayCard } from '../components/TodayCard';
import { Toggle } from '../components/Toggle';
import { ZoneGuide } from '../components/ZoneGuide';
import { formSummary, type Period } from '../domain/formSummary';
import { RECORD_DISTANCES, type RecordId } from '../domain/records';
import { averageSleep, sleepByDay } from '../domain/sleep';
import { today as todayVerdict } from '../domain/today';
import { ZONES, type Zone } from '../domain/training';
import { dateOf } from '../lib/days';
import s from './Form.module.css';

const PERIODS: readonly Period[] = ['6w', '3m', '6m', 'year'];
/** Whether the sleep strip is on; unset means on. */
const KEY_SHOW_SLEEP = 'forma.showSleep';
/** Whether the resting heart rate strip is on; unset means on. */
const KEY_SHOW_REST = 'forma.showRestHr';

function readShown(key: string) {
  try {
    return localStorage.getItem(key) !== '0';
  } catch {
    return true;
  }
}

function saveShown(key: string, on: boolean) {
  try {
    localStorage.setItem(key, on ? '1' : '0');
  } catch {
    /* remembered for this visit only */
  }
}
const RECORD_ORDER: readonly RecordId[] = [...RECORD_DISTANCES.map((r) => r.id), 'longest'];

/** Zone colour for chips and the legend, from the zone tokens. */
const zoneStyle = (zone: Zone) =>
  ({ '--zone': `var(--zone-${zone})`, '--zone-ink': `var(--zone-${zone}-ink)` }) as CSSProperties;

/** Form: fitness, fatigue and form, records and easy-pace heart rate. */
export function FormScreen() {
  const { data, t, f } = useApp();
  const [period, setPeriod] = useState<Period>('3m');
  const [guide, setGuide] = useState(false);
  // Records for the period above, or for everything Forma holds.
  const [recordScope, setRecordScope] = useState<'period' | 'all'>('period');
  const sum = useMemo(() => formSummary(data, period), [data, period]);
  // Today doesn't follow the period: it is always about today.
  const today = useMemo(
    () =>
      todayVerdict({
        asOf: sum.asOf,
        form: sum.form,
        zone: sum.zone,
        fitness: sum.today.fitness,
        load7: sum.load7,
        sleep: data.sleep,
        restingHr: data.restingHr,
      }),
    [sum, data.sleep, data.restingHr],
  );
  const shownRecords = recordScope === 'all' ? sum.recordsAll : sum.records;
  const easyPaceMid = (data.easyPace.from + data.easyPace.to) / 2;
  // Sleep: the switch shows only when the source has any; the strip follows the period.
  const [showSleep, setShowSleepState] = useState(() => readShown(KEY_SHOW_SLEEP));
  const hasSleep = Boolean(data.sleep?.length);
  const sleepOn = hasSleep && showSleep;
  const nights = useMemo(() => sleepByDay(data.sleep ?? [], sum.days), [data.sleep, sum.days]);
  const sleepAverage = averageSleep(nights);
  const setShowSleep = (on: boolean) => {
    setShowSleepState(on);
    saveShown(KEY_SHOW_SLEEP, on);
  };
  // Resting heart rate: the same pattern, one value per morning.
  const [showRest, setShowRestState] = useState(() => readShown(KEY_SHOW_REST));
  const hasRest = Boolean(data.restingHr?.length);
  const restOn = hasRest && showRest;
  const mornings = useMemo(() => {
    const byDate = new Map((data.restingHr ?? []).map((d) => [d.date, d.bpm]));
    return sum.days.map((d) => byDate.get(d.date) ?? null);
  }, [data.restingHr, sum.days]);
  const knownMornings = mornings.filter((m): m is number => m !== null);
  const restAverage = knownMornings.length ? knownMornings.reduce((a, b) => a + b, 0) / knownMornings.length : null;
  const setShowRest = (on: boolean) => {
    setShowRestState(on);
    saveShown(KEY_SHOW_REST, on);
  };

  return (
    <>
      <header className={s.header}>
        <div className={s.titleBlock}>
          <h1 className={s.title}>{t.form.title}</h1>
          <p className={s.lead}>
            {sum.zone
              ? t.form.summary(
                  t.form.state[sum.zone],
                  sum.trend && t.form.trend(sum.trend.change, +sum.trend.month.slice(5) - 1),
                )
              : t.form.noData}
          </p>
        </div>
        <Segmented<Period>
          label={t.period.label}
          size="box"
          value={period}
          onChange={setPeriod}
          options={PERIODS.map((p) => ({ value: p, label: t.period.short[p], ariaLabel: t.period[p] }))}
        />
      </header>

      {/* Tiles and cards sit as close together as the tiles do. */}
      <div className={s.stack}>
      <TodayCard today={today} asOf={sum.asOf} zone={sum.zone} />
      <div className={s.kpis}>
        <KpiCard
          label={t.form.kpiForm}
          value={
            sum.form === null ? (
              '–'
            ) : (
              <span className={s.valueRow}>
                {f.signed(sum.form)}%
                {sum.zone && (
                  <span className={s.zoneChip} style={zoneStyle(sum.zone)}>
                    {t.zones[sum.zone].name}
                  </span>
                )}
              </span>
            )
          }
          sub={sum.zone ? t.form.goodDays(sum.goodDays.count, sum.goodDays.of) : t.form.noData}
          color={sum.zone ? `var(--zone-${sum.zone}-ink)` : undefined}
        />
        <KpiCard
          label={t.form.kpiFitness}
          value={f.int(sum.today.fitness)}
          sub={t.form.fitnessSub(f.signed(sum.fitnessChange), t.period.over[period])}
          color="var(--fitness-ink)"
        />
        <KpiCard
          label={t.form.kpiFatigue}
          value={f.int(sum.today.fatigue)}
          sub={t.form.fatigueSub(sum.week)}
          color="var(--fatigue-ink)"
        />
        <KpiCard
          label={
            <span className={s.labelRow}>
              {t.form.kpiEasyHr}
              <Icon name="heart" size={15} className={s.heartIcon} />
            </span>
          }
          value={
            sum.easyHrNow ? (
              <>
                {f.int(sum.easyHrNow.bpm)} <span className={s.unit}>{t.form.bpm}</span>
              </>
            ) : (
              '–'
            )
          }
          sub={
            sum.easyHrNow
              ? t.form.easyHrSub(
                  f.pace(easyPaceMid),
                  sum.easyHrNow.change,
                  +sum.easyHrNow.comparedMonth.slice(5) - 1,
                )
              : t.form.easyHrNone
          }
        />
      </div>

      <section aria-labelledby="fitness-heading" className={s.card}>
        <div className={s.cardHead}>
          <h2 id="fitness-heading" className={s.heading}>
            {t.form.chartTitle}
          </h2>
          <ChartLegend />
          {(hasSleep || hasRest) && (
            <div role="group" aria-label={t.sleep.alsoShow} className={s.alsoShow}>
              <span className={s.alsoShowLabel} aria-hidden="true">
                {t.sleep.alsoShow}
              </span>
              {hasSleep && (
                <Toggle label={t.sleep.toggle} pressed={showSleep} onChange={setShowSleep} swatch="var(--sleep)" />
              )}
              {hasRest && (
                <Toggle label={t.restHr.toggle} pressed={showRest} onChange={setShowRest} swatch="var(--heart)" />
              )}
            </div>
          )}
        </div>
        <DayExplorer
          key={period}
          days={sum.days}
          sleep={sleepOn ? nights : undefined}
          rest={restOn ? mornings : undefined}
        >
          {(active) => (
            <>
              <FitnessChart days={sum.days} period={period} active={active} />
              <div className={s.formRow}>
                <div className={s.formHead}>
                  <h3 className={s.subheading}>
                    {t.form.formHeading} <span className={s.titleMuted}>{t.form.formHeadingNote}</span>
                  </h3>
                  <button
                    type="button"
                    className={s.infoButton}
                    aria-haspopup="dialog"
                    aria-label={t.zoneGuide.open}
                    title={t.zoneGuide.open}
                    onClick={() => setGuide(true)}
                  >
                    <Icon name="info" size={15} />
                  </button>
                </div>
                <FormChart days={sum.days} period={period} active={active} />
              </div>
              {sleepOn && (
                <div className={s.formRow}>
                  <div className={s.stripHead}>
                    <h3 className={s.subheading}>
                      {t.sleep.heading} <span className={s.titleMuted}>{t.sleep.headingNote}</span>
                    </h3>
                    {sleepAverage !== null && (
                      <span className={s.small}>{t.sleep.average(f.hours(sleepAverage * 60))}</span>
                    )}
                  </div>
                  {sleepAverage === null ? (
                    <p className={s.small}>{t.sleep.none}</p>
                  ) : (
                    <SleepChart nights={nights} average={sleepAverage} period={period} active={active} />
                  )}
                </div>
              )}
              {restOn && (
                <div className={s.formRow}>
                  <div className={s.stripHead}>
                    <h3 className={s.subheading}>
                      {t.restHr.heading} <span className={s.titleMuted}>{t.restHr.headingNote}</span>
                    </h3>
                    {restAverage !== null && (
                      <span className={s.small}>{t.restHr.average(f.bpm(Math.round(restAverage)))}</span>
                    )}
                  </div>
                  {restAverage === null ? (
                    <p className={s.small}>{t.restHr.none}</p>
                  ) : (
                    <RestHrChart days={mornings} average={restAverage} period={period} active={active} />
                  )}
                </div>
              )}
            </>
          )}
        </DayExplorer>
        {/* Under all the charts: each zone's name, range and what it means; the info button by Form opens the guide. */}
        <ZoneLegend />
        <ZoneGuide open={guide} onClose={() => setGuide(false)} />
      </section>

      <div className={s.pair}>
        <section aria-labelledby="records-heading" className={`${s.card} ${s.records}`}>
          <div className={s.recordsHead}>
            <div className={s.headingBlock}>
              <h2 id="records-heading" className={s.heading}>
                {t.records.title}
              </h2>
              <p className={s.muted}>
                {recordScope === 'all'
                  ? t.records.noteAll(`${f.dayMonth(dateOf(sum.historyFrom))} ${sum.historyFrom.slice(0, 4)}`)
                  : t.records.note[period]}
              </p>
            </div>
            <Segmented<'period' | 'all'>
              label={t.records.scope}
              size="sm"
              value={recordScope}
              onChange={setRecordScope}
              options={[
                { value: 'period', label: t.period[period] },
                { value: 'all', label: t.records.all },
              ]}
            />
          </div>
          <ul className={s.recordList}>
            {RECORD_ORDER.map((id) => {
              const r = shownRecords[id];
              const date = r && f.dayMonth(dateOf(r.date));
              return (
                <li key={id} className={s.record}>
                  <span className={r ? s.recordName : `${s.recordName} ${s.recordEmpty}`}>{t.records[id]}</span>
                  <span className={s.recordMeta}>
                    {r?.isNew ? <span className={s.newChip}>{t.records.isNew(date!)}</span> : date}
                  </span>
                  <span className={s.recordHr}>
                    {r?.heartRate !== undefined && (
                      <>
                        <span className="visually-hidden">{t.records.heartRateLabel} </span>
                        {f.bpm(r.heartRate)}
                      </>
                    )}
                  </span>
                  <span className={s.recordValue}>
                    {r ? (
                      r.time !== undefined ? (
                        f.duration(r.time)
                      ) : (
                        f.kmPrecise(r.distance!)
                      )
                    ) : (
                      <span className={s.recordEmpty}>
                        –<span className="visually-hidden">{t.records.none}</span>
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="easy-hr-heading" className={`${s.card} ${s.easyHr}`}>
          <div className={s.headingBlock}>
            <h2 id="easy-hr-heading" className={s.heading}>
              {t.easyHr.title}
            </h2>
            <p className={s.muted}>{t.easyHr.note(f.paceShort(data.easyPace.from), f.paceShort(data.easyPace.to))}</p>
          </div>
          <EasyHrChart months={sum.easyHr} />
        </section>
      </div>
      </div>
    </>
  );
}

/** What the chart's lines and bars are, in the card's header; each one's meaning is its title (and read out). */
export function ChartLegend() {
  const { t } = useApp();
  const items = [
    { key: 'fitness', label: t.form.fitness, note: t.form.fitnessNote },
    { key: 'fatigue', label: t.form.fatigue, note: t.form.fatigueNote },
    { key: 'load', label: t.form.load, note: t.form.loadNote },
  ] as const;
  return (
    <ul className={s.chartLegend}>
      {items.map((item) => (
        <li key={item.key} className={s.legendItem} title={item.note}>
          <span className={`${s.key} ${s[`key_${item.key}`]}`} aria-hidden="true" />
          <span className={s.legendName}>{item.label}</span>
          <span className="visually-hidden">{item.note}</span>
        </li>
      ))}
    </ul>
  );
}

/** The five zones under the form bars: name (opens the zone guide), range and what it means. */
export function ZoneLegend() {
  const { t } = useApp();
  return (
    <ul aria-label={t.form.zonesLabel} className={`${s.legendRow} ${s.zones}`}>
      {ZONES.map(({ id }) => (
        <li key={id} className={s.zone} style={zoneStyle(id)}>
          <span className={s.zoneBar} aria-hidden="true" />
          <span className={s.zoneText}>
            <span className={s.zoneName}>{t.zones[id].name}</span>
            <span className={s.zoneRange}>{t.zones[id].range}</span>
            <span className={s.zoneNote}>{t.zones[id].note}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
