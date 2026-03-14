/*
  # Anonymous Visitor Analytics Table

  1. New Tables
    - `visitor_analytics` - Stores anonymous visitor data for site analytics

  2. Security
    - Enable RLS on visitor_analytics table
    - Allow anonymous users to insert visitor records
    - Restrict read access to service role only for privacy

  3. Indexes
    - Performance indexes for common analytics queries
    - Time-based queries optimization
*/

-- Create visitor_analytics table
CREATE TABLE IF NOT EXISTS visitor_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core tracking data
  timestamp timestamptz DEFAULT now() NOT NULL,
  session_id text NOT NULL,
  ip_address inet,
  user_agent text,
  
  -- Page and navigation data
  page_path text NOT NULL,
  query_parameters jsonb,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  
  -- Browser and device data
  browser_name text,
  browser_version text,
  os_name text,
  os_version text,
  device_type text, -- mobile, tablet, desktop
  screen_width integer,
  screen_height integer,
  viewport_width integer,
  viewport_height integer,
  
  -- User preferences
  language text,
  timezone text,
  
  -- Performance data
  page_load_duration integer, -- milliseconds
  
  -- Geographic data (optional)
  country text,
  city text,
  
  -- Metadata
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE visitor_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for visitor_analytics
CREATE POLICY "Anyone can insert visitor analytics"
  ON visitor_analytics
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only service role can read analytics data for privacy
CREATE POLICY "Service role can read visitor analytics"
  ON visitor_analytics
  FOR SELECT
  TO service_role
  USING (true);

-- Add indexes for performance
CREATE INDEX idx_visitor_analytics_timestamp ON visitor_analytics(timestamp);
CREATE INDEX idx_visitor_analytics_session_id ON visitor_analytics(session_id);
CREATE INDEX idx_visitor_analytics_page_path ON visitor_analytics(page_path);
CREATE INDEX idx_visitor_analytics_ip_address ON visitor_analytics(ip_address) WHERE ip_address IS NOT NULL;
CREATE INDEX idx_visitor_analytics_created_at ON visitor_analytics(created_at);
CREATE INDEX idx_visitor_analytics_utm_source ON visitor_analytics(utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX idx_visitor_analytics_country ON visitor_analytics(country) WHERE country IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE visitor_analytics IS 'Anonymous visitor tracking data for site analytics';
COMMENT ON COLUMN visitor_analytics.session_id IS 'Unique session identifier for grouping page views';
COMMENT ON COLUMN visitor_analytics.page_load_duration IS 'Page load time in milliseconds';
COMMENT ON COLUMN visitor_analytics.device_type IS 'Device category: mobile, tablet, or desktop';