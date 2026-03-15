import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2 rounded-xl text-gray-500 hover:text-violet-600 hover:bg-violet-100 dark:text-gray-400 dark:hover:text-violet-400 dark:hover:bg-violet-900/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5" strokeWidth={2} />
      ) : (
        <Moon className="w-5 h-5" strokeWidth={2} />
      )}
    </button>
  );
};

export default ThemeToggle;
