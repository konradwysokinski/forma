import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { version } from '../../package.json';
import { useApp, type ThemePref } from '../app/context';
import {
  checkHeartRate,
  checkPaceBand,
  DEFAULT_EASY_PACE,
  parsePace,
  type SettingsError,
} from '../domain/settings';
import { LOCALES, MESSAGES, type Locale } from '../i18n';
import { ConfirmDialog } from './ConfirmDialog';
import { Icon } from './Icon';
import { Segmented } from './Segmented';
import s from './SettingsDialog.module.css';

const REPO = 'https://github.com/konradwysokinski/forma';
const AUTHOR = { name: 'Konrad Wysokiński', url: 'https://github.com/konradwysokinski' };
const THEMES: ThemePref[] = ['light', 'dark', 'system'];
const SECTIONS = ['general', 'heartRate', 'data', 'about'] as const;
type Section = (typeof SECTIONS)[number];

/**
 * Settings in a modal over the current screen, with a side nav (tabs at the
 * top on phones), as in Kilometr. Opened at /settings; see App.
 */
export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const { t } = useApp();
  const ref = useRef<HTMLDialogElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const titleId = useId();
  const idPrefix = useId();
  const [section, setSection] = useState<Section>('general');

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  // Arrow keys move between sections, as in any tab list.
  const onTabKey = (e: KeyboardEvent, index: number) => {
    const step =
      e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (index + step + SECTIONS.length) % SECTIONS.length;
    setSection(SECTIONS[next]!);
    tabs.current[next]?.focus();
  };

  return (
    <dialog
      ref={ref}
      className={s.dialog}
      aria-labelledby={titleId}
      // Closing is a route change (App unmounts the dialog). Esc arrives as
      // 'cancel'; one from the nested confirmation is left to that dialog.
      onCancel={(e) => {
        if (e.target !== e.currentTarget) return;
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // click on the scrim
      }}
    >
      <div className={s.shell}>
        <div className={s.side}>
          <h2 id={titleId} className={s.title}>
            {t.settings.title}
          </h2>
          <div role="tablist" aria-label={t.settings.sections} aria-orientation="vertical" className={s.tabs}>
            {SECTIONS.map((key, i) => (
              <button
                key={key}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`${idPrefix}-tab-${key}`}
                aria-selected={section === key}
                aria-controls={`${idPrefix}-panel`}
                tabIndex={section === key ? 0 : -1}
                className={s.tab}
                onClick={() => setSection(key)}
                onKeyDown={(e) => onTabKey(e, i)}
              >
                {t.settings[key]}
              </button>
            ))}
          </div>
        </div>

        <div
          role="tabpanel"
          id={`${idPrefix}-panel`}
          aria-labelledby={`${idPrefix}-tab-${section}`}
          className={s.content}
        >
          <div className={s.contentHead}>
            <h3 className={s.sectionTitle}>{t.settings[section]}</h3>
            <button type="button" className={s.close} aria-label={t.settings.close} onClick={onClose}>
              <Icon name="close" size={16} />
            </button>
          </div>
          {section === 'general' && <General />}
          {section === 'heartRate' && <HeartRate />}
          {section === 'data' && <Data />}
          {section === 'about' && <About />}
        </div>
      </div>
    </dialog>
  );
}

function General() {
  const { themePref, setThemePref, locale, setLocale, t } = useApp();
  return (
    <div className={s.card}>
      <Row title={t.settings.theme} hint={t.settings.themeHint}>
        <Segmented
          label={t.settings.theme}
          size="md"
          value={themePref}
          onChange={setThemePref}
          options={THEMES.map((v) => ({ value: v, label: t.settings.themes[v] }))}
        />
      </Row>
      <Row title={t.settings.language} hint={t.settings.languageHint}>
        <Segmented<Locale>
          label={t.settings.language}
          size="md"
          value={locale}
          onChange={setLocale}
          options={LOCALES.map((l) => ({ value: l, label: MESSAGES[l].languageName, lang: l }))}
        />
      </Row>
    </div>
  );
}

