import { supabase } from './supabase';
import UAParser from 'ua-parser-js';

// Generate a unique session ID for this browser session
const generateSessionId = (): string => {
  // Check if we already have a session ID in sessionStorage
  let sessionId = sessionStorage.getItem('visitor_session_id');
  
  if (!sessionId) {
    // Generate a new session ID
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('visitor_session_id', sessionId);
  }
  
  return sessionId;
};

// Check if we should skip analytics tracking
const shouldSkipTracking = (): boolean => {
  // Skip in development mode
  if (import.meta.env.MODE === 'development') {
    console.log('🚫 Analytics: Skipping tracking in development mode');
    return true;
  }

  // Skip for development/test domains
  const hostname = window.location.hostname;
  const devDomains = [
    'localhost',
    '127.0.0.1',
    'webcontainer',
    'webcontainer-api.io',
    'stackblitz.io',
    'bolt.new'
  ];

  if (devDomains.some(domain => hostname.includes(domain))) {
    console.log('🚫 Analytics: Skipping tracking for dev domain:', hostname);
    return true;
  }

  // Skip if user agent indicates automation/bot
  const userAgent = navigator.userAgent.toLowerCase();
  const botPatterns = [
    'bot',
    'crawler',
    'spider',
    'headless',
    'phantom',
    'selenium',
    'webdriver',
    'puppeteer',
    'playwright'
  ];

  if (botPatterns.some(pattern => userAgent.includes(pattern))) {
    console.log('🚫 Analytics: Skipping tracking for bot/automation:', userAgent);
    return true;
  }

  return false;
};

// Parse user agent to extract browser and OS info using ua-parser-js
const parseUserAgent = (userAgent: string) => {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  
  return {
    browserName: result.browser.name || null,
    browserVersion: result.browser.version || null,
    osName: result.os.name || null,
    osVersion: result.os.version || null,
    platform: result.os.name || null,
    deviceType: result.device.type || (
      result.os.name?.toLowerCase().includes('mobile') ? 'mobile' : 
      result.os.name?.toLowerCase().includes('tablet') ? 'tablet' : 'desktop'
    )
  };
};

// Parse referrer URL to extract domain and path
const parseReferrer = (referrer: string) => {
  if (!referrer || referrer === 'null' || referrer.trim() === '') {
    return { referrer_domain: null, referrer_path: null };
  }
  
  try {
    const url = new URL(referrer);
    return {
      referrer_domain: url.hostname,
      referrer_path: url.pathname
    };
  } catch (error) {
    console.warn('Could not parse referrer:', referrer);
    return { referrer_domain: null, referrer_path: null };
  }
};

// Extract UTM parameters from URL
const extractUTMParameters = (url: string) => {
  const urlObj = new URL(url);
  const params = urlObj.searchParams;
  
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_term: params.get('utm_term'),
    utm_content: params.get('utm_content')
  };
};

// Validate and clean data before sending
const validateAnalyticsData = (data: any) => {
  // Ensure required fields are present and valid
  if (!data.session_id || !data.page_path) {
    console.warn('Analytics: Missing required fields, skipping');
    return null;
  }

  // Clean up null/undefined values
  const cleanedData = { ...data };
  
  // Convert empty strings to null for consistency
  Object.keys(cleanedData).forEach(key => {
    if (cleanedData[key] === '' || cleanedData[key] === 'null' || cleanedData[key] === 'undefined') {
      cleanedData[key] = null;
    }
  });

  // Validate numeric fields
  if (cleanedData.screen_width && (isNaN(cleanedData.screen_width) || cleanedData.screen_width <= 0)) {
    cleanedData.screen_width = null;
  }
  if (cleanedData.screen_height && (isNaN(cleanedData.screen_height) || cleanedData.screen_height <= 0)) {
    cleanedData.screen_height = null;
  }
  if (cleanedData.viewport_width && (isNaN(cleanedData.viewport_width) || cleanedData.viewport_width <= 0)) {
    cleanedData.viewport_width = null;
  }
  if (cleanedData.viewport_height && (isNaN(cleanedData.viewport_height) || cleanedData.viewport_height <= 0)) {
    cleanedData.viewport_height = null;
  }
  if (cleanedData.page_load_duration && (isNaN(cleanedData.page_load_duration) || cleanedData.page_load_duration < 0)) {
    cleanedData.page_load_duration = null;
  }

  return cleanedData;
};

