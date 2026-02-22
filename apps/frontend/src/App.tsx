import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { HomePage } from '@/components/HomePage';

const DocsPage = lazy(() =>
  import('@/components/DocsPage').then((m) => ({ default: m.DocsPage }))
);

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="h-6 w-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/api" element={<DocsPage />} />
        <Route path="/ai" element={<DocsPage />} />
      </Routes>
    </Suspense>
  );
}