function HeartRate() {
  const { training, setTraining, estimate, data, t, f } = useApp();
  const { maxHr, restHr } = data.athlete;
  const pace = training.easyPace ?? DEFAULT_EASY_PACE;

  return (
    <>
      <p className={s.lead}>{t.settings.heartRateLead}</p>
      <div className={s.card}>
        <BpmRow
          title={t.settings.maxHr}
          hint={
            training.maxHr === undefined
              ? t.settings.maxHrEstimated(f.bpm(estimate.maxHr))
              : t.settings.maxHrSet(f.bpm(estimate.maxHr))
          }
          value={maxHr}
          own={training.maxHr !== undefined}
          check={(v) => checkHeartRate('maxHr', v, restHr)}
          onSave={(v) => setTraining({ ...training, maxHr: v })}
        />
        <BpmRow
          title={t.settings.restHr}
          hint={
            training.restHr !== undefined
              ? t.settings.restHrSet(f.bpm(estimate.restHr))
              : estimate.restFromCoros
                ? t.settings.restHrCoros(f.bpm(estimate.restHr))
                : t.settings.restHrTypical(f.bpm(estimate.restHr))
          }
          value={restHr}
          own={training.restHr !== undefined}
          check={(v) => checkHeartRate('restHr', v, maxHr)}
          onSave={(v) => setTraining({ ...training, restHr: v })}
        />
        <PaceRow
          value={pace}
          own={training.easyPace !== undefined}
          onSave={(band) => setTraining({ ...training, easyPace: band })}
        />
      </div>
    </>
  );
}

/** Enter or leaving the field saves; a value equal to the estimate (or nothing) goes back to the estimate. */
function BpmRow({
  title,
  hint,
  value,
  own,
  check,
  onSave,
}: {
  title: string;
  hint: string;
  value: number;
  own: boolean;
  check: (v: number) => SettingsError | null;
  onSave: (v: number | undefined) => void;
}) {
  const { t } = useApp();
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState<SettingsError | null>(null);

  useEffect(() => {
    setDraft(String(value));
    setError(null);
  }, [value]);

  const commit = () => {
    const text = draft.trim();
    if (!text) {
      onSave(undefined);
      setDraft(String(value));
      return;
    }
    const v = Number(text);
    const problem = check(v);
    setError(problem);
    if (!problem && v !== value) onSave(v);
  };

  return (
    <Row title={<label htmlFor={id}>{title}</label>} hint={hint} error={error && t.settings.errors[error]}>
      <div className={s.field}>
        <span className={s.inputs}>
          <input
            id={id}
            className={s.input}
            inputMode="numeric"
            autoComplete="off"
            value={draft}
            aria-invalid={!!error}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && commit()}
          />
          bpm
        </span>
        {own && (
          <button type="button" className={s.reset} onClick={() => onSave(undefined)}>
            {t.settings.useEstimate}
          </button>
        )}
      </div>
    </Row>
  );
}

