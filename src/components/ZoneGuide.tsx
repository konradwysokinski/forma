import { useEffect, useId, useRef, type CSSProperties } from 'react';
import { useApp } from '../app/context';
import { ZONES, type Zone } from '../domain/training';
import { Icon } from './Icon';
import s from './ZoneGuide.module.css';

/**
 * What form is and what each zone means, in a native modal <dialog>. Opened
 * from a zone's info button, it scrolls to that zone and marks it.
 */
export function ZoneGuide({ zone, onClose }: { zone: Zone | null; onClose: () => void }) {
  const { t } = useApp();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const idPrefix = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (zone && !dialog.open) dialog.showModal();
    else if (!zone && dialog.open) dialog.close();
    if (zone) document.getElementById(`${idPrefix}-${zone}`)?.scrollIntoView({ block: 'nearest' });
  }, [zone, idPrefix]);

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
      <div className={s.head}>
        <h2 id={titleId} className={s.title}>
          {t.zoneGuide.title}
        </h2>
        <button type="button" className={s.close} aria-label={t.zoneGuide.close} onClick={onClose} autoFocus>
          <Icon name="close" size={16} />
        </button>
      </div>
      <div className={s.body}>
        {t.zoneGuide.intro.map((p) => (
          <p key={p.slice(0, 20)} className={s.intro}>
            {p}
          </p>
        ))}
        <ul className={s.zones}>
          {ZONES.map(({ id }) => (
            <li
              key={id}
              id={`${idPrefix}-${id}`}
              className={s.zone}
              data-current={id === zone || undefined}
              style={{ '--zone': `var(--zone-${id})`, '--zone-ink': `var(--zone-${id}-ink)` } as CSSProperties}
            >
              <span className={s.bar} aria-hidden="true" />
              <div className={s.text}>
                <h3 className={s.name}>
                  {t.zones[id].name} <span className={s.range}>{t.zones[id].range}</span>
                </h3>
                <p className={s.about}>{t.zoneGuide.zones[id]}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  );
}
