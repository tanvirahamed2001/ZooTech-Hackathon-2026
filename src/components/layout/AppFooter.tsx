import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { APP, ROUTES } from '../../constants/app';

const AppFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="border-t border-gray-200/80 dark:border-gray-700/80 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm"
      role="contentinfo"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-2">
            <img src="/varkly-icon.svg" alt="" className="h-5 w-5 opacity-80" aria-hidden />
            <span className="font-medium text-gray-700 dark:text-gray-300">{APP.name}</span>
            <span aria-hidden>·</span>
            <span>{APP.tagline}</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              to={ROUTES.home}
              className="transition-colors hover:text-violet-600 dark:hover:text-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 rounded"
            >
              Home
            </Link>
            <span className="text-gray-400 dark:text-gray-500">© {currentYear}</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default AppFooter;
