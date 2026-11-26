import type { CSSProperties, ReactNode } from 'react';
import seg from './Segmented.module.css';
import s from './Toggle.module.css';

/**
 * An on/off switch for something extra on a card, in the same box as
 * Segmented (sm): a pressed button, filled when on. `swatch` is a CSS
 * colour shown as a small square, solid when on and outlined when off.
 */
export function Toggle({
  label,
  pressed,
  onChange,
  swatch,
}: {
  label: ReactNode;
  pressed: boolean;
  onChange: (pressed: boolean) => void;
  swatch?: string;
}) {
  return (
    <span className={`${seg.group} ${seg.sm}`}>
      <button type="button" className={`${seg.option} ${s.option}`} aria-pressed={pressed} onClick={() => onChange(!pressed)}>
        {swatch && <span className={s.swatch} style={{ '--swatch': swatch } as CSSProperties} aria-hidden="true" />}
        {label}
      </button>
    </span>
  );
}
