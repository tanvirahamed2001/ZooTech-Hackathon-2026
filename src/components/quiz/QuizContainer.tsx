import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuiz } from '../../contexts/QuizContext';
import { questions } from '../../data/questions';
import Question from './Question';
import ProgressBar from './ProgressBar';
import QuizIntro from './QuizIntro';
import ThemeToggle from '../shared/ThemeToggle';

const QuizContainer: React.FC = () => {
  const { quizState } = useQuiz();

  if (questions.length === 0) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="max-w-md text-center px-4 card">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">No questionnaire loaded</h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Add questions to <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-violet-600 dark:text-violet-400">src/data/questions.ts</code> or import from{' '}
            <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-violet-600 dark:text-violet-400">src/data/questionnaires/</code> to get started.
          </p>
        </div>
      </div>
    );
  }

  if (quizState.currentQuestionIndex === -1) {
    return <QuizIntro />;
  }

  const currentQuestion = questions[quizState.currentQuestionIndex];

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-violet-100 dark:border-gray-700 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/varkly-icon.svg" alt="Varkly" className="h-7 w-7 mr-1.5" />
            <span className="text-base font-semibold text-gray-800 dark:text-gray-100">Varkly</span>
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <div className="py-6 px-4">
      <div className="max-w-3xl mx-auto mb-6 px-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">Question {quizState.currentQuestionIndex + 1} of {questions.length}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{Math.round(((quizState.currentQuestionIndex + 1) / questions.length) * 100)}% complete</p>
        </div>
        <ProgressBar current={quizState.currentQuestionIndex} total={questions.length} />
      </div>

      <AnimatePresence mode="wait">
        <Question key={currentQuestion.id} question={currentQuestion} />
      </AnimatePresence>
      
      <motion.div 
        className="mt-8 text-center text-gray-500 dark:text-gray-400 text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.7 }}
      >
        <p>Select all answers that apply to you, or skip if none do</p>
      </motion.div>
      </div>
    </div>
  );
};

export default QuizContainer;