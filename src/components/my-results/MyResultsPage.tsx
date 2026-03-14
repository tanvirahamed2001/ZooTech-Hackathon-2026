import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, ExternalLink, ArrowLeft, Sparkles } from 'lucide-react';
import { getMyResults, type MyResultRow } from '../../utils/supabase';
import ThemeToggle from '../shared/ThemeToggle';

const MyResultsPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<MyResultRow[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResults([]);
    setSearched(false);
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const data = await getMyResults(email.trim());
      setResults(data);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load results. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { dateStyle: 'medium' });
  };

  const getDominant = (scores: { V: number; A: number; R: number; K: number }) => {
    const max = Math.max(scores.V, scores.A, scores.R, scores.K);
    const labels: Record<string, string> = { V: 'Visual', A: 'Auditory', R: 'Read/Write', K: 'Kinesthetic' };
    return (Object.entries(scores).filter(([, v]) => v === max).map(([k]) => labels[k]) as string[]).join(' + ') || '—';
  };

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-violet-100 dark:border-gray-700 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/varkly-icon.svg" alt="Varkly" className="h-7 w-7" />
            <span className="text-base font-semibold text-gray-800 dark:text-gray-100">Varkly</span>
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-4 py-12">
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-violet-500" strokeWidth={2} />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">My Results</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Enter the email you used when taking the quiz to see your past VARK results and result links.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <div className="flex gap-2">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  placeholder="you@example.com"
                  className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
                <button type="submit" disabled={loading} className="btn-primary shrink-0">
                  {loading ? (
                    <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4" strokeWidth={2} />
                      Look up
                    </>
                  )}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>

          {searched && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              {results.length === 0 ? (
                <p className="text-gray-600">No results found for this email. Take the quiz to get your first result!</p>
              ) : (
                <ul className="space-y-3">
                  {results.map((row) => (
                    <li
                      key={row.id}
                      className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-violet-200 transition-colors"
                    >
                      <div>
                        <span className="text-sm text-gray-500">{formatDate(row.created_at)}</span>
                        <span className="ml-2 text-sm font-medium text-violet-700">{getDominant(row.scores)}</span>
                      </div>
                      <a
                        href={row.results_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-violet-600 hover:text-violet-700"
                      >
                        View result
                        <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <Link
            to="/"
            className="inline-flex items-center gap-2 mt-6 text-gray-600 hover:text-violet-600 font-medium"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            Back to home
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default MyResultsPage;
