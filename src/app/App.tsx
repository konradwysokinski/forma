import { BrowserRouter, Route, Routes } from 'react-router';
import { COROS_CALLBACK_PATH } from '../coros/oauth';
import { CorosCallback } from '../screens/CorosCallback';
import { FirstSync } from '../screens/FirstSync';
import { FormScreen } from '../screens/Form';
import { Start } from '../screens/Start';
import { useApp } from './context';
import { Layout } from './Layout';

/** Form, or the first-sync progress while COROS data is still on its way. */
function Home() {
  const { source, data } = useApp();
  return source === 'coros' && !data.activities.length ? <FirstSync /> : <FormScreen />;
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
            <Route path="*" element={<Home />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}