// Track time on page
let pageStartTime = Date.now();
let timeOnPageTracked = false;

const trackTimeOnPage = async (sessionId: string, pagePath: string) => {
  if (timeOnPageTracked || shouldSkipTracking()) return;
  
  const timeOnPage = Date.now() - pageStartTime;
  timeOnPageTracked = true;
  
  // Only track reasonable durations (between 1 second and 1 hour)
  if (timeOnPage < 1000 || timeOnPage > 3600000) {
    console.warn('Analytics: Unreasonable time on page, skipping:', timeOnPage);
    return;
  }
  
  try {
    // Update the most recent record for this session and page
    const { error } = await supabase
      .from('visitor_analytics')
      .update({ time_on_page_ms: timeOnPage })
      .eq('session_id', sessionId)
      .eq('page_path', pagePath)
      .order('timestamp', { ascending: false })
      .limit(1);
    
    if (error) {
      console.warn('Could not update time on page:', error);
    } else {
      console.log('📊 Time on page tracked:', timeOnPage, 'ms');
    }
  } catch (error) {
    console.warn('Error tracking time on page:', error);
  }
};

// Set up time tracking for current page
const setupTimeTracking = (sessionId: string, pagePath: string) => {
  pageStartTime = Date.now();
  timeOnPageTracked = false;
  
  // Track time on page when user leaves
  const handleBeforeUnload = () => {
    trackTimeOnPage(sessionId, pagePath);
  };
  
  // Track time on page when user becomes inactive
  const handleVisibilityChange = () => {
    if (document.hidden) {
      trackTimeOnPage(sessionId, pagePath);
    }
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Cleanup function
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};

// Main analytics tracking function with production-only enrichment
export const trackVisitor = async (): Promise<void> => {
  try {
    // Skip tracking if in development or test environment
    if (shouldSkipTracking()) {
      return;
    }

    // Only track once per session to avoid duplicate entries
    const hasTracked = sessionStorage.getItem('visitor_tracked');
    if (hasTracked) {
      console.log('Visitor already tracked in this session');
      return;
    }
    
    const startTime = performance.now();
    
    // Generate session ID
    const sessionId = generateSessionId();
    
    // Get current page info
    const currentUrl = window.location.href;
    const pagePath = window.location.pathname;
    const queryParams = Object.fromEntries(new URLSearchParams(window.location.search));
    const referrer = document.referrer || null;
    
    // Extract UTM parameters
    const utmParams = extractUTMParameters(currentUrl);
    
    // Parse referrer
    const referrerData = parseReferrer(referrer);
    
    // Get browser and device info using ua-parser-js
    const userAgent = navigator.userAgent;
    const { browserName, browserVersion, osName, osVersion, platform, deviceType } = parseUserAgent(userAgent);
    
    // Screen and viewport info (with validation)
    const screenWidth = screen.width > 0 ? screen.width : null;
    const screenHeight = screen.height > 0 ? screen.height : null;
    const viewportWidth = window.innerWidth > 0 ? window.innerWidth : null;
    const viewportHeight = window.innerHeight > 0 ? window.innerHeight : null;
    
    // User preferences
    const language = navigator.language || navigator.languages?.[0] || null;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Calculate page load duration
    const pageLoadDuration = Math.round(performance.now() - startTime);
    
    // Prepare analytics data (without enriched IP data initially)
    const analyticsData = {
      session_id: sessionId,
      user_agent: userAgent,
      page_path: pagePath,
      query_parameters: Object.keys(queryParams).length > 0 ? queryParams : null,
      referrer,
      referrer_domain: referrerData.referrer_domain,
      referrer_path: referrerData.referrer_path,
      utm_source: utmParams.utm_source,
      utm_medium: utmParams.utm_medium,
      utm_campaign: utmParams.utm_campaign,
      utm_term: utmParams.utm_term,
      utm_content: utmParams.utm_content,
      browser_name: browserName,
      browser_version: browserVersion,
      os_name: osName,
      os_version: osVersion,
      platform: platform,
      device_type: deviceType,
      screen_width: screenWidth,
      screen_height: screenHeight,
      viewport_width: viewportWidth,
      viewport_height: viewportHeight,
      language,
      timezone,
      page_load_duration: pageLoadDuration > 0 ? pageLoadDuration : null
    };
    
    // Validate and clean the data
    const cleanedData = validateAnalyticsData(analyticsData);
    if (!cleanedData) {
      console.warn('Analytics: Data validation failed, skipping tracking');
      return;
    }
    
    console.log('Tracking visitor analytics (production only):', {
      sessionId,
      pagePath,
      deviceType,
      platform,
      browserName,
      referrerDomain: referrerData.referrer_domain,
      hostname: window.location.hostname
    });
    
    // Insert into Supabase (enrichment will happen server-side via edge function)
    const { error } = await supabase
      .from('visitor_analytics')
      .insert([cleanedData]);
    
    if (error) {
      console.error('Failed to track visitor:', error);
    } else {
      // Mark as tracked for this session
      sessionStorage.setItem('visitor_tracked', 'true');
      console.log('✅ Visitor analytics tracked successfully');
      
      // Set up time tracking for this page
      setupTimeTracking(sessionId, pagePath);
    }
    
  } catch (error) {
    console.error('Error in visitor tracking:', error);
  }
};

// Track page views for SPA navigation with production-only enrichment
export const trackPageView = async (pagePath: string): Promise<void> => {
  try {
    // Skip tracking if in development or test environment
    if (shouldSkipTracking()) {
      return;
    }

    const sessionId = generateSessionId();
    const currentUrl = window.location.href;
    const queryParams = Object.fromEntries(new URLSearchParams(window.location.search));
    const utmParams = extractUTMParameters(currentUrl);
    const referrer = document.referrer || null;
    const referrerData = parseReferrer(referrer);
    
    // Parse user agent for this page view
    const userAgent = navigator.userAgent;
    const { browserName, browserVersion, osName, osVersion, platform, deviceType } = parseUserAgent(userAgent);
    
    const pageViewData = {
      session_id: sessionId,
      page_path: pagePath,
      query_parameters: Object.keys(queryParams).length > 0 ? queryParams : null,
      referrer,
      referrer_domain: referrerData.referrer_domain,
      referrer_path: referrerData.referrer_path,
      utm_source: utmParams.utm_source,
      utm_medium: utmParams.utm_medium,
      utm_campaign: utmParams.utm_campaign,
      utm_term: utmParams.utm_term,
      utm_content: utmParams.utm_content,
      user_agent: userAgent,
      browser_name: browserName,
      browser_version: browserVersion,
      os_name: osName,
      os_version: osVersion,
      platform: platform,
      device_type: deviceType,
      viewport_width: window.innerWidth > 0 ? window.innerWidth : null,
      viewport_height: window.innerHeight > 0 ? window.innerHeight : null,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    
    // Validate and clean the data
    const cleanedData = validateAnalyticsData(pageViewData);
    if (!cleanedData) {
      console.warn('Analytics: Page view data validation failed, skipping tracking');
      return;
    }
    
    const { error } = await supabase
      .from('visitor_analytics')
      .insert([cleanedData]);
    
    if (error) {
      console.error('Failed to track page view:', error);
    } else {
      console.log('📊 Page view tracked (production only):', pagePath);
      
      // Set up time tracking for this page
      setupTimeTracking(sessionId, pagePath);
    }
    
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
};