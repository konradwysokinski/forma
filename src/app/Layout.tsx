import { NavLink, Outlet } from 'react-router';
import { Icon } from '../components/Icon';
import { Segmented } from '../components/Segmented';
import { LOCALES, MESSAGES, type Locale } from '../i18n';
import { useApp } from './context';
import s from './Layout.module.css';

/** Tinted sidebar plus one white content panel, as in Kilometr. */
export function Layout() {
  const { t, locale, setLocale, data } = useApp();
  return (
    <div className={s.app}>
      <nav aria-label={t.nav.label} className={s.sidebar}>
        <NavLink to="/" className={s.wordmark}>
          Forma
        </NavLink>
        <div className={s.group}>
          <NavLink to="/" end className={({ isActive }) => `${s.navRow} ${isActive ? s.active : ''}`}>
            <Icon name="form" className={s.navIcon} />
            {t.nav.form}
          </NavLink>
        </div>
        <div className={s.footer}>
          {data.source === 'sample' && (
            <span className={s.status}>
              <span className={s.dot} aria-hidden="true" />
              {t.sidebar.sampleData}
            </span>
          )}
          <Segmented<Locale>
            label={t.nav.language}
            value={locale}
            onChange={setLocale}
            options={LOCALES.map((l) => ({
              value: l,
              label: l.toUpperCase(),
              ariaLabel: MESSAGES[l].languageName,
              lang: l,
            }))}
          />
        </div>
      </nav>
      <main className={s.panel}>
        <Outlet />
      </main>
    </div>
  );
}
