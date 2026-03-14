import React from 'react';
import { motion } from 'framer-motion';
import { useQuiz } from '../../contexts/QuizContext';
import { CheckCircle } from 'lucide-react';
import ThemeToggle from '../shared/ThemeToggle';

const QuizIntro: React.FC = () => {
  const { goToNextQuestion } = useQuiz();
  
  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-violet-100 dark:border-gray-700 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/varkly-icon.svg" alt="Varkly" className="h-8 w-8 mr-1.5" />
            <span className="text-base font-semibold text-gray-800 dark:text-gray-100">Varkly</span>
          </div>
          <ThemeToggle />
        </div>
      </nav>
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-3.5rem)]">
      <motion.div 
        className="card max-w-2xl w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-xl font-semibold text-center text-gray-800 dark:text-gray-100 mb-8">
          Let's Discover Your Learning Style!
        </h3>

        <div className="space-y-5 mb-10">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-violet-500 mt-1 mr-3 flex-shrink-0" strokeWidth={2.5} />
            <p className="text-gray-600 dark:text-gray-300">Select <strong className="text-gray-800 dark:text-gray-100">all answers</strong> that apply to you in each scenario</p>
          </div>
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-violet-500 mt-1 mr-3 flex-shrink-0" strokeWidth={2.5} />
            <p className="text-gray-600 dark:text-gray-300">Skip questions that don't resonate with you</p>
          </div>
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-violet-500 mt-1 mr-3 flex-shrink-0" strokeWidth={2.5} />
            <p className="text-gray-600 dark:text-gray-300">Be honest - this isn't a test, it's about understanding your natural preferences</p>
          </div>
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-violet-500 mt-1 mr-3 flex-shrink-0" strokeWidth={2.5} />
            <p className="text-gray-600 dark:text-gray-300">Takes about 3 minutes to complete all 13 questions</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-5 rounded-xl mb-10 border border-amber-100 dark:border-amber-800">
          <p className="text-amber-900 dark:text-amber-200 font-medium italic">
            "Your brain is unique, like a fingerprint but with more opinions and a weird obsession with cat videos. Let's figure out how it actually works!"
          </p>
          <p className="text-right text-amber-700 dark:text-amber-400 text-sm mt-2">— RayRayRay</p>
        </div>
        
        <motion.button
          onClick={goToNextQuestion}
          className="btn-primary w-full md:w-auto md:mx-auto md:px-10 flex justify-center"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Let's Begin!
        </motion.button>
      </motion.div>
      </div>
    </div>
  );
};

export default QuizIntro;