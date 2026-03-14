/*
  # Analytics Enrichment - Add new tracking fields

  1. New Columns
    - Geo + Network data (city, region, country, postal, org, asn)
    - Enhanced device/platform data
    - Referrer breakdown (domain, path)
    - Session duration tracking

  2. Indexes
    - Performance indexes for new analytics queries
    - Geographic and referrer analysis optimization

  3. Notes
    - All new columns are nullable for backward compatibility
    - Existing data remains intact
*/

-- Add new enrichment columns to visitor_analytics
DO $$
BEGIN
  -- Geo + Network data (from IPinfo)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_analytics' AND column_name = 'region') THEN
    ALTER TABLE visitor_analytics ADD COLUMN region text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_analytics' AND column_name = 'postal') THEN
    ALTER TABLE visitor_analytics ADD COLUMN postal text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_analytics' AND column_name = 'org') THEN
    ALTER TABLE visitor_analytics ADD COLUMN org text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_analytics' AND column_name = 'asn') THEN
    ALTER TABLE visitor_analytics ADD COLUMN asn text;
  END IF;

  -- Enhanced device/platform data
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_analytics' AND column_name = 'platform') THEN
    ALTER TABLE visitor_analytics ADD COLUMN platform text;
  END IF;

  -- Referrer breakdown
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_analytics' AND column_name = 'referrer_domain') THEN
    ALTER TABLE visitor_analytics ADD COLUMN referrer_domain text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_analytics' AND column_name = 'referrer_path') THEN
    ALTER TABLE visitor_analytics ADD COLUMN referrer_path text;
  END IF;

  -- Session duration
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_analytics' AND column_name = 'time_on_page_ms') THEN
    ALTER TABLE visitor_analytics ADD COLUMN time_on_page_ms integer;
  END IF;
END $$;

-- Add indexes for new analytics queries
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_region ON visitor_analytics(region) WHERE region IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_org ON visitor_analytics(org) WHERE org IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_platform ON visitor_analytics(platform) WHERE platform IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_referrer_domain ON visitor_analytics(referrer_domain) WHERE referrer_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_time_on_page ON visitor_analytics(time_on_page_ms) WHERE time_on_page_ms IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN visitor_analytics.region IS 'State/province from IP geolocation';
COMMENT ON COLUMN visitor_analytics.postal IS 'Postal/ZIP code from IP geolocation';
COMMENT ON COLUMN visitor_analytics.org IS 'ISP/organization from IP lookup';
COMMENT ON COLUMN visitor_analytics.asn IS 'Autonomous System Number from IP lookup';
COMMENT ON COLUMN visitor_analytics.platform IS 'Operating system platform (iOS, Android, Windows, etc.)';
COMMENT ON COLUMN visitor_analytics.referrer_domain IS 'Domain portion of document.referrer';
COMMENT ON COLUMN visitor_analytics.referrer_path IS 'Path portion of document.referrer';
COMMENT ON COLUMN visitor_analytics.time_on_page_ms IS 'Time spent on page in milliseconds';