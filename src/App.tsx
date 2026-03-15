import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { QuizProvider } from './contexts/QuizContext';
import { ToastProvider } from './contexts/ToastContext';
import AppLayout from './components/layout/AppLayout';
import ErrorBoundary from './components/shared/ErrorBoundary';
import Toast from './components/shared/Toast';
import { ROUTES } from './constants/app';

const LandingPage = lazy(() => import('./components/landing/LandingPage'));
const QuizContainer = lazy(() => import('./components/quiz/QuizContainer'));
const ResultsPage = lazy(() => import('./components/results/ResultsPage'));
const NotFoundPage = lazy(() => import('./components/shared/NotFoundPage'));

const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50/80 dark:bg-gray-900/80">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <QuizProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route
                  path={ROUTES.home}
                  element={
                    <AppLayout showFooter>
                      <LandingPage />
                    </AppLayout>
                  }
                />
                <Route
                  path={ROUTES.quiz}
                  element={
                    <AppLayout showFooter={false}>
                      <QuizContainer />
                    </AppLayout>
                  }
                />
                <Route
                  path={ROUTES.results}
                  element={
                    <AppLayout showFooter={false}>
                      <ResultsPage />
                    </AppLayout>
                  }
                />
                <Route
                  path="/r/:hash"
                  element={
                    <AppLayout showFooter={false}>
                      <ResultsPage />
                    </AppLayout>
                  }
                />
                <Route
                  path="*"
                  element={
                    <AppLayout showFooter>
                      <NotFoundPage />
                    </AppLayout>
                  }
                />
              </Routes>
            </Suspense>
            <Toast />
          </QuizProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
