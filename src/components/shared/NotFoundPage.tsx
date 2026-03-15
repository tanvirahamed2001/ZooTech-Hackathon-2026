import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { usePageMeta } from '../../hooks/usePageMeta';
import { APP, ROUTES } from '../../constants/app';

const NotFoundPage: React.FC = () => {
  usePageMeta('Page not found', `The page you're looking for doesn't exist. — ${APP.name}`);

  return (
    <div className="flex items-center justify-center p-4 min-h-[calc(100vh-3.5rem)]">
      <motion.div
        className="card max-w-md w-full text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-6xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent mb-4">
          404
        </h1>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
          Page not found
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to={ROUTES.home}>
          <motion.button
            className="btn-primary inline-flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            aria-label="Back to home"
          >
            <Home className="w-4 h-4" strokeWidth={2.5} />
            Back to Home
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
