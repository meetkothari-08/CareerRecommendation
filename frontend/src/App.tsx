import { lazy, Suspense, useEffect } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { Spinner } from './components/ui';
import Home from './pages/Home';

const Recommend = lazy(() => import('./pages/Recommend'));
const Market = lazy(() => import('./pages/Market'));
const Advisor = lazy(() => import('./pages/Advisor'));

const TITLES: Record<string, string> = {
  '/': 'CareerRec — AI Career Recommendation',
  '/recommend': 'Recommendations · CareerRec',
  '/market': 'Market Insights · CareerRec',
  '/advisor': 'AI Advisor · CareerRec',
};

function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-sm font-semibold text-indigo-600">404</p>
      <h1 className="mt-2 text-2xl font-bold">Page not found</h1>
      <Link to="/" className="btn-primary mt-6">Back home</Link>
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = TITLES[pathname] ?? 'CareerRec';
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <Layout>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/recommend" element={<Recommend />} />
          <Route path="/market" element={<Market />} />
          <Route path="/advisor" element={<Advisor />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