function PaceRow({
  value,
  own,
  onSave,
}: {
  value: { from: number; to: number };
  own: boolean;
  onSave: (band: { from: number; to: number } | undefined) => void;
}) {
  const { t, f } = useApp();
  const [from, setFrom] = useState(f.paceShort(value.from));
  const [to, setTo] = useState(f.paceShort(value.to));
  const [error, setError] = useState<SettingsError | null>(null);

  useEffect(() => {
    setFrom(f.paceShort(value.from));
    setTo(f.paceShort(value.to));
    setError(null);
  }, [value.from, value.to, f]);

  const commit = () => {
    const band = { from: parsePace(from), to: parsePace(to) };
    if (band.from === null || band.to === null) return setError('paceFormat');
    const problem = checkPaceBand(band as { from: number; to: number });
    setError(problem);
    if (problem || (band.from === value.from && band.to === value.to)) return;
    const isDefault = band.from === DEFAULT_EASY_PACE.from && band.to === DEFAULT_EASY_PACE.to;
    onSave(isDefault ? undefined : (band as { from: number; to: number }));
  };

  const input = (label: string, text: string, set: (v: string) => void) => (
    <input
      className={s.input}
      aria-label={label}
      inputMode="decimal"
      autoComplete="off"
      value={text}
      aria-invalid={!!error}
      onChange={(e) => set(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && commit()}
    />
  );

  return (
    <Row title={t.settings.easyPace} hint={t.settings.easyPaceHint} error={error && t.settings.errors[error]}>
      <div className={s.field}>
        <span className={s.inputs}>
          {input(t.settings.easyPaceFrom, from, setFrom)}–{input(t.settings.easyPaceTo, to, setTo)}
          {t.settings.perKm}
        </span>
        {own && (
          <button type="button" className={s.reset} onClick={() => onSave(undefined)}>
            {t.settings.useDefault}
          </button>
        )}
      </div>
    </Row>
  );
}

function Data() {
  const { source, sync, lastSync, syncNow, chooseSource, disconnectCoros, removeAllData, t, f } = useApp();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const syncing = sync.status === 'syncing';
  const toStart = () => navigate('/', { replace: true });

  return (
    <>
      <div className={s.card}>
        {source === 'coros' ? (
          <>
            <Row
              title={t.settings.sourceCoros}
              hint={lastSync ? t.settings.sourceCorosHint(f.ago(lastSync)) : t.settings.sourceCorosFirst}
              error={sync.status === 'error' ? t.sidebar.syncFailed : undefined}
            >
              <button type="button" className={s.button} disabled={syncing} onClick={syncNow}>
                {syncing ? t.sidebar.syncing : t.settings.syncNow}
              </button>
            </Row>
            <Row title={t.settings.disconnect} hint={t.settings.disconnectHint}>
              <button
                type="button"
                className={s.button}
                onClick={() => {
                  toStart();
                  void disconnectCoros();
                }}
              >
                {t.settings.disconnectButton}
              </button>
            </Row>
          </>
        ) : (
          <Row title={t.settings.sourceSample} hint={t.settings.sourceSampleHint}>
            <button
              type="button"
              className={s.button}
              onClick={() => {
                // Start explains what Forma reads before COROS opens.
                toStart();
                chooseSource();
              }}
            >
              {t.settings.connect}
            </button>
          </Row>
        )}
        <Row title={t.settings.remove} hint={t.settings.removeHint}>
          <button type="button" className={`${s.button} ${s.danger}`} onClick={() => setConfirming(true)}>
            {t.settings.remove}
          </button>
        </Row>
      </div>

      {/* Opens on top of the settings dialog; Esc closes only this one. */}
      <ConfirmDialog
        open={confirming}
        tone="danger"
        title={t.settings.removeTitle}
        body={t.settings.removeBody}
        confirm={t.settings.remove}
        cancel={t.settings.cancel}
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          toStart();
          void removeAllData();
        }}
      />
    </>
  );
}

function About() {
  const { t } = useApp();
  return (
    <div className={s.card}>
      <Row title="Forma" hint={t.settings.aboutHint(version)}>
        <a className={s.button} href={REPO} target="_blank" rel="noreferrer">
          {t.settings.github}
          <Icon name="external" size={14} />
        </a>
      </Row>
      <Row title={t.settings.author} hint={AUTHOR.name}>
        <a className={s.button} href={AUTHOR.url} target="_blank" rel="noreferrer">
          {t.settings.authorProfile}
          <Icon name="external" size={14} />
        </a>
      </Row>
      <Row title={t.settings.corosData} hint={t.settings.corosDataHint} />
    </div>
  );
}

function Row({
  title,
  hint,
  error,
  children,
}: {
  title: ReactNode;
  hint: string;
  error?: string | null;
  children?: ReactNode;
}) {
  return (
    <div className={s.row}>
      <div className={s.rowText}>
        <span className={s.rowTitle}>{title}</span>
        <span className={s.rowHint}>{hint}</span>
        {error && (
          <span className={s.rowError} role="alert">
            {error}
          </span>
        )}
      </div>
      {children && <div className={s.rowControl}>{children}</div>}
    </div>
  );
}
