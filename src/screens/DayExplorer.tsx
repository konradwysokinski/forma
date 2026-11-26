import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { useApp } from '../app/context';
import { dayAt, dayX } from '../components/chartAxis';
import { activityLine, DayTooltip } from '../components/DayTooltip';
import { activitiesByDay } from '../domain/activitiesByDay';
import { zoneOf, type TrainingDay } from '../domain/training';
import { dateOf } from '../lib/days';
import { useWidth } from '../lib/useWidth';
import s from './DayExplorer.module.css';

/** Gap between the guide line and the tooltip card, px. */
const TIP_GAP = 12;

/**
 * The fitness chart and the form bars as one area to explore day by day:
 * hover or tap a day, or Tab in and use the arrow keys. Both charts share
 * their x positions, so one day index drives the guide line through both
 * and the one tooltip.
 */
export function DayExplorer({
  days,
  children,
}: {
  days: readonly TrainingDay[];
  children: (active: number | null) => ReactNode;
}) {
  const { t, f, data } = useApp();
  const [ref, width] = useWidth<HTMLDivElement>(630);
  const [active, setActive] = useState<number | null>(null);
  const byDay = useMemo(() => activitiesByDay(data.activities), [data.activities]);
  const n = days.length;
  const pointerType = useRef<string>('mouse');

  // A tap outside closes a tooltip opened by touch (a finger never "leaves").
  useEffect(() => {
    if (active === null) return;
    const close = (e: globalThis.PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setActive(null);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [active, ref]);

  const track = (e: PointerEvent<HTMLDivElement>) => {
    pointerType.current = e.pointerType;
    const svg = (e.target as Element).closest('svg');
    if (!svg || !n) return;
    const box = svg.getBoundingClientRect();
    setActive(dayAt(e.clientX - box.left, n, box.width));
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (!n) return;
    const moves: Record<string, number> = {
      ArrowLeft: (active ?? n) - 1,
      ArrowRight: (active ?? n - 2) + 1,
      Home: 0,
      End: n - 1,
    };
    if (e.key === 'Escape') {
      setActive(null);
      return;
    }
    if (!(e.key in moves)) return;
    e.preventDefault();
    setActive(Math.min(n - 1, Math.max(0, moves[e.key]!)));
  };

  const day = active === null ? null : days[active]!;
  const list = day ? (byDay.get(day.date) ?? []) : [];
  const x = active === null ? 0 : dayX(active, n, width);
  const side = x > width / 2 ? 'left' : 'right';

  // The same day in words, for screen readers.
  const spoken = day
    ? [
        f.weekdayDate(dateOf(day.date)),
        day.form !== null && `${t.form.kpiForm} ${f.signed(day.form)}%, ${t.zones[zoneOf(day.form)].name}`,
        `${t.form.fitness} ${f.int(day.fitness)}`,
        `${t.form.fatigue} ${f.int(day.fatigue)}`,
        `${t.form.dayLoad} ${f.int(day.load)}`,
        list.length ? list.map((a) => activityLine(a, f)).join('; ') : t.form.restDay,
      ]
        .filter(Boolean)
        .join('. ')
    : '';

  return (
    <div
      ref={ref}
      className={s.explore}
      role="group"
      tabIndex={0}
      aria-label={t.form.exploreLabel}
      onPointerMove={track}
      onPointerDown={track}
      onPointerLeave={(e) => e.pointerType !== 'touch' && setActive(null)}
      onKeyDown={onKeyDown}
      onFocus={(e) => {
        if (active === null && e.currentTarget.matches(':focus-visible')) setActive(n - 1);
      }}
      onBlur={() => pointerType.current !== 'touch' && setActive(null)}
    >
      {children(active)}
      {day && (
        <DayTooltip
          day={day}
          activities={list}
          side={side}
          style={
            side === 'right'
              ? { left: Math.min(x + TIP_GAP, width - 200) }
              : { left: Math.max(x - TIP_GAP, 200), transform: 'translateX(-100%)' }
          }
        />
      )}
      <span className="visually-hidden" aria-live="polite">
        {spoken}
      </span>
    </div>
  );
}
