import React from 'react';
import { motion } from 'framer-motion';
import { VarkScores } from '../../types';

type ResultsChartProps = {
  scores: VarkScores;
};

const ResultsChart: React.FC<ResultsChartProps> = ({ scores }) => {
  const maxScore = Math.max(scores.V, scores.A, scores.R, scores.K);
  const totalQuestions = 13; // Total number of quiz questions

  const getBarHeight = (score: number) => {
    // Calculate percentage of maximum possible score (which is the total questions)
    return (score / totalQuestions) * 100;
  };

  const getBarColor = (type: keyof VarkScores) => {
    const colors = {
      V: 'bg-[#af52de]',
      A: 'bg-[#0071e3]',
      R: 'bg-[#34c759]',
      K: 'bg-[#ff9f0a]',
    };
    return scores[type] === maxScore
      ? `${colors[type]}`
      : `${colors[type]} opacity-60`;
  };
  
  const getBarLabel = (type: keyof VarkScores) => {
    const labels = {
      V: 'Visual',
      A: 'Auditory',
      R: 'Read/Write',
      K: 'Kinesthetic',
    };
    
    return labels[type];
  };

  const barVariants = {
    hidden: { height: 0 },
    visible: (height: number) => ({
      height: `${height}%`,
      transition: { duration: 0.8, ease: "easeOut" }
    })
  };

  return (
    <div className="w-full">
      <div className="flex justify-around h-60 mb-6 mt-8">
        {(Object.keys(scores) as Array<keyof VarkScores>).map((type) => (
          <div key={type} className="flex flex-col items-center w-16 md:w-24">
            <div className="h-full w-full flex items-end justify-center">
              <motion.div 
                className={`w-12 md:w-16 rounded-t-xl ${getBarColor(type)}`}
                custom={getBarHeight(scores[type])}
                variants={barVariants}
                initial="hidden"
                animate="visible"
              />
            </div>
            <div className="w-full text-center mt-3">
              <p className="font-semibold text-gray-600 dark:text-gray-400">{getBarLabel(type)}</p>
              <p className={`text-lg font-bold ${scores[type] === maxScore ? 'text-violet-600 dark:text-violet-400' : 'text-gray-500 dark:text-gray-400'}`}>
                {scores[type]}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2 text-center text-sm text-gray-600 dark:text-gray-400">
        <div className="bg-violet-50 dark:bg-violet-900/20 p-2 rounded-xl border border-violet-100 dark:border-violet-800">
          <p><span className="font-medium text-violet-700 dark:text-violet-400">V:</span> Visual</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-xl border border-blue-100 dark:border-blue-800">
          <p><span className="font-medium text-blue-700 dark:text-blue-400">A:</span> Auditory</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-xl border border-emerald-100 dark:border-emerald-800">
          <p><span className="font-medium text-emerald-700 dark:text-emerald-400">R:</span> Read/Write</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded-xl border border-amber-100 dark:border-amber-800">
          <p><span className="font-medium text-amber-700 dark:text-amber-400">K:</span> Kinesthetic</p>
        </div>
      </div>
    </div>
  );
};

export default ResultsChart;