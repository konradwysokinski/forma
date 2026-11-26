import type { ReactNode } from 'react';
import s from './KpiCard.module.css';

interface Props {
  label: ReactNode;
  value: ReactNode;
  sub: ReactNode;
  tone?: 'default' | 'warn';
  /** 34px values on Overview, 30px on detail screens. */
  size?: 'lg' | 'md';
  /** The value's colour, when it matches a line or zone on the chart below (an -ink token). */
  color?: string;
}

export function KpiCard({ label, value, sub, tone = 'default', size = 'lg', color }: Props) {
  return (
    <div className={s.card}>
      <span className={s.label}>{label}</span>
      <span className={`${s.value} ${size === 'md' ? s.md : ''} ${tone === 'warn' ? s.warn : ''}`} style={color ? { color } : undefined}>{value}</span>
      <span className={s.sub}>{sub}</span>
    </div>
  );
}
