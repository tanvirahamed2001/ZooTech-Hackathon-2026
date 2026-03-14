import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuiz } from '../../contexts/QuizContext';
import { Mail, ArrowRight, X, CheckCircle, AlertCircle } from 'lucide-react';
import { saveEmailCapture } from '../../utils/supabase';
import ThemeToggle from '../shared/ThemeToggle';

declare global {
  interface Window {
    grecaptcha: any;
  }
}

const LandingPage: React.FC = () => {
  const { startQuiz, setEmailCapture } = useQuiz();
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string>('');
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [hpField, setHpField] = useState(''); // Honeypot field state

  const reasons = [
    'Self-awareness / Personal development',
    "I'm onboarding as a Varkly client",
    "I'm exploring coaching tools", 
    "I'm curious how I learn",
    "Someone made me do this 😅",
    "Other (I'll explain...)"
  ];

  // Playful loading messages that rotate
  const loadingMessages = [
    "Sharpening pencils and calibrating brain lasers...",
    "Teaching hamsters to run the database wheels...",
    "Convincing electrons to behave properly...",
    "Bribing the servers with digital cookies...",
    "Untangling the internet cables...",
    "Asking the database nicely to cooperate..."
  ];

  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (saveStatus === 'saving') {
      // Rotate through loading messages every 2 seconds
      interval = setInterval(() => {
        setCurrentLoadingMessage(prev => {
          const currentIndex = loadingMessages.indexOf(prev);
          const nextIndex = (currentIndex + 1) % loadingMessages.length;
          return loadingMessages[nextIndex];
        });
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [saveStatus]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !showEmailCapture) {
        startQuiz();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [startQuiz, showEmailCapture]);

  // Load reCAPTCHA script
  useEffect(() => {
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (!siteKey) return;

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.onload = () => {
      window.grecaptcha.ready(() => {
        setRecaptchaLoaded(true);
      });
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !reason) return;

    setIsSubmitting(true);
    setSaveStatus('saving');
    setSaveError('');
    
    const emailCaptureData = {
      firstName: firstName.trim() || undefined,
      email: email.trim(),
      reason,
      customReason: reason === "Other (I'll explain...)" ? customReason.trim() : undefined,
      hpField: hpField // Include honeypot field value
    };

    try {
      console.log('Saving email capture immediately:', emailCaptureData);
      
      // Get reCAPTCHA token if available
      let recaptchaToken = '';
      const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
      if (recaptchaLoaded && siteKey && window.grecaptcha) {
        try {
          recaptchaToken = await window.grecaptcha.execute(siteKey, { action: 'email_capture' });
        } catch (error) {
          console.warn('reCAPTCHA execution failed:', error);
        }
      }

      // Save to database immediately with security tokens
      const savedRecord = await saveEmailCapture(emailCaptureData, recaptchaToken, hpField);
      console.log('Email capture saved with record ID:', savedRecord.id);
      
      // Store in context with the database record ID
      const emailCaptureWithId = {
        ...emailCaptureData,
        recordId: savedRecord.id
      };
      setEmailCapture(emailCaptureWithId);
      
      setSaveStatus('saved');
      setIsSubmitting(false);
      setShowEmailCapture(false);
      startQuiz();
      
    } catch (error) {
      console.error('Failed to save email capture:', error);
      setSaveStatus('error');
      setSaveError(error instanceof Error ? error.message : 'Unknown error occurred');
      setIsSubmitting(false);
      
      // Still allow them to proceed to quiz even if save failed
      setTimeout(() => {
        setEmailCapture(emailCaptureData);
        setShowEmailCapture(false);
        startQuiz();
      }, 2000);
    }
  };

  const isEmailFormValid = email.includes('@') && reason && 
    (reason !== "Other (I'll explain...)" || customReason.trim().length > 0);

  return (
    <div className="min-h-screen">
      <motion.nav 
        className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-violet-100 dark:border-gray-700 shadow-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/varkly-icon.svg" alt="Varkly" className="h-8 w-8 mr-1.5" />
            <span className="text-lg font-semibold text-gray-800 dark:text-gray-100 tracking-tight">Varkly</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/my-results"
              className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
            >
              My results
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </motion.nav>

      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <motion.header 
          className="text-center mb-14 md:mb-20"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent dark:from-violet-400 dark:via-indigo-400 dark:to-emerald-400 tracking-tight leading-tight mb-3">
            The best way to understand how you learn.
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg md:text-xl max-w-xl mx-auto">
            Take the VARK quiz. Get your results in minutes.
          </p>
        </motion.header>

        <motion.div 
          className="card mb-12 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Why Is Your Brain Ignoring Half Of What You Learn?
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Everyone's brain has a preferred way of processing information - and when you learn 
            in a way that doesn't match your style, it's like trying to watch Netflix with 
            dial-up internet. Painful and inefficient.
          </p>

          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 p-5 rounded-xl mb-8 border border-violet-100">
            <p className="text-violet-900 font-medium italic">
              "Find out why your teachers made learning feel like trying to eat soup with a fork. 
              Turns out, it might not have been your fault after all."
            </p>
          </div>

          <motion.div 
            className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-2xl mb-10 border border-blue-100"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-start">
              <Mail className="w-6 h-6 text-blue-500 mt-1 mr-3 flex-shrink-0" strokeWidth={2.5} />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Want your detailed learning style report + personalized coaching tips?
                </h3>
                <p className="text-gray-600 mb-4">
                  We show your results immediately — the email is just for bonus content & coaching extras. Totally optional.
                </p>
                <button
                  onClick={() => setShowEmailCapture(true)}
                  className="btn-primary text-sm"
                >
                  Yes, send me my detailed report!
                </button>
                <p className="text-gray-500 text-xs mt-2">
                  (Completely optional – you can take the quiz and get your results without this)
                </p>
              </div>
            </div>
          </motion.div>
          
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Take the VARK Learning Style Quiz
          </h3>
          
          <p className="text-gray-600 mb-6">
            This quiz helps you discover if you're a:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <div className="p-5 bg-violet-50 rounded-xl border border-violet-100">
              <h4 className="font-semibold text-violet-800">Visual Learner</h4>
              <p className="text-violet-700/90 text-sm mt-1">You process information best through charts, diagrams, and seeing things demonstrated</p>
            </div>
            <div className="p-5 bg-blue-50 rounded-xl border border-blue-100">
              <h4 className="font-semibold text-blue-800">Auditory Learner</h4>
              <p className="text-blue-700/90 text-sm mt-1">You learn best through listening, discussions, and verbal instructions</p>
            </div>
            <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-100">
              <h4 className="font-semibold text-emerald-800">Read/Write Learner</h4>
              <p className="text-emerald-700/90 text-sm mt-1">You prefer information displayed as words, lists, and written materials</p>
            </div>
            <div className="p-5 bg-amber-50 rounded-xl border border-amber-100">
              <h4 className="font-semibold text-amber-800">Kinesthetic Learner</h4>
              <p className="text-amber-700/90 text-sm mt-1">You learn through doing, experiencing, and hands-on activities</p>
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
          className="text-center text-gray-500 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p>13 questions • Takes about 3 minutes • No login required</p>
          <p className="mt-1">Results available immediately</p>
        </motion.div>
      </div>

      {/* Email Capture Modal */}
      {showEmailCapture && (
        <motion.div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-semibold text-gray-800">Get Your Detailed Report</h3>
              <button
                onClick={() => setShowEmailCapture(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5 text-[#f5f5f7]" strokeWidth={2.5} />
              </button>
            </div>

            {/* Status Messages */}
            {saveStatus === 'saving' && (
              <motion.div 
                className="bg-blue-50 p-3 rounded-xl mb-4 border border-blue-100"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mr-2" />
                  <p className="text-blue-800 text-sm font-medium">{currentLoadingMessage}</p>
                </div>
              </motion.div>
            )}

            {saveStatus === 'saved' && (
              <div className="bg-emerald-50 p-3 rounded-xl mb-4 border border-emerald-100">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" strokeWidth={2.5} />
                  <p className="text-emerald-800 text-sm font-medium">Perfect! Starting quiz...</p>
                </div>
              </div>
            )}

            {saveStatus === 'error' && (
              <div className="bg-red-50 p-3 rounded-xl mb-4 border border-red-100">
                <div className="flex items-start">
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                  <div>
                    <p className="text-red-800 text-sm font-medium">Couldn't save right now</p>
                    <p className="text-red-600 text-xs">{saveError}</p>
                    <p className="text-red-600 text-xs">Don't worry - proceeding to quiz anyway!</p>
                  </div>
                </div>
              </div>
            )}

            {saveStatus === 'idle' && (
              <div className="bg-violet-50 p-3 rounded-xl mb-4 border border-violet-100">
                <p className="text-violet-800 text-sm">
                  📧 <strong>We show your results immediately</strong> — the email is just for bonus content & coaching extras. Totally optional.
                </p>
              </div>
            )}

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <input 
                name="hp_field" 
                value={hpField}
                onChange={(e) => setHpField(e.target.value)}
                style={{ display: 'none' }} 
                tabIndex={-1} 
                autoComplete="off" 
              />
              
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name (optional)
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors disabled:opacity-50"
                  placeholder="What should we call you?"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors disabled:opacity-50"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                  Why are you taking this? *
                </label>
                <select
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors disabled:opacity-50"
                >
                  <option value="">Select a reason...</option>
                  {reasons.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {reason === "Other (I'll explain...)" && (
                <div>
                  <label htmlFor="customReason" className="block text-sm font-medium text-gray-700 mb-1">
                    Want to add anything? (Totally optional)
                  </label>
                  <input
                    id="customReason"
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    maxLength={127}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors disabled:opacity-50"
                    placeholder='e.g., "Helping my teen figure out how to study" or "Trying to stop procrastinating again lol"'
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {customReason.length}/127 characters
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmailCapture(false)}
                  disabled={isSubmitting}
                  className="btn-secondary flex-1 disabled:opacity-50"
                >
                  Skip for now
                </button>
                <button
                  type="submit"
                  disabled={!isEmailFormValid || isSubmitting}
                  className={`${
                    isEmailFormValid && !isSubmitting ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'
                  } flex-1 flex items-center justify-center`}
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Continue to Quiz
                      <ArrowRight className="w-4 h-4 ml-1 text-white" strokeWidth={2.5} />
                    </>
                  )}
                </button>
              </div>
            </form>

            <p className="text-xs text-gray-500 mt-4 text-center">
              We'll send you a detailed PDF report with personalized learning strategies. No spam, promise!
            </p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default LandingPage;