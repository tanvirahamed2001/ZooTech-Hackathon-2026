import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Mail, RotateCcw, ArrowLeft } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import ThemeToggle from '../shared/ThemeToggle';

type UnsubscribeStatus = 'loading' | 'found' | 'unsubscribed' | 'resubscribed' | 'error' | 'not-found';

interface UnsubscribeData {
  reason: string;
  customReason?: string;
  unsubscribed: boolean;
}

const UnsubscribePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<UnsubscribeStatus>('loading');
  const [data, setData] = useState<UnsubscribeData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!id) {
      setStatus('not-found');
      return;
    }

    const fetchUnsubscribeInfo = async () => {
      try {
        const { data: record, error } = await supabase
          .from('quiz_responses')
          .select('reason, custom_reason, unsubscribed')
          .eq('id', id)
          .single();

        if (error || !record) {
          setStatus('not-found');
          return;
        }

        setData({
          reason: record.reason || '',
          customReason: record.custom_reason || undefined,
          unsubscribed: record.unsubscribed || false
        });
        
        setStatus(record.unsubscribed ? 'unsubscribed' : 'found');
      } catch (error) {
        console.error('Error fetching unsubscribe info:', error);
        setStatus('error');
      }
    };

    fetchUnsubscribeInfo();
  }, [id]);

  const handleUnsubscribe = async () => {
    if (!id || !data) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('quiz_responses')
        .update({ unsubscribed: true })
        .eq('id', id);

      if (error) throw error;

      setStatus('unsubscribed');
      setData(prev => prev ? { ...prev, unsubscribed: true } : null);
    } catch (error) {
      console.error('Error unsubscribing:', error);
      setStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResubscribe = async () => {
    if (!id || !data) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('quiz_responses')
        .update({ unsubscribed: false })
        .eq('id', id);

      if (error) throw error;

      setStatus('resubscribed');
      setData(prev => prev ? { ...prev, unsubscribed: false } : null);
    } catch (error) {
      console.error('Error resubscribing:', error);
      setStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const getReasonJoke = (reason: string, customReason?: string) => {
    const jokes: Record<string, string> = {
      'Self-awareness / Personal development': "Ah, the self-improvement journey! Sometimes the inbox gets as cluttered as our minds, right?",
      "I'm onboarding as a Varkly client": "Hey, even Varkly clients need inbox zen sometimes. No judgment here!",
      "I'm exploring coaching tools": "Exploring tools is great, but maybe your inbox exploration quota is full? Fair enough!",
      "I'm curious how I learn": "Curiosity satisfied? Sometimes the best learning is knowing when to say 'enough emails for now.'",
      "Someone made me do this 😅": "Plot twist: now someone's making you unsubscribe? Or did you finally rebel against the email overlords?",
      "Other (I'll explain...)": customReason ? 
        `You mentioned: "${customReason}" - and now you're saying goodbye to our emails. Character development!` :
        "You had your reasons then, and you have your reasons now. We respect the journey!"
    };
    
    return jokes[reason] || "Every inbox has its limits, and that's totally okay!";
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <motion.div 
            className="card text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-[#0071e3] border-t-transparent rounded-full animate-spin mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2 tracking-[-0.025em]">Loading your preferences...</h3>
              <p className="text-gray-600">Just a moment while we find your subscription details</p>
            </div>
          </motion.div>
        );

      case 'not-found':
        return (
          <motion.div 
            className="card text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AlertCircle className="w-16 h-16 text-[#ff9f0a] mx-auto mb-4" strokeWidth={2} />
            <h3 className="text-2xl font-bold text-gray-800 mb-4 tracking-[-0.025em]">Hmm, that link seems a bit lost</h3>
            <p className="text-gray-600 mb-6">
              This unsubscribe link might be expired, invalid, or already used. 
              It's like trying to use a coupon from 1987 - technically impressive that you still have it, but...
            </p>
            <button
              onClick={() => navigate('/')}
              className="btn-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2 text-white" strokeWidth={2.5} />
              Back to Quiz
            </button>
          </motion.div>
        );

      case 'error':
        return (
          <motion.div 
            className="card text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AlertCircle className="w-16 h-16 text-[#ff3b30] mx-auto mb-4" strokeWidth={2} />
            <h3 className="text-2xl font-bold text-gray-800 mb-4 tracking-[-0.025em]">Oops! Something went sideways</h3>
            <p className="text-gray-600 mb-6">
              Our servers are having a moment. It's like when your brain freezes trying to remember 
              where you put your keys - technically everything should work, but... 🤷‍♂️
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              <RotateCcw className="w-4 h-4 mr-2 text-white" strokeWidth={2.5} />
              Try Again
            </button>
          </motion.div>
        );

      case 'found':
        return (
          <motion.div 
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-6">
              <Mail className="w-16 h-16 text-[#0071e3] mx-auto mb-4" strokeWidth={2} />
              <h3 className="text-2xl font-bold text-gray-800 mb-2 tracking-[-0.025em]">
                Ready to unsubscribe from Varkly emails?
              </h3>
              <p className="text-gray-600">
                We'll miss you, but we totally get it. Inbox overwhelm is real!
              </p>
            </div>

            {data?.reason && (
              <div className="bg-violet-50 p-4 rounded-xl mb-6 border border-violet-100">
                <p className="text-violet-900 text-sm">
                  {getReasonJoke(data.reason, data.customReason)}
                </p>
              </div>
            )}

            <div className="bg-amber-50 p-5 rounded-xl mb-6 border border-amber-100">
              <p className="text-amber-900 font-medium italic">
                "Breaking up with emails is like breaking up with that friend who talks too much - 
                sometimes you need the space, but you might miss the occasional good story."
              </p>
              <p className="text-right text-amber-700 text-sm mt-2">— RayRayRay</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/')}
                className="btn-secondary"
              >
                <ArrowLeft className="w-4 h-4 mr-2 text-gray-700" strokeWidth={2.5} />
                Never mind, keep me subscribed
              </button>
              <button
                onClick={handleUnsubscribe}
                disabled={isProcessing}
                className="btn-primary bg-red-500 hover:bg-red-600"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Mail className="w-4 h-4 mr-2 text-white" strokeWidth={2.5} />
                )}
                Yes, unsubscribe me
              </button>
            </div>
          </motion.div>
        );

      case 'unsubscribed':
        return (
          <motion.div 
            className="card text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <CheckCircle className="w-16 h-16 text-[#34c759] mx-auto mb-4" strokeWidth={2} />
            <h3 className="text-2xl font-bold text-gray-800 mb-4 tracking-[-0.025em]">
              You're officially unsubscribed! 👋
            </h3>
            <p className="text-gray-600 mb-6">
              No more emails from us. Your inbox just got a little quieter, 
              and honestly, that's probably a good thing in today's world.
            </p>

            <div className="bg-emerald-50 p-5 rounded-xl mb-6 border border-emerald-100">
              <p className="text-emerald-900 font-medium italic">
                "Sometimes the best learning strategy is knowing when to hit pause. 
                You can always come back when you're ready for more brain optimization!"
              </p>
              <p className="text-right text-violet-600 text-sm mt-2">— RayRayRay</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleResubscribe}
                disabled={isProcessing}
                className="btn-secondary"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Mail className="w-4 h-4 mr-2 text-gray-800" strokeWidth={2.5} />
                )}
                Actually, re-subscribe me
              </button>
              <button
                onClick={() => navigate('/')}
                className="btn-primary"
              >
                <ArrowLeft className="w-4 h-4 mr-2 text-white" strokeWidth={2.5} />
                Back to Quiz
              </button>
            </div>
          </motion.div>
        );

      case 'resubscribed':
        return (
          <motion.div 
            className="card text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <CheckCircle className="w-16 h-16 text-[#0071e3] mx-auto mb-4" strokeWidth={2} />
            <h3 className="text-2xl font-bold text-gray-800 mb-4 tracking-[-0.025em]">
              Welcome back! 🎉
            </h3>
            <p className="text-gray-600 mb-6">
              You're back on our email list! Sometimes you need a break to realize 
              what you're missing. We're glad you decided to rejoin the learning journey.
            </p>

            <div className="bg-violet-50 p-5 rounded-xl mb-6 border border-violet-100">
              <p className="text-violet-900 font-medium italic">
                "Like a boomerang, but for email subscriptions! 
                Welcome back to the brain optimization party!"
              </p>
              <p className="text-right text-violet-600 text-sm mt-2">— RayRayRay</p>
            </div>

            <button
              onClick={() => navigate('/')}
              className="btn-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2 text-white" strokeWidth={2.5} />
              Back to Quiz
            </button>
          </motion.div>
        );

      default:
        return null;
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

      <div className="max-w-2xl mx-auto py-8 px-4">
        {renderContent()}
      </div>
    </div>
  );
};

export default UnsubscribePage;