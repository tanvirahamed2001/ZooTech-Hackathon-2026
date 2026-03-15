import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuiz } from '../../contexts/QuizContext';
import { useToast } from '../../contexts/ToastContext';
import { Share2, RotateCcw, Copy, Link2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import ResultsChart from './ResultsChart';
import ResultsExplanation from './ResultsExplanation';
import AIPromptsCard from './AIPromptsCard';
import ResultsLoadingSkeleton from './ResultsLoadingSkeleton';
import type { VarkScores } from '../../types';
import { usePageMeta } from '../../hooks/usePageMeta';
import { APP } from '../../constants/app';

const ResultsPage: React.FC = () => {
  const { quizState, calculateScores, resetQuiz } = useQuiz();
  const { addToast } = useToast();
  const [scores, setScores] = useState<VarkScores>({ V: 0, A: 0, R: 0, K: 0 });
  const [resultsUrl, setResultsUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [copyLinkSuccess, setCopyLinkSuccess] = useState<boolean>(false);
  const { hash } = useParams();
  const navigate = useNavigate();

  usePageMeta('Your Results', `View your VARK learning style results and personalized AI prompts — ${APP.name}`);

  useEffect(() => {
    const timer = setTimeout(() => {
      let currentScores: VarkScores;

      if (hash) {
        try {
          const decodedScores = atob(hash);
          const [V, A, R, K] = decodedScores.split('-').map(Number);

          if (
            !isNaN(V) && !isNaN(A) && !isNaN(R) && !isNaN(K) &&
            [V, A, R, K].every(score => score >= 0 && score <= 13)
          ) {
            currentScores = { V, A, R, K };
          } else {
            navigate('/');
            return;
          }
        } catch {
          navigate('/');
          return;
        }
      } else {
        currentScores = calculateScores();
        const hasAnswers = Object.keys(quizState.answers).length > 0;
        if (!hasAnswers) {
          navigate('/');
          return;
        }
      }

      setScores(currentScores);

      const scoresString = `${currentScores.V}-${currentScores.A}-${currentScores.R}-${currentScores.K}`;
      const newHash = btoa(scoresString).replace(/=/g, '');
      const url = `${window.location.origin}/r/${newHash}`;
      setResultsUrl(url);

      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [hash, calculateScores, navigate, quizState.answers]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(resultsUrl);
      setCopySuccess(true);
      addToast('Link copied to clipboard');
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      addToast('Could not copy. Please copy the URL manually.', 'error');
    }
  };

  const copyResultsLink = async () => {
    try {
      await navigator.clipboard.writeText(resultsUrl);
      setCopyLinkSuccess(true);
      addToast('Results link copied to clipboard');
      setTimeout(() => setCopyLinkSuccess(false), 2000);
    } catch {
      addToast('Could not copy. Please copy the URL manually.', 'error');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `My ${APP.name} Learning Style Results`,
          text: 'Check out my learning style profile!',
          url: resultsUrl,
        });
        addToast('Thanks for sharing!');
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          await copyToClipboard();
        }
      }
    } else {
      await copyToClipboard();
    }
  };

  const maxScore = Math.max(scores.V, scores.A, scores.R, scores.K);
  const dominantStyles = maxScore > 0
    ? Object.entries(scores).filter(([_, value]) => value === maxScore).map(([key]) => key)
    : [];

  const getFullStyleName = (code: string): string => {
    switch (code) {
      case 'V': return 'Visual';
      case 'A': return 'Auditory';
      case 'R': return 'Read/Write';
      case 'K': return 'Kinesthetic';
      default: return code;
    }
  };

  const getCongratulationMessage = () => {
    if (dominantStyles.length === 1) {
      const style = dominantStyles[0];
      switch (style) {
        case 'V': return "You're primarily a Visual learner!";
        case 'A': return "You're primarily an Auditory learner!";
        case 'R': return "You're primarily a Read/Write learner!";
        case 'K': return "You're primarily a Kinesthetic learner!";
        default: return "Congratulations on completing the assessment!";
      }
    } else {
      const names = dominantStyles.map(getFullStyleName);
      const formatted = names.length > 2
        ? `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
        : names.join(' and ');
      return `You have a multimodal learning style with strengths in ${formatted}!`;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
        <motion.header
          className="text-center mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Your Results
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">VARK Learning Style</p>
        </motion.header>

        <div>
          {isLoading ? (
            <ResultsLoadingSkeleton />
          ) : (
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="card">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">{getCongratulationMessage()}</h3>
                  <p className="text-gray-600 dark:text-gray-300">Here's how your brain prefers to process information</p>
                </div>

                <ResultsChart scores={scores} />

                <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-6">
                  <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">Share Your Results</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-semibold hover:text-white hover:bg-violet-500 transition-all duration-200 px-4 py-2.5 rounded-2xl border-2 border-violet-200 dark:border-violet-700 hover:border-violet-500 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                        title="Copy to clipboard"
                        aria-label="Copy results URL"
                      >
                        <Copy className="w-4 h-4" strokeWidth={2.5} />
                        <span className="text-sm">{copySuccess ? 'Copied!' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={handleShare}
                        className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-semibold hover:text-white hover:bg-violet-500 transition-all duration-200 px-4 py-2.5 rounded-2xl border-2 border-violet-200 dark:border-violet-700 hover:border-violet-500 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                        title="Share results"
                        aria-label="Share results"
                      >
                        <Share2 className="w-4 h-4" strokeWidth={2.5} />
                        <span className="text-sm">Share</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/80 p-3 rounded-xl overflow-x-auto whitespace-nowrap text-gray-600 dark:text-gray-300 text-sm border border-gray-100 dark:border-gray-700 font-mono">
                    {resultsUrl}
                  </div>
                </div>
              </div>

              <AIPromptsCard scores={scores} />

              <ResultsExplanation dominantStyles={dominantStyles} />

              <div className="card">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-violet-100 dark:bg-violet-900/40 rounded-xl shrink-0">
                      <Link2 className="w-4 h-4 text-violet-600 dark:text-violet-400" strokeWidth={2.5} aria-hidden />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-0.5">Your results link</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Bookmark or share this URL to return to your results any time — no retake needed.</p>
                    </div>
                  </div>
                  <motion.button
                    onClick={copyResultsLink}
                    className={`shrink-0 flex items-center justify-center gap-2 font-semibold text-sm px-4 py-2.5 rounded-2xl border-2 transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 ${
                      copyLinkSuccess
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-700 hover:text-white hover:bg-violet-500 hover:border-violet-500'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label={copyLinkSuccess ? 'Copied' : 'Copy link'}
                  >
                    <Copy className="w-4 h-4" strokeWidth={2.5} />
                    <span>{copyLinkSuccess ? 'Copied!' : 'Copy link'}</span>
                  </motion.button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/80 px-3 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 overflow-x-auto">
                  <span className="text-sm text-gray-600 dark:text-gray-300 font-mono whitespace-nowrap select-all">{resultsUrl}</span>
                </div>
              </div>

              <div className="card text-center">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Want to try again?</h3>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <motion.button
                    onClick={resetQuiz}
                    className="btn-secondary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label="Retake quiz"
                  >
                    <RotateCcw className="w-4 h-4 mr-1.5 text-gray-700 dark:text-gray-300" strokeWidth={2.5} />
                    Retake Quiz
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
