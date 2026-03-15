import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuiz } from '../../contexts/QuizContext';
import { usePageMeta } from '../../hooks/usePageMeta';
import { APP } from '../../constants/app';

const LandingPage: React.FC = () => {
  const { startQuiz } = useQuiz();
  usePageMeta('', APP.description);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        startQuiz();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [startQuiz]);

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        <motion.header
          className="text-center mb-14 md:mb-20"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent dark:from-violet-400 dark:via-indigo-400 dark:to-emerald-400 tracking-tight leading-tight mb-3">
            Your AI doesn't know how your brain works. Fix that in 90 seconds.
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg md:text-xl max-w-xl mx-auto">
            Answer {APP.quizQuestionCount} questions. Get a personalized prompt that makes any AI speak your brain's language.
          </p>
        </motion.header>

        <motion.div
          className="card mb-12 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            AI gives everyone the same format. Your brain doesn't work like everyone else's.
          </h2>

          <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Everyone's brain has a preferred way of processing information. When your AI doesn't know your style, you spend more energy decoding its answers than actually learning. {APP.name} fixes that.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Take the VARK Learning Style Quiz
          </h3>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This quiz helps you discover if you're a:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <div className="p-5 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-100 dark:border-violet-800">
              <h4 className="font-semibold text-violet-800 dark:text-violet-300">Visual Learner</h4>
              <p className="text-violet-700/90 dark:text-violet-400 text-sm mt-1">You process information best through charts, diagrams, and seeing things demonstrated</p>
            </div>
            <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300">Auditory Learner</h4>
              <p className="text-blue-700/90 dark:text-blue-400 text-sm mt-1">You learn best through listening, discussions, and verbal instructions</p>
            </div>
            <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
              <h4 className="font-semibold text-emerald-800 dark:text-emerald-300">Read/Write Learner</h4>
              <p className="text-emerald-700/90 dark:text-emerald-400 text-sm mt-1">You prefer information displayed as words, lists, and written materials</p>
            </div>
            <div className="p-5 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
              <h4 className="font-semibold text-amber-800 dark:text-amber-300">Kinesthetic Learner</h4>
              <p className="text-amber-700/90 dark:text-amber-400 text-sm mt-1">You learn through doing, experiencing, and hands-on activities</p>
            </div>
          </div>

          <motion.button
            onClick={startQuiz}
            className="btn-primary w-full md:w-auto md:mx-auto md:px-10 flex justify-center text-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && startQuiz()}
            aria-label="Start Your Free Quiz (Press Enter)"
          >
            Start Your Free Quiz (Press Enter)
          </motion.button>
        </motion.div>

        <motion.div
          className="text-center text-gray-500 dark:text-gray-400 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p>{APP.quizQuestionCount} questions • {APP.quizEstimatedSeconds} seconds • No login required</p>
          <p className="mt-1">Results available immediately</p>
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;
