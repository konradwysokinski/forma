import { useMemo, useState, type CSSProperties } from 'react';
import { useApp } from '../app/context';
import { EasyHrChart } from '../components/EasyHrChart';
import { FitnessChart } from '../components/FitnessChart';
import { FormChart } from '../components/FormChart';
import { Icon } from '../components/Icon';
import { KpiCard } from '../components/KpiCard';
import { DayExplorer } from './DayExplorer';
import { Segmented } from '../components/Segmented';
import { ZoneGuide } from '../components/ZoneGuide';
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
  const [guide, setGuide] = useState<Zone | null>(null);
  const sum = useMemo(() => formSummary(data, period), [data, period]);
  const easyPaceMid = (data.easyPace.from + data.easyPace.to) / 2;

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
          options={PERIODS.map((p) => ({ value: p, label: t.period[p] }))}
        />
      </header>

      {/* Tiles and cards sit as close together as the tiles do. */}
      <div className={s.stack}>
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
          <ZoneLegend onOpen={setGuide} />
        </div>
        <ZoneGuide zone={guide} onClose={() => setGuide(null)} />
      </section>

      <div className={s.pair}>
        <section aria-labelledby="records-heading" className={`${s.card} ${s.records}`}>
          <div className={s.headingBlock}>
            <h2 id="records-heading" className={s.heading}>
              {t.records.title}
            </h2>
            <p className={s.muted}>{t.records.note[period]}</p>
          </div>
          <ul className={s.recordList}>
            {RECORD_ORDER.map((id) => {
              const r = sum.records[id];
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

/** What the chart's lines and bars are, in one row under the chart; today's values are in the tiles above. */
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
        <li key={item.key} className={s.legendItem}>
          <span className={`${s.key} ${s[`key_${item.key}`]}`} aria-hidden="true" />
          <span className={s.legendName}>{item.label}</span>
          <span className={s.legendNote}>{item.note}</span>
        </li>
      ))}
    </ul>
  );
}

/** The five zones under the form bars: name (opens the zone guide), range and what it means. */
export function ZoneLegend({ onOpen }: { onOpen: (zone: Zone) => void }) {
  const { t } = useApp();
  return (
    <ul aria-label={t.form.zonesLabel} className={`${s.legendRow} ${s.zones}`}>
      {ZONES.map(({ id }) => (
        <li key={id} className={s.zone} style={zoneStyle(id)}>
          <span className={s.zoneBar} aria-hidden="true" />
          <span className={s.zoneText}>
            <button
              type="button"
              className={s.zoneName}
              aria-haspopup="dialog"
              title={t.zoneGuide.open(t.zones[id].name)}
              onClick={() => onOpen(id)}
            >
              {t.zones[id].name}
              <Icon name="info" size={14} className={s.zoneInfo} />
            </button>
            <span className={s.zoneRange}>{t.zones[id].range}</span>
            <span className={s.zoneNote}>{t.zones[id].note}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
