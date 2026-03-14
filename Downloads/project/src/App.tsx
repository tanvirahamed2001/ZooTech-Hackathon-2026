import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { QuizProvider } from './contexts/QuizContext';
import VisitorTracker from './components/analytics/VisitorTracker';
import LandingPage from './components/landing/LandingPage';
import QuizContainer from './components/quiz/QuizContainer';
import ResultsPage from './components/results/ResultsPage';
import UnsubscribePage from './components/unsubscribe/UnsubscribePage';
import AnalyticsPage from './components/analytics/AnalyticsPage';
import MyResultsPage from './components/my-results/MyResultsPage';

function App() {
  return (
    <ThemeProvider>
    <QuizProvider>
      <VisitorTracker />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/quiz" element={<QuizContainer />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/r/:hash" element={<ResultsPage />} />
        <Route path="/my-results" element={<MyResultsPage />} />
        <Route path="/u/:id" element={<UnsubscribePage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Routes>
    </QuizProvider>
    </ThemeProvider>
  );
}

export default App;