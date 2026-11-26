import { BrowserRouter, Route, Routes } from 'react-router';
import { FormScreen } from '../screens/Form';
import { Layout } from './Layout';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<FormScreen />} />
          <Route path="*" element={<FormScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
