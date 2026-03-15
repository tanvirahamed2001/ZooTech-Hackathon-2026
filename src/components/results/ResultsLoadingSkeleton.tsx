import React from 'react';
import { motion } from 'framer-motion';

const ResultsLoadingSkeleton: React.FC = () => {
  return (
    <motion.div
      className="card text-center py-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center">
        <div
          className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-6"
          aria-hidden
        />
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2 animate-pulse" />
        <div className="h-4 w-64 bg-gray-100 dark:bg-gray-700/80 rounded animate-pulse" />
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">
          Calculating your learning style preferences…
        </p>
      </div>
    </motion.div>
  );
};

export default ResultsLoadingSkeleton;
