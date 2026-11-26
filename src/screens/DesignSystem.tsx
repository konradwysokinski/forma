import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router';
import tokensCss from '../styles/tokens.css?raw';
import { useApp, type Theme, type ThemePref } from '../app/context';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DayTooltip } from '../components/DayTooltip';
import { EasyHrChart } from '../components/EasyHrChart';
import { FitnessChart } from '../components/FitnessChart';
import { FormChart } from '../components/FormChart';
import { Icon } from '../components/Icon';
import { KpiCard } from '../components/KpiCard';
import { Segmented } from '../components/Segmented';
import { SleepChart } from '../components/SleepChart';
import { Toggle } from '../components/Toggle';
import { Row } from '../components/SettingsDialog';
import { ZoneGuide } from '../components/ZoneGuide';
import { SAMPLE } from '../data/sample';
import { activitiesByDay } from '../domain/activitiesByDay';
import { averageSleep, sleepByDay } from '../domain/sleep';
import { formSummary, type Period } from '../domain/formSummary';
import { ZONES, type Zone } from '../domain/training';
import { LOCALES, MESSAGES, type Locale } from '../i18n';
import layout from '../app/Layout.module.css';
import b from '../components/Button.module.css';
import settings from '../components/SettingsDialog.module.css';
import { ChartLegend, ZoneLegend } from './Form';
import form from './Form.module.css';
import s from './DesignSystem.module.css';

/** The sample's 5 km race: a day with an activity, for the tooltip. */
const TOOLTIP_DAY = '2026-11-09';
const PERIOD: Period = '3m';

const zoneStyle = (zone: Zone) =>
  ({ '--zone': `var(--zone-${zone})`, '--zone-ink': `var(--zone-${zone}-ink)` }) as CSSProperties;

/**
 * /design-system (and /ds): Forma's living design system. Everything on it is
 * the app's own CSS variables and components, fed with the sample data, so it
 * can't drift from the product. It needs no data source of the visitor's.
 */
