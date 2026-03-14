import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuiz } from '../../contexts/QuizContext';
import { Share2, RotateCcw, Copy, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import ResultsChart from './ResultsChart';
import ResultsExplanation from './ResultsExplanation';
import { updateQuizResponse, saveQuizResponse, sendVarkReport } from '../../utils/supabase';
import type { VarkScores } from '../../types';
import ThemeToggle from '../shared/ThemeToggle';

const ResultsPage: React.FC = () => {
  const { calculateScores, resetQuiz, quizState } = useQuiz();
  const [scores, setScores] = useState<VarkScores>(() => calculateScores());
  const [resultsUrl, setResultsUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [emailError, setEmailError] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const { hash } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const initializeScores = async () => {
      console.log('Initializing results page with quiz state:', quizState);
      
      if (hash) {
        try {
          const decodedScores = atob(hash);
          const [V, A, R, K] = decodedScores.split('-').map(Number);
          
          if (
            !isNaN(V) && !isNaN(A) && !isNaN(R) && !isNaN(K) &&
            [V, A, R, K].every(score => score >= 0 && score <= 13)
          ) {
            setScores({ V, A, R, K });
          } else {
            console.error('Invalid scores in URL');
            navigate('/');
          }
        } catch (error) {
          console.error('Error decoding scores:', error);
          navigate('/');
        }
      }

      // Generate URL for sharing
      const scoresString = `${scores.V}-${scores.A}-${scores.R}-${scores.K}`;
      const newHash = btoa(scoresString).replace(/=/g, '');
      const url = `${window.location.origin}/r/${newHash}`;
      setResultsUrl(url);

      // Handle database updates and email sending if this is a fresh quiz completion
      if (!hash && quizState.isCompleted) {
        console.log('Fresh quiz completion detected');
        console.log('Email capture data:', quizState.emailCapture);
        
        try {
          setSaveStatus('saving');
          
          if (quizState.emailCapture?.email && quizState.emailCapture?.recordId) {
            // User provided email earlier - UPDATE their existing record using the record ID
            console.log('User provided email earlier, updating existing record with ID:', quizState.emailCapture.recordId);
            
            const updatedResponse = await updateQuizResponse(
              quizState.emailCapture.recordId,
              scores,
              quizState.answers,
              url
            );
            
            console.log('Quiz response updated successfully:', updatedResponse);
            setSaveStatus('saved');
            
            // Send email report
            console.log('Sending email report...');
            setEmailStatus('sending');
            
            const maxScore = Math.max(scores.V, scores.A, scores.R, scores.K);
            const dominantStyles = Object.entries(scores)
              .filter(([_, value]) => value === maxScore)
              .map(([key]) => key);

            try {
              const emailResult = await sendVarkReport(
                quizState.emailCapture,
                scores,
                dominantStyles,
                url
              );
              
              console.log('Email sent successfully:', emailResult);
              setEmailStatus('sent');
            } catch (emailError) {
              console.error('Email sending failed:', emailError);
              setEmailStatus('error');
              setEmailError(emailError instanceof Error ? emailError.message : 'Unknown email error');
            }
          } else {
            // User didn't provide email - create new record (still track IP!)
            console.log('No email provided, creating new record with IP tracking...');
            
            const savedResponse = await saveQuizResponse(
              null,
              scores,
              quizState.answers,
              url
            );

            console.log('Quiz response saved successfully with IP tracking:', savedResponse);
            setSaveStatus('saved');
          }
        } catch (error) {
          console.error('Error handling quiz completion:', error);
          setSaveStatus('error');
          if (quizState.emailCapture?.email) {
            setEmailStatus('error');
            setEmailError(error instanceof Error ? error.message : 'Unknown error occurred');
          }
        }
      }

      setIsLoading(false);
    };

    // Short timeout to show loading animation
    const timer = setTimeout(initializeScores, 500);
    return () => clearTimeout(timer);
  }, [hash, scores, navigate, quizState]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(resultsUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Could not copy text: ', err);
      alert('Could not copy to clipboard. Please copy the URL manually.');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Varkly Learning Style Results',
          text: 'Check out my learning style profile!',
          url: resultsUrl,
        });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.log('Share failed, falling back to clipboard:', err);
          await copyToClipboard();
        }
      }
    } else {
      await copyToClipboard();
    }
  };

  const maxScore = Math.max(scores.V, scores.A, scores.R, scores.K);
  const dominantStyles = Object.entries(scores)
    .filter(([_, value]) => value === maxScore)
    .map(([key]) => key);

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
      return `You have a multimodal learning style with strengths in ${dominantStyles.map(getFullStyleName).join(' and ')}!`;
    }
  };

  const getFullStyleName = (code: string): string => {
    switch (code) {
      case 'V': return 'Visual';
      case 'A': return 'Auditory';
      case 'R': return 'Read/Write';
      case 'K': return 'Kinesthetic';
      default: return code;
    }
  };

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

      <div className="max-w-4xl mx-auto py-8 px-4">
      <motion.header 
        className="text-center mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">Your Results</h1>
        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">VARK Learning Style</p>
      </motion.header>

      <div>
        {isLoading ? (
          <motion.div 
            className="card text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Analyzing Your Results...</h3>
              <p className="text-gray-600 dark:text-gray-300">We're calculating your learning style preferences</p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {saveStatus === 'saving' && (
              <motion.div 
                className="card bg-violet-50 border border-violet-100"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start">
                  <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mr-3 mt-1" />
                  <div>
                    <p className="font-medium text-gray-800">Finalizing your results...</p>
                    <p className="text-gray-600 text-sm">Just a moment while we prepare everything</p>
                  </div>
                </div>
              </motion.div>
            )}

            {saveStatus === 'saved' && (
              <motion.div 
                className="card bg-emerald-50 border border-emerald-100"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-1" strokeWidth={2.5} />
                  <div>
                    <p className="font-medium text-gray-800">Results ready!</p>
                    <p className="text-gray-600 text-sm">Your learning style analysis is complete</p>
                  </div>
                </div>
              </motion.div>
            )}

            {quizState.emailCapture?.email && (
              <motion.div 
                className="card bg-blue-50 border border-blue-100"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start">
                  {emailStatus === 'sending' && (
                    <>
                      <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mr-3 mt-1" />
                      <div>
                        <p className="font-medium text-gray-800">Preparing your detailed report...</p>
                        <p className="text-gray-600 text-sm">We're sending your personalized learning strategies to {quizState.emailCapture.email}</p>
                      </div>
                    </>
                  )}
                  {emailStatus === 'sent' && (
                    <>
                      <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-1" strokeWidth={2.5} />
                      <div>
                        <p className="font-medium text-gray-800">Report sent successfully!</p>
                        <p className="text-gray-600 text-sm">Check your inbox at {quizState.emailCapture.email} for your detailed learning strategies</p>
                      </div>
                    </>
                  )}
                  {emailStatus === 'error' && (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-1" strokeWidth={2.5} />
                      <div>
                        <p className="font-medium text-gray-800">Couldn't send email right now</p>
                        <p className="text-gray-600 text-sm">
                          {emailError.includes('SMTP credentials') 
                            ? 'Email service is being configured. Your results are saved and you can always share this page!'
                            : `Error: ${emailError}. Don't worry - your results are saved and you can always share this page!`
                          }
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            <div className="card">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-3">{getCongratulationMessage()}</h3>
                <p className="text-gray-600">Here's how your brain prefers to process information</p>
              </div>
              
              <ResultsChart scores={scores} />
              
              <div className="border-t border-gray-200 mt-8 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-gray-800">Share Your Results</h4>
                  <div className="flex gap-2">
                    <button 
                      onClick={copyToClipboard}
                      className="flex items-center gap-2 text-violet-600 font-semibold hover:text-white hover:bg-violet-500 transition-all duration-200 px-4 py-2.5 rounded-2xl border-2 border-violet-200 hover:border-violet-500 active:scale-[0.98]"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" strokeWidth={2.5} />
                      <span className="text-sm">{copySuccess ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <button 
                      onClick={handleShare}
                      className="flex items-center gap-2 text-violet-600 font-semibold hover:text-white hover:bg-violet-500 transition-all duration-200 px-4 py-2.5 rounded-2xl border-2 border-violet-200 hover:border-violet-500 active:scale-[0.98]"
                      title="Share results"
                    >
                      <Share2 className="w-4 h-4" strokeWidth={2.5} />
                      <span className="text-sm">Share</span>
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-xl overflow-x-auto whitespace-nowrap text-gray-600 text-sm border border-gray-100">
                  {resultsUrl}
                </div>
              </div>
            </div>

            <ResultsExplanation dominantStyles={dominantStyles} />
            
            <div className="card text-center">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Want to try again?</h3>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <motion.button
                  onClick={resetQuiz}
                  className="btn-secondary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RotateCcw className="w-4 h-4 mr-1.5 text-gray-700" strokeWidth={2.5} />
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