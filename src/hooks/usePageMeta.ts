import { useEffect } from 'react';
import { APP } from '../constants/app';

/**
 * Sets document title and meta description for the current page.
 * Call once per route in the main page component.
 */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${APP.name}` : `${APP.name} — ${APP.tagline}`;
    document.title = fullTitle;

    const meta = document.querySelector('meta[name="description"]');
    if (meta && description) {
      meta.setAttribute('content', description);
    }

    return () => {
      document.title = `${APP.name} — ${APP.tagline}`;
      if (meta) {
        meta.setAttribute('content', APP.description);
      }
    };
  }, [title, description]);
}
