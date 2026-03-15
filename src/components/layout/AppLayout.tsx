import React from 'react';
import AppNav from './AppNav';
import AppFooter from './AppFooter';

type AppLayoutProps = {
  children: React.ReactNode;
  /** Hide footer on quiz/results for cleaner flow; show on landing and 404 */
  showFooter?: boolean;
};

const AppLayout: React.FC<AppLayoutProps> = ({ children, showFooter = true }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-violet-600 focus:text-white focus:rounded-lg focus:outline-none"
      >
        Skip to content
      </a>
      <AppNav />
      <main id="main" className="flex-1">
        {children}
      </main>
      {showFooter && <AppFooter />}
    </div>
  );
};

export default AppLayout;
