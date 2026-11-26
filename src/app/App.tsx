import { BrowserRouter, Route, Routes, useLocation } from 'react-router';
import { COROS_CALLBACK_PATH } from '../coros/oauth';
import { ActivitiesScreen } from '../screens/Activities';
import { CorosCallback } from '../screens/CorosCallback';
import { FirstSync } from '../screens/FirstSync';
import { FormScreen } from '../screens/Form';
import { Start } from '../screens/Start';
import { useApp } from './context';
import { ACTIVITIES_PATH, Layout, SETTINGS_PATH } from './Layout';

/** Form, or the first-sync progress while COROS data is still on its way. */
function Home() {
  const { source, data } = useApp();
  return source === 'coros' && !data.activities.length ? <FirstSync /> : <FormScreen />;
}

/**
 * The screen for the path; under Settings (a modal at /settings), the screen
 * it was opened from. One route, so that screen keeps its state meanwhile.
 */
function Screen() {
  const location = useLocation();
  const path =
    location.pathname === SETTINGS_PATH
      ? ((location.state as { from?: string } | null)?.from ?? '/')
      : location.pathname;
  return path === ACTIVITIES_PATH ? <ActivitiesScreen /> : <Home />;
}

export function App() {
  const { source } = useApp();
  return (
    <BrowserRouter>
      <Routes>
        <Route path={COROS_CALLBACK_PATH} element={<CorosCallback />} />
        {source === 'none' ? (
          <Route path="*" element={<Start />} />
        ) : source === 'loading' ? (
          <Route path="*" element={null} />
        ) : (
          <Route element={<Layout />}>
            <Route path="*" element={<Screen />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}
