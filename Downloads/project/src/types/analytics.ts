export interface VisitorAnalytics {
  id?: string;
  timestamp?: string;
  session_id: string;
  ip_address?: string | null;
  user_agent?: string;
  
  // Page and navigation data
  page_path: string;
  query_parameters?: Record<string, string> | null;
  referrer?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  
  // Browser and device data
  browser_name?: string | null;
  browser_version?: string | null;
  os_name?: string | null;
  os_version?: string | null;
  device_type?: string | null;
  screen_width?: number | null;
  screen_height?: number | null;
  viewport_width?: number | null;
  viewport_height?: number | null;
  
  // User preferences
  language?: string | null;
  timezone?: string | null;
  
  // Performance data
  page_load_duration?: number | null;
  
  // Geographic data
  country?: string | null;
  city?: string | null;
  
  created_at?: string;
}

export interface AnalyticsSession {
  session_id: string;
  first_visit: string;
  last_visit: string;
  page_views: number;
  pages_visited: string[];
  total_duration?: number;
}

export interface AnalyticsSummary {
  total_visitors: number;
  unique_sessions: number;
  page_views: number;
  top_pages: Array<{ page: string; views: number }>;
  top_referrers: Array<{ referrer: string; visits: number }>;
  device_breakdown: Array<{ device_type: string; count: number }>;
  browser_breakdown: Array<{ browser: string; count: number }>;
  country_breakdown: Array<{ country: string; count: number }>;
}