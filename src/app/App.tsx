import { BrowserRouter, Route, Routes } from 'react-router';
import { COROS_CALLBACK_PATH } from '../coros/oauth';
import { CorosCallback, CorosSpike } from '../screens/CorosSpike';
import { FormScreen } from '../screens/Form';
import { Layout } from './Layout';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<FormScreen />} />
          {/* COROS test page: development only, never in the built app. */}
          {import.meta.env.DEV && (
            <>
              <Route path="/coros" element={<CorosSpike />} />
              <Route path={COROS_CALLBACK_PATH} element={<CorosCallback />} />
            </>
          )}
          <Route path="*" element={<FormScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
