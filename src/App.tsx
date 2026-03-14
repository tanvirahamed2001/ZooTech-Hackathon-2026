import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { QuizProvider } from './contexts/QuizContext';
import LandingPage from './components/landing/LandingPage';
import QuizContainer from './components/quiz/QuizContainer';
import ResultsPage from './components/results/ResultsPage';
import NotFoundPage from './components/shared/NotFoundPage';

function App() {
  return (
    <ThemeProvider>
      <QuizProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/quiz" element={<QuizContainer />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/r/:hash" element={<ResultsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </QuizProvider>
    </ThemeProvider>
  );
}

export default App;