export function DesignSystem() {
  const { t, f, theme, setThemePref, locale, setLocale } = useApp();
  const sum = useMemo(() => formSummary(SAMPLE, PERIOD), []);
  const tipDay = useMemo(() => {
    const day = sum.days.find((d) => d.date === TOOLTIP_DAY) ?? sum.today;
    return {
      day,
      activities: activitiesByDay(SAMPLE.activities).get(day.date) ?? [],
      night: SAMPLE.sleep?.find((n) => n.date === day.date) ?? null,
    };
  }, [sum]);
  const nights = useMemo(() => sleepByDay(SAMPLE.sleep ?? [], sum.days), [sum]);
  const [sleepOn, setSleepOn] = useState(true);
  const easyPaceMid = (SAMPLE.easyPace.from + SAMPLE.easyPace.to) / 2;

  const [period, setPeriod] = useState<Period>('3m');
  const [pref, setPref] = useState<ThemePref>('system');
  const [guide, setGuide] = useState<Zone | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    document.title = `${t.ds.title} · Forma`;
    return () => {
      document.title = 'Forma';
    };
  }, [t]);

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.brand}>
          <Link to="/" className={s.wordmark}>
            Forma
          </Link>
          <h1 className={s.title}>{t.ds.title}</h1>
          <p className={s.lead}>{t.ds.lead}</p>
        </div>
        <div className={s.controls}>
          <Segmented<Theme>
            label={t.settings.theme}
            size="md"
            options={[
              { value: 'light', label: t.settings.themes.light },
              { value: 'dark', label: t.settings.themes.dark },
            ]}
            value={theme}
            onChange={setThemePref}
          />
          <Segmented<Locale>
            label={t.settings.language}
            size="md"
            value={locale}
            onChange={setLocale}
            options={LOCALES.map((l) => ({ value: l, label: l.toUpperCase(), ariaLabel: MESSAGES[l].languageName, lang: l }))}
          />
          <Link to="/" className={s.open}>
            {t.ds.openApp}
          </Link>
        </div>
      </header>

      <main className={s.panel}>
        <Section title={t.ds.principlesTitle}>
          <ol className={s.list}>
            {t.ds.principles.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
        </Section>

        <Section title={t.ds.colours} hint={t.ds.coloursHint}>
          <div className={s.table} role="table" aria-label={t.ds.colours}>
            <div className={`${s.tr} ${s.th}`} role="row">
              <span role="columnheader">{t.ds.name}</span>
              <span role="columnheader">{t.settings.themes.light}</span>
              <span role="columnheader">{t.settings.themes.dark}</span>
            </div>
            <Variables title={t.ds.ground} names={GROUND} />
            <Variables title={t.ds.text} names={TEXT} />
            <Variables title={t.ds.accent} hint={t.ds.accentHint} names={ACCENT} />
            <Variables title={t.ds.states} names={STATES} />
            <Variables title={t.ds.sidebar} hint={t.ds.sidebarHint} names={SIDEBAR} on="sidebar-bg" />
            <Variables title={t.ds.training} hint={t.ds.trainingHint} names={TRAINING} />
            <Variables title={t.ds.zones} hint={t.ds.zonesHint} names={ZONE_TOKENS} />
          </div>
        </Section>

        <Section title={t.ds.type} hint={t.ds.typeHint}>
          <div className={s.table} role="table" aria-label={t.ds.type}>
            <div className={`${s.typeTr} ${s.th}`} role="row">
              <span role="columnheader">{t.ds.style}</span>
              <span role="columnheader">{t.ds.size}</span>
              <span role="columnheader">{t.ds.weight}</span>
              <span role="columnheader">{t.ds.tracking}</span>
            </div>
            {TYPE.map((x) => (
              <div key={x.name} className={s.typeTr} role="row">
                <span className={s.typeCell} role="cell">
                  <span
                    className={s.typeSample}
                    style={{
                      font: `${x.weight} ${x.size}px/${x.line}px var(--font-${x.serif ? 'serif' : 'sans'})`,
                      letterSpacing: x.tracking,
                    }}
                  >
                    {x.serif ? 'Forma' : x.number ? x.number : t.ds.sample}
                  </span>
                  <span className={s.varName}>
                    {x.name} · {t.ds.typeUse[x.name]}
                  </span>
                </span>
                <span className={s.mono} role="cell">
                  {x.size} / {x.line}
                </span>
                <span className={s.mono} role="cell">
                  {x.weight}
                  {x.serif ? ' serif' : ''}
                </span>
                <span className={s.mono} role="cell">
                  {x.tracking}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <div className={s.split}>
          <Section title={t.ds.spacing} hint={t.ds.spacingHint}>
            <div className={s.table} role="table" aria-label={t.ds.spacing}>
              {SPACES.map((n) => (
                <div key={n} className={s.spaceTr} role="row">
                  <span className={s.varName} role="cell">
                    space-{n}
                  </span>
                  <span className={s.mono} role="cell">
                    {n * 4}
                  </span>
                  <span role="cell">
                    <span className={s.spaceBar} style={{ width: `var(--space-${n})` }} />
                  </span>
                </div>
              ))}
            </div>
          </Section>

          <Section title={t.ds.radii} hint={t.ds.radiiHint}>
            <div className={s.radii}>
              {RADII.map(([name, px]) => (
                <div key={name} className={s.radius}>
                  <span className={s.radiusBox} style={{ borderRadius: `var(--radius-${name})` }} />
                  <code>--radius-{name}</code>
                  <span className={s.muted}>{px}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <Section title={t.ds.shadows} hint={t.ds.shadowsHint}>
          <div className={s.shadows}>
            {['panel', 'float', 'modal'].map((name) => (
              <div key={name} className={s.shadow} style={{ boxShadow: `var(--shadow-${name})` }}>
                <code>--shadow-{name}</code>
              </div>
            ))}
          </div>
        </Section>

        <Section title={t.ds.components} hint={t.ds.sampleNote}>
          <Example title={t.ds.kpis} hint={t.ds.kpisHint}>
            <div className={form.kpis}>
              <KpiCard
                label={t.form.kpiForm}
                value={
                  sum.form === null ? (
                    '–'
                  ) : (
                    <span className={form.valueRow}>
                      {f.signed(sum.form)}%
                      {sum.zone && (
                        <span className={form.zoneChip} style={zoneStyle(sum.zone)}>
                          {t.zones[sum.zone].name}
                        </span>
                      )}
                    </span>
                  )
                }
                sub={t.form.goodDays(sum.goodDays.count, sum.goodDays.of)}
                color={sum.zone ? `var(--zone-${sum.zone}-ink)` : undefined}
              />
              <KpiCard
                label={t.form.kpiFitness}
                value={f.int(sum.today.fitness)}
                sub={t.form.fitnessSub(f.signed(sum.fitnessChange), t.period.over[PERIOD])}
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
                  <span className={form.labelRow}>
                    {t.form.kpiEasyHr}
                    <Icon name="heart" size={15} className={form.heartIcon} />
                  </span>
                }
                value={
                  sum.easyHrNow ? (
                    <>
                      {f.int(sum.easyHrNow.bpm)} <span className={form.unit}>{t.form.bpm}</span>
                    </>
                  ) : (
                    '–'
                  )
                }
                sub={
                  sum.easyHrNow
                    ? t.form.easyHrSub(f.pace(easyPaceMid), sum.easyHrNow.change, +sum.easyHrNow.comparedMonth.slice(5) - 1)
                    : t.form.easyHrNone
                }
              />
            </div>
          </Example>

          <Example title={t.ds.segmented} hint={t.ds.segmentedHint}>
            <div className={s.specimens}>
              <Specimen label="sm">
                <Segmented<Locale>
                  label={t.settings.language}
                  value={locale}
                  onChange={setLocale}
                  options={LOCALES.map((l) => ({ value: l, label: l.toUpperCase(), ariaLabel: MESSAGES[l].languageName, lang: l }))}
                />
              </Specimen>
              <Specimen label="md">
                <Segmented<ThemePref>
                  label={t.settings.theme}
                  size="md"
                  value={pref}
                  onChange={setPref}
                  options={(['light', 'dark', 'system'] as const).map((v) => ({ value: v, label: t.settings.themes[v] }))}
                />
              </Specimen>
              <Specimen label="toggle · sm">
                <Toggle label={t.sleep.toggle} pressed={sleepOn} onChange={setSleepOn} swatch="var(--sleep)" />
              </Specimen>
              <Specimen label="box">
                <Segmented<Period>
                  label={t.period.label}
                  size="box"
                  value={period}
                  onChange={setPeriod}
                  options={(['6w', '3m', '6m', 'year'] as const).map((p) => ({ value: p, label: t.period[p] }))}
                />
              </Specimen>
            </div>
          </Example>

          <Example title={t.ds.buttons} hint={t.ds.buttonsHint}>
            <div className={s.specimens}>
              <Specimen label="primary · large">
                <button type="button" className={`${b.primary} ${b.large}`}>
                  {t.start.connectButton}
                </button>
              </Specimen>
              <Specimen label="primary">
                <button type="button" className={b.primary}>
                  {t.ds.primary}
                </button>
              </Specimen>
              <Specimen label="secondary">
                <button type="button" className={b.secondary}>
                  {t.ds.secondary}
                </button>
              </Specimen>
              <Specimen label="text">
                <button type="button" className={b.text}>
                  {t.start.sample}
                </button>
              </Specimen>
              <Specimen label="settings">
                <button type="button" className={settings.button}>
                  {t.settings.github}
                  <Icon name="external" size={14} />
                </button>
              </Specimen>
            </div>
          </Example>

          <Example title={t.ds.chips} hint={t.ds.chipsHint}>
            <div className={s.row}>
              {ZONES.map(({ id }) => (
                <span key={id} className={form.zoneChip} style={zoneStyle(id)}>
                  {t.zones[id].name}
                </span>
              ))}
              <span className={form.newChip}>{t.records.isNew(f.dayMonth(new Date(2026, 10, 9)))}</span>
            </div>
          </Example>

          <Example title={t.ds.legends} hint={t.ds.legendsHint}>
            <div className={s.stack}>
              <ChartLegend />
              <ZoneLegend onOpen={setGuide} />
            </div>
            <ZoneGuide zone={guide} onClose={() => setGuide(null)} />
          </Example>

          <Example title={t.ds.charts} hint={t.ds.chartsHint}>
            <div className={form.card}>
              <h3 className={form.heading}>{t.form.chartTitle}</h3>
              <FitnessChart days={sum.days} period={PERIOD} />
              <ChartLegend />
              <div className={form.formRow}>
                <h4 className={form.subheading}>
                  {t.form.formHeading} <span className={form.titleMuted}>{t.form.formHeadingNote}</span>
                </h4>
                <FormChart days={sum.days} period={PERIOD} />
              </div>
              <div className={form.formRow}>
                <div className={form.stripHead}>
                  <h4 className={form.subheading}>
                    {t.sleep.heading} <span className={form.titleMuted}>{t.sleep.headingNote}</span>
                  </h4>
                  <span className={form.small}>{t.sleep.average(f.hours((averageSleep(nights) ?? 0) * 60))}</span>
                </div>
                <SleepChart nights={nights} average={averageSleep(nights) ?? 0} period={PERIOD} />
              </div>
            </div>
            <div className={`${form.card} ${form.easyHr} ${s.half}`}>
              <div className={form.headingBlock}>
                <h3 className={form.heading}>{t.easyHr.title}</h3>
                <p className={form.muted}>
                  {t.easyHr.note(f.paceShort(SAMPLE.easyPace.from), f.paceShort(SAMPLE.easyPace.to))}
                </p>
              </div>
              <EasyHrChart months={sum.easyHr} />
            </div>
          </Example>

          <Example title={t.ds.tooltip} hint={t.ds.tooltipHint}>
            <DayTooltip
              day={tipDay.day}
              activities={tipDay.activities}
              night={tipDay.night}
              side="right"
              style={{ position: 'relative' }}
            />
          </Example>

          <Example title={t.ds.dialog} hint={t.ds.dialogHint}>
            <div className={s.row}>
              <button type="button" className={b.secondary} onClick={() => setConfirming(true)}>
                {t.ds.openDialog}
              </button>
            </div>
            <ConfirmDialog
              open={confirming}
              tone="danger"
              title={t.settings.removeTitle}
              body={t.settings.removeBody}
              confirm={t.settings.remove}
              cancel={t.settings.cancel}
              onClose={() => setConfirming(false)}
              onConfirm={() => setConfirming(false)}
            />
          </Example>

          <Example title={t.ds.settingsRow} hint={t.ds.settingsRowHint}>
            <div className={`${settings.card} ${s.settings}`}>
              <Row title={t.ds.title} hint={t.settings.designSystemHint}>
                <button type="button" className={settings.button}>
                  {t.settings.designSystemOpen}
                </button>
              </Row>
              <Row title={t.settings.maxHr} hint={t.settings.maxHrEstimated(f.bpm(186))} error={t.settings.errors.maxHrRange} />
            </div>
          </Example>

          <Example title={t.ds.sidebarRows} hint={t.ds.sidebarRowsHint}>
            {/* Inert copies of the sidebar's rows, on the sidebar ground with its own tokens. */}
            <div className={s.sidebar} aria-hidden="true">
              <span className={`${layout.navRow} ${layout.active}`}>
                <Icon name="form" className={layout.navIcon} />
                {t.nav.form}
              </span>
              <span className={layout.navRow}>
                <Icon name="settings" className={layout.navIcon} />
                {t.nav.settings}
              </span>
              <span className={layout.status}>
                <span className={layout.dot} />
                <span className={layout.statusText}>{t.sidebar.synced(f.ago(Date.now() - 12 * 60_000))}</span>
                <span className={layout.source}>COROS</span>
              </span>
              <span className={layout.status}>
                <span className={`${layout.dot} ${layout.dotWarn}`} />
                <span className={layout.statusText}>{t.sidebar.syncFailed}</span>
              </span>
            </div>
          </Example>
        </Section>

        <Section title={t.ds.activities}>
          <p className={s.placeholder}>{t.ds.activitiesNote}</p>
        </Section>

        <div className={s.split}>
          <Section title={t.ds.content}>
            <ul className={s.list}>
              {t.ds.contentRules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </Section>
          <Section title={t.ds.a11y}>
            <ul className={s.list}>
              {t.ds.a11yRules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </Section>
        </div>
      </main>
    </div>
  );
}

const GROUND = [
  'canvas',
  'surface',
  'surface-sunken',
  'line',
  'line-soft',
  'line-strong',
  'track',
  'grid',
  'hover',
  'selected',
  'neutral-chip',
];
const TEXT = ['ink', 'ink-muted'];
const ACCENT = ['accent', 'accent-hover', 'accent-soft', 'on-accent'];
const STATES = ['warn', 'warn-ink', 'warn-soft', 'danger'];
const SIDEBAR = [
  'sidebar-bg',
  'sidebar-ink',
  'sidebar-ink-muted',
  'sidebar-hover',
  'sidebar-selected',
  'sidebar-accent',
  'sidebar-accent-soft',
];
const TRAINING = ['fitness', 'fitness-ink', 'fatigue', 'fatigue-ink', 'load', 'heart', 'heart-ink', 'sleep'];
const ZONE_TOKENS = ZONES.flatMap(({ id }) => [`zone-${id}`, `zone-${id}-ink`, `zone-${id}-tint`]);
const SPACES = [1, 2, 3, 4, 5, 6, 8, 10];
const RADII = [
  ['nav', '10px'],
  ['control', '12px'],
  ['tile', '14px'],
  ['card', '18px'],
  ['pill', '999px'],
  ['bar-seg', '6px'],
] as const;

type TypeStyle = 'wordmark' | 'title' | 'kpi' | 'number' | 'heading' | 'subheading' | 'lead' | 'body' | 'caption' | 'small';

const TYPE: readonly {
  name: TypeStyle;
  size: number;
  line: number;
  weight: number;
  tracking: string;
  serif?: boolean;
  number?: string;
}[] = [
  { name: 'wordmark', size: 30, line: 34, weight: 400, tracking: '0', serif: true },
  { name: 'title', size: 30, line: 36, weight: 500, tracking: '-0.02em' },
  { name: 'kpi', size: 34, line: 40, weight: 400, tracking: '-0.02em', number: '+12%' },
  { name: 'number', size: 22, line: 28, weight: 400, tracking: '-0.02em', number: '21:48' },
  { name: 'heading', size: 18, line: 24, weight: 500, tracking: '0' },
  { name: 'subheading', size: 16, line: 22, weight: 500, tracking: '0' },
  { name: 'lead', size: 16, line: 22, weight: 400, tracking: '0' },
  { name: 'body', size: 14, line: 20, weight: 400, tracking: '0' },
  { name: 'caption', size: 13, line: 18, weight: 400, tracking: '0' },
  { name: 'small', size: 12, line: 16, weight: 400, tracking: '0' },
];

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className={s.section}>
      <div className={s.sectionHead}>
        <h2 className={s.sectionTitle}>{title}</h2>
        {hint && <p className={s.muted}>{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Example({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className={s.example}>
      <div>
        <h3 className={s.exampleTitle}>{title}</h3>
        {hint && <p className={s.muted}>{hint}</p>}
      </div>
      {children}
    </div>
  );
}

/** One variant with its name under it. */
function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={s.specimen}>
      {children}
      <code className={s.varName}>{label}</code>
    </div>
  );
}

/**
 * Both themes' values, straight from tokens.css (the file the app loads), so the
 * table shows light and dark side by side like a design tool's variables.
 */
function readTheme(selector: string): Record<string, string> {
  const at = tokensCss.indexOf(selector);
  const body = at < 0 ? '' : tokensCss.slice(tokensCss.indexOf('{', at) + 1, tokensCss.indexOf('\n}', at));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()]));
}
const LIGHT = readTheme(':root');
const DARK = { ...LIGHT, ...readTheme("[data-theme='dark']") };

/**
 * One collection of colour variables: a heading row, then name, light and dark
 * per token. Swatches sit on that theme's surface (or `on`, e.g. the sidebar's
 * ground), so translucent tokens show as they're used.
 */
function Variables({ title, hint, names, on = 'surface' }: { title: string; hint?: string; names: string[]; on?: string }) {
  return (
    <>
      <div className={s.group} role="row">
        <span role="cell">
          {title}
          {hint && <span className={s.groupHint}>{hint}</span>}
        </span>
      </div>
      {names.map((n) => (
        <div key={n} className={s.tr} role="row">
          <span className={s.varName} role="cell">
            {n}
          </span>
          <Value value={LIGHT[n]} ground={LIGHT[on]} />
          <Value value={DARK[n]} ground={DARK[on]} />
        </div>
      ))}
    </>
  );
}

function Value({ value = '', ground = '' }: { value?: string; ground?: string }) {
  return (
    <span className={s.value} role="cell">
      <span
        className={s.chipColour}
        style={{ background: `linear-gradient(${value}, ${value}), ${ground}` }}
        aria-hidden="true"
      />
      <span className={s.mono}>{value.startsWith('#') ? value.slice(1).toUpperCase() : value}</span>
    </span>
  );
}
