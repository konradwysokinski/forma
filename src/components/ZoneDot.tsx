import type { CSSProperties } from 'react';
import { useApp } from '../app/context';
import type { Zone } from '../domain/training';
import s from './ZoneDot.module.css';

/**
 * A small dot in the colour of a day's form zone. The zone's name is in its
 * title and, unless the parent already says it, in hidden text for screen readers.
 */
export function ZoneDot({ zone, spoken = true, className }: { zone: Zone; spoken?: boolean; className?: string }) {
  const { t } = useApp();
  const name = t.zones[zone].name;
  return (
    <>
      <span
        className={className ? `${s.dot} ${className}` : s.dot}
        style={{ '--zone': `var(--zone-${zone})` } as CSSProperties}
        title={t.activities.formDot(name)}
        aria-hidden="true"
      />
      {spoken && <span className="visually-hidden">{t.activities.formDot(name)}: </span>}
    </>
  );
}
