import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { Spinner } from './components/ui';
import Home from './pages/Home';

const Recommend = lazy(() => import('./pages/Recommend'));
const Market = lazy(() => import('./pages/Market'));
const Advisor = lazy(() => import('./pages/Advisor'));
const ModelCard = lazy(() => import('./pages/ModelCard'));

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/recommend" element={<Recommend />} />
          <Route path="/market" element={<Market />} />
          <Route path="/advisor" element={<Advisor />} />
          <Route path="/model" element={<ModelCard />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
