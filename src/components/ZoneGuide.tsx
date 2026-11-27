import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useApp } from '../app/context';
import { ZONES, type Zone } from '../domain/training';
import { Icon } from './Icon';
import s from './ZoneGuide.module.css';

type Section = 'about' | Zone;
const SECTIONS: readonly Section[] = ['about', ...ZONES.map((z) => z.id)];

const zoneStyle = (zone: Zone) =>
  ({ '--zone': `var(--zone-${zone})`, '--zone-ink': `var(--zone-${zone}-ink)` }) as CSSProperties;

/**
 * How form is worked out and what each zone means, laid out like Settings:
 * a side nav (How it works, then the five zones; tabs on phones) and the
 * chosen part on the right. Opens on How it works.
 */
export function ZoneGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useApp();
  const ref = useRef<HTMLDialogElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const titleId = useId();
  const idPrefix = useId();
  const [section, setSection] = useState<Section>('about');

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setSection('about');
      dialog.showModal();
    } else if (!open && dialog.open) dialog.close();
  }, [open]);

  // On phones the tabs scroll sideways: keep the chosen one in view.
  useEffect(() => {
    tabs.current[SECTIONS.indexOf(section)]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [section]);

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

  const name = (key: Section) => (key === 'about' ? t.zoneGuide.about : t.zones[key].name);

  return (
    <dialog
      ref={ref}
      className={s.dialog}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // click on the scrim
      }}
    >
      <div className={s.shell}>
        <div className={s.side}>
          <h2 id={titleId} className={s.title}>
            {t.zoneGuide.title}
          </h2>
          <div role="tablist" aria-label={t.zoneGuide.sections} aria-orientation="vertical" className={s.tabs}>
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
                style={key === 'about' ? undefined : zoneStyle(key)}
                onClick={() => setSection(key)}
                onKeyDown={(e) => onTabKey(e, i)}
              >
                {key !== 'about' && <span className={s.swatch} aria-hidden="true" />}
                {name(key)}
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
            {section === 'about' ? (
              <h3 className={s.sectionTitle}>{t.zoneGuide.about}</h3>
            ) : (
              <h3 className={s.sectionTitle} style={zoneStyle(section)}>
                <span className={s.zoneName}>{t.zones[section].name}</span>
                <span className={s.range}>{t.zones[section].range}</span>
              </h3>
            )}
            <button type="button" className={s.close} aria-label={t.zoneGuide.close} onClick={onClose} autoFocus>
              <Icon name="close" size={16} />
            </button>
          </div>

          {section === 'about' ? (
            <>
              {t.zoneGuide.intro.map((p) => (
                <p key={p.slice(0, 20)} className={s.text}>
                  {p}
                </p>
              ))}
              <ul className={s.zoneList} aria-label={t.form.zonesLabel}>
                {ZONES.map(({ id }) => (
                  <li key={id} style={zoneStyle(id)}>
                    <button type="button" className={s.zoneRow} onClick={() => setSection(id)}>
                      <span className={s.bar} aria-hidden="true" />
                      <span className={s.zoneName}>{t.zones[id].name}</span>
                      <span className={s.rowRange}>{t.zones[id].range}</span>
                      <span className={s.rowNote}>{t.zones[id].note}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className={s.zoneBody} style={zoneStyle(section)}>
              <p className={s.note}>{t.zones[section].note}</p>
              <p className={s.text}>{t.zoneGuide.zones[section]}</p>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
