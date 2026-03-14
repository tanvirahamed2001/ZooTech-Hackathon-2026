import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { QuizProvider } from './contexts/QuizContext';
import LandingPage from './components/landing/LandingPage';
import QuizContainer from './components/quiz/QuizContainer';
import ResultsPage from './components/results/ResultsPage';

function App() {
  return (
    <ThemeProvider>
      <QuizProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/quiz" element={<QuizContainer />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/r/:hash" element={<ResultsPage />} />
        </Routes>
      </QuizProvider>
    </ThemeProvider>
  );
}

export default App;
