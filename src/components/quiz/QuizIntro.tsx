import React from 'react';
import { motion } from 'framer-motion';
import { useQuiz } from '../../contexts/QuizContext';
import { CheckCircle } from 'lucide-react';

const QuizIntro: React.FC = () => {
  const { goToNextQuestion } = useQuiz();

  return (
    <div className="flex items-center justify-center p-4 min-h-[calc(100vh-3.5rem)]">
      <motion.div
        className="card max-w-2xl w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-xl font-semibold text-center text-gray-800 dark:text-gray-100 mb-8">
          Let's Build Your AI Communication Profile.
        </h3>

        <div className="space-y-5 mb-10">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-violet-500 dark:text-violet-400 mt-1 flex-shrink-0" strokeWidth={2.5} aria-hidden />
            <p className="text-gray-600 dark:text-gray-300">Select all answers that apply to each scenario</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-violet-500 dark:text-violet-400 mt-1 flex-shrink-0" strokeWidth={2.5} aria-hidden />
            <p className="text-gray-600 dark:text-gray-300">Skip questions that don't resonate with you</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-violet-500 dark:text-violet-400 mt-1 flex-shrink-0" strokeWidth={2.5} aria-hidden />
            <p className="text-gray-600 dark:text-gray-300">Be honest — there are no wrong answers</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-violet-500 dark:text-violet-400 mt-1 flex-shrink-0" strokeWidth={2.5} aria-hidden />
            <p className="text-gray-600 dark:text-gray-300">You'll get two AI prompts tuned to how your brain processes information</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-5 rounded-xl mb-10 border border-amber-100 dark:border-amber-800">
          <p className="text-amber-900 dark:text-amber-200 font-medium italic">
            "Your brain already knows how it works best. Let's teach your AI the same thing."
          </p>
          <p className="text-right text-amber-700 dark:text-amber-400 text-sm mt-2">— RayRayRay</p>
        </div>

        <motion.button
          onClick={goToNextQuestion}
          className="btn-primary w-full md:w-auto md:mx-auto md:px-10 flex justify-center"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          aria-label="Start quiz"
        >
          Let's Begin!
        </motion.button>
      </motion.div>
    </div>
  );
};

export default QuizIntro;
