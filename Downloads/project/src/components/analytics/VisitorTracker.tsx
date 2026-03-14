import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackVisitor, trackPageView } from '../../utils/analytics';

const VisitorTracker: React.FC = () => {
  const location = useLocation();

  // Track initial visitor on component mount
  useEffect(() => {
    // Small delay to ensure page is fully loaded
    const timer = setTimeout(async () => {
      await trackVisitor();
      
      // Trigger server-side enrichment after tracking (production only)
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        // Only attempt enrichment if environment variables are available and not in dev mode
        if (supabaseUrl && 
            supabaseAnonKey && 
            import.meta.env.MODE !== 'development' &&
            !window.location.hostname.includes('localhost') &&
            !window.location.hostname.includes('webcontainer')) {
          
          const enrichmentUrl = `${supabaseUrl}/functions/v1/enrich-analytics`;
          
          await fetch(enrichmentUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/json',
            },
          });
        } else {
          console.log('🚫 Analytics enrichment: Skipped in development environment');
        }
      } catch (error) {
        console.warn('Analytics enrichment failed (non-critical):', error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Track page views on route changes
  useEffect(() => {
    // Don't track the initial page load (already handled above)
    const hasTrackedInitial = sessionStorage.getItem('visitor_tracked');
    if (hasTrackedInitial) {
      trackPageView(location.pathname);
    }
  }, [location.pathname]);

  // This component renders nothing - it's purely for tracking
  return null;
};

export default VisitorTracker;