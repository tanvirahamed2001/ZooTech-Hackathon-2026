import React from 'react';
import { motion } from 'framer-motion';

type ProgressBarProps = {
  current: number;
  total: number;
};

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  const progress = ((current + 1) / total) * 100;

  return (
    <div
      className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Question ${current + 1} of ${total}`}
    >
      <motion.div
        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 dark:from-violet-500 dark:to-indigo-500 rounded-full"
        initial={{ width: `${(current / total) * 100}%` }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </div>
  );
};

export default ProgressBar;