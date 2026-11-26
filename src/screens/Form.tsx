import { useMemo, useState, type CSSProperties } from 'react';
import { useApp } from '../app/context';
import { EasyHrChart } from '../components/EasyHrChart';
import { FitnessChart } from '../components/FitnessChart';
import { FormChart } from '../components/FormChart';
import { KpiCard } from '../components/KpiCard';
import { Segmented } from '../components/Segmented';
import { EASY_PACE } from '../domain/easyHr';
import { formSummary, type FormSummary, type Period } from '../domain/formSummary';
import { RECORD_DISTANCES, type RecordId } from '../domain/records';
import { ZONES, type Zone } from '../domain/training';
import { dateOf } from '../lib/days';
import s from './Form.module.css';

const PERIODS: readonly Period[] = ['6w', '3m', 'year'];
const RECORD_ORDER: readonly RecordId[] = [...RECORD_DISTANCES.map((r) => r.id), 'longest'];

/** Zone colour for chips and the legend, from the zone tokens. */
const zoneStyle = (zone: Zone) =>
  ({ '--zone': `var(--zone-${zone})`, '--zone-ink': `var(--zone-${zone}-ink)` }) as CSSProperties;

/** Form: fitness, fatigue and form, records and easy-pace heart rate. */
export function FormScreen() {
  const { data, t, f } = useApp();
  const [period, setPeriod] = useState<Period>('3m');
  const sum = useMemo(() => formSummary(data, period), [data, period]);
  const easyPaceMid = (EASY_PACE.from + EASY_PACE.to) / 2;

  return (
    <>
      <header className={s.header}>
        <h1 className={s.title}>
          {sum.zone ? t.form.state[sum.zone] : t.form.noData}
          {sum.zone && sum.trend && (
            <span className={s.titleMuted}> {t.form.trend(sum.trend.change, +sum.trend.month.slice(5) - 1)}</span>
          )}
        </h1>
        <Segmented<Period>
          label={t.period.label}
          size="box"
          value={period}
          onChange={setPeriod}
          options={PERIODS.map((p) => ({ value: p, label: t.period[p] }))}
        />
      </header>

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
          sub={sum.zone ? t.form.formSub(sum.zone, f.int(Math.abs(sum.formGap))) : t.form.noData}
        />
        <KpiCard
          label={t.form.kpiFitness}
          value={f.int(sum.today.fitness)}
          sub={t.form.fitnessSub(f.signed(sum.fitnessChange))}
        />
        <KpiCard label={t.form.kpiFatigue} value={f.int(sum.today.fatigue)} sub={t.form.fatigueSub(sum.week)} />
        <KpiCard
          label={t.form.kpiEasyHr}
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
        <h2 id="fitness-heading" className={s.heading}>
          {t.form.chartTitle}
        </h2>
        <div className={s.split}>
          <FitnessChart days={sum.days} period={period} />
          <TodayColumn sum={sum} />
        </div>
        <div className={`${s.split} ${s.formRow}`}>
          <div className={s.formChart}>
            <h3 className={s.subheading}>
              {t.form.formHeading} <span className={s.titleMuted}>{t.form.formHeadingNote}</span>
            </h3>
            <FormChart days={sum.days} period={period} />
          </div>
          <ul aria-label={t.form.zonesLabel} className={`${s.side} ${s.zones}`}>
            {ZONES.map(({ id }) => (
              <li key={id} className={s.zone} style={zoneStyle(id)}>
                <span className={s.zoneBar} aria-hidden="true" />
                <span className={s.zoneText}>
                  <span className={s.zoneTop}>
                    <span className={s.zoneName}>{t.zones[id].name}</span>
                    <span className={s.muted}>{t.zones[id].range}</span>
                  </span>
                  <span className={s.small}>{t.zones[id].note}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className={s.pair}>
        <section aria-labelledby="records-heading" className={`${s.card} ${s.records}`}>
          <h2 id="records-heading" className={s.heading}>
            {t.records.title}
          </h2>
          <ul className={s.recordList}>
            {RECORD_ORDER.map((id) => {
              const r = sum.records[id];
              const date = r && f.dayMonth(dateOf(r.date));
              return (
                <li key={id} className={s.record}>
                  <span>{t.records[id]}</span>
                  {r ? (
                    r.isNew ? (
                      <span className={s.newChip}>{t.records.isNew(date!)}</span>
                    ) : (
                      <span className={s.muted}>{date}</span>
                    )
                  ) : (
                    <span className={s.muted}>{t.records.none}</span>
                  )}
                  <span className={s.recordValue}>
                    {r ? (r.time !== undefined ? f.duration(r.time) : f.kmPrecise(r.distance!)) : '–'}
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
            <p className={s.muted}>{t.easyHr.note(f.paceShort(EASY_PACE.from), f.paceShort(EASY_PACE.to))}</p>
          </div>
          <EasyHrChart months={sum.easyHr} />
        </section>
      </div>
    </>
  );
}

/** Today's fitness, fatigue and week's load beside the chart, each with one line saying what it is. */
function TodayColumn({ sum }: { sum: FormSummary }) {
  const { t, f } = useApp();
  const rows = [
    { key: 'fitness', label: t.form.fitness, value: sum.today.fitness, note: t.form.fitnessNote },
    { key: 'fatigue', label: t.form.fatigue, value: sum.today.fatigue, note: t.form.fatigueNote },
    { key: 'load', label: t.form.load7, value: sum.load7, note: t.form.load7Note },
  ] as const;
  return (
    <div className={s.side}>
      <span className={s.muted}>{t.form.today(f.dayMonth(dateOf(sum.asOf)))}</span>
      {rows.map((r) => (
        <div key={r.key} className={s.todayRow}>
          <span className={s.legend}>
            <span className={`${s.key} ${s[`key_${r.key}`]}`} aria-hidden="true" />
            {r.label}
          </span>
          <span className={s.todayValue}>{f.int(r.value)}</span>
          <span className={s.small}>{r.note}</span>
        </div>
      ))}
    </div>
  );
}
