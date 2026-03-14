/*
  # Admin Analytics Views Table

  1. New Tables
    - `admin_analytics_views` - Tracks admin access to analytics dashboard

  2. Security
    - Enable RLS on admin_analytics_views table
    - Allow service role to insert and read admin access logs

  3. Indexes
    - Performance indexes for time-based queries
*/

-- Create admin_analytics_views table
CREATE TABLE IF NOT EXISTS admin_analytics_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address inet,
  user_agent text,
  access_time timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_analytics_views ENABLE ROW LEVEL SECURITY;

-- Policies for admin_analytics_views (service role only)
CREATE POLICY "Service role can manage admin analytics views"
  ON admin_analytics_views
  FOR ALL
  TO service_role
  USING (true);

-- Add indexes for performance
CREATE INDEX idx_admin_analytics_views_access_time ON admin_analytics_views(access_time);
CREATE INDEX idx_admin_analytics_views_ip_address ON admin_analytics_views(ip_address) WHERE ip_address IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE admin_analytics_views IS 'Tracks admin access to analytics dashboard';
COMMENT ON COLUMN admin_analytics_views.access_time IS 'When the admin accessed the analytics dashboard';