import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ThemeToggle from '../shared/ThemeToggle';
import { APP, ROUTES } from '../../constants/app';

const AppNav: React.FC = () => {
  return (
    <motion.nav
      className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200/80 dark:border-gray-700/80 shadow-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      role="navigation"
      aria-label="Main"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          to={ROUTES.home}
          className="flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 transition-opacity hover:opacity-90"
          aria-label={`${APP.name} — Home`}
        >
          <img src="/varkly-icon.svg" alt="" className="h-8 w-8" aria-hidden />
          <span className="text-lg font-semibold text-gray-800 dark:text-gray-100 tracking-tight">
            {APP.name}
          </span>
        </Link>
        <ThemeToggle />
      </div>
    </motion.nav>
  );
};

export default AppNav;
