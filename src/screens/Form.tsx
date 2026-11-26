import { useMemo, useState, type CSSProperties } from 'react';
import { useApp } from '../app/context';
import { EasyHrChart } from '../components/EasyHrChart';
import { FitnessChart } from '../components/FitnessChart';
import { FormChart } from '../components/FormChart';
import { KpiCard } from '../components/KpiCard';
import { DayExplorer } from './DayExplorer';
import { Segmented } from '../components/Segmented';
import { formSummary, type Period } from '../domain/formSummary';
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
  const easyPaceMid = (data.easyPace.from + data.easyPace.to) / 2;

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
        <DayExplorer key={period} days={sum.days}>
          {(active) => (
            <>
              <FitnessChart days={sum.days} period={period} active={active} />
              <ChartLegend />
              <div className={s.formRow}>
                <h3 className={s.subheading}>
                  {t.form.formHeading} <span className={s.titleMuted}>{t.form.formHeadingNote}</span>
                </h3>
                <FormChart days={sum.days} period={period} active={active} />
              </div>
            </>
          )}
        </DayExplorer>
        <div className={s.zonesBlock}>
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
            <p className={s.muted}>{t.easyHr.note(f.paceShort(data.easyPace.from), f.paceShort(data.easyPace.to))}</p>
          </div>
          <EasyHrChart months={sum.easyHr} />
        </section>
      </div>
    </>
  );
}

/** What the chart's lines and bars are, under the chart; today's values are in the tiles above. */
function ChartLegend() {
  const { t } = useApp();
  const items = [
    { key: 'fitness', label: t.form.fitness, note: t.form.fitnessNote },
    { key: 'fatigue', label: t.form.fatigue, note: t.form.fatigueNote },
    { key: 'load', label: t.form.load, note: t.form.loadNote },
  ] as const;
  return (
    <ul className={s.legendRow}>
      {items.map((item) => (
        <li key={item.key} className={s.legendItem}>
          <span className={s.legend}>
            <span className={`${s.key} ${s[`key_${item.key}`]}`} aria-hidden="true" />
            {item.label}
          </span>
          <span className={s.small}>{item.note}</span>
        </li>
      ))}
    </ul>
  );
}
