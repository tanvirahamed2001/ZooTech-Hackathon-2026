-- Step 1: Clean up obvious development/test entries
DELETE FROM visitor_analytics 
WHERE 
  page_path LIKE '%webcontainer%' OR
  page_path LIKE '%localhost%' OR
  page_path LIKE '%127.0.0.1%' OR
  page_path LIKE '%stackblitz%' OR
  page_path LIKE '%bolt.new%' OR
  user_agent LIKE '%webcontainer%' OR
  user_agent LIKE '%bot%' OR
  user_agent LIKE '%crawler%' OR
  user_agent LIKE '%spider%' OR
  user_agent LIKE '%headless%';

-- Step 2: Clean up entries with invalid/empty session IDs
DELETE FROM visitor_analytics 
WHERE 
  session_id IS NULL OR 
  session_id = '' OR 
  session_id = 'null' OR
  session_id = 'undefined';

-- Step 3: Clean up entries with invalid page paths
DELETE FROM visitor_analytics 
WHERE 
  page_path IS NULL OR 
  page_path = '' OR 
  page_path = 'null' OR 
  page_path = 'undefined';

-- Step 4: Fix invalid numeric values BEFORE adding constraints
UPDATE visitor_analytics 
SET 
  screen_width = NULL 
WHERE 
  screen_width IS NOT NULL AND screen_width <= 0;

UPDATE visitor_analytics 
SET 
  screen_height = NULL 
WHERE 
  screen_height IS NOT NULL AND screen_height <= 0;

UPDATE visitor_analytics 
SET 
  viewport_width = NULL 
WHERE 
  viewport_width IS NOT NULL AND viewport_width <= 0;

UPDATE visitor_analytics 
SET 
  viewport_height = NULL 
WHERE 
  viewport_height IS NOT NULL AND viewport_height <= 0;

-- Fix unreasonable duration values (less than 1 second or more than 1 hour)
UPDATE visitor_analytics 
SET 
  time_on_page_ms = NULL 
WHERE 
  time_on_page_ms IS NOT NULL AND 
  (time_on_page_ms < 1000 OR time_on_page_ms > 3600000);

-- Fix unreasonable page load duration values
UPDATE visitor_analytics 
SET 
  page_load_duration = NULL 
WHERE 
  page_load_duration IS NOT NULL AND 
  (page_load_duration < 0 OR page_load_duration > 60000);

-- Step 5: Update empty string values to NULL for consistency
UPDATE visitor_analytics 
SET 
  city = CASE WHEN city = '' OR city = 'null' OR city = 'undefined' THEN NULL ELSE city END,
  region = CASE WHEN region = '' OR region = 'null' OR region = 'undefined' THEN NULL ELSE region END,
  country = CASE WHEN country = '' OR country = 'null' OR country = 'undefined' THEN NULL ELSE country END,
  org = CASE WHEN org = '' OR org = 'null' OR org = 'undefined' THEN NULL ELSE org END,
  browser_name = CASE WHEN browser_name = '' OR browser_name = 'null' OR browser_name = 'undefined' THEN NULL ELSE browser_name END,
  platform = CASE WHEN platform = '' OR platform = 'null' OR platform = 'undefined' THEN NULL ELSE platform END,
  referrer_domain = CASE WHEN referrer_domain = '' OR referrer_domain = 'null' OR referrer_domain = 'undefined' THEN NULL ELSE referrer_domain END,
  referrer_path = CASE WHEN referrer_path = '' OR referrer_path = 'null' OR referrer_path = 'undefined' THEN NULL ELSE referrer_path END,
  utm_source = CASE WHEN utm_source = '' OR utm_source = 'null' OR utm_source = 'undefined' THEN NULL ELSE utm_source END,
  utm_medium = CASE WHEN utm_medium = '' OR utm_medium = 'null' OR utm_medium = 'undefined' THEN NULL ELSE utm_medium END,
  utm_campaign = CASE WHEN utm_campaign = '' OR utm_campaign = 'null' OR utm_campaign = 'undefined' THEN NULL ELSE utm_campaign END,
  device_type = CASE WHEN device_type = '' OR device_type = 'null' OR device_type = 'undefined' THEN NULL ELSE device_type END;

-- Step 6: Add constraints to prevent future bad data (now that data is clean)
DO $$
BEGIN
  -- Add session_id constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'check_session_id_not_empty'
  ) THEN
    ALTER TABLE visitor_analytics 
    ADD CONSTRAINT check_session_id_not_empty CHECK (session_id IS NOT NULL AND session_id != '');
  END IF;

  -- Add page_path constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'check_page_path_not_empty'
  ) THEN
    ALTER TABLE visitor_analytics 
    ADD CONSTRAINT check_page_path_not_empty CHECK (page_path IS NOT NULL AND page_path != '');
  END IF;

  -- Add screen size constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'check_reasonable_screen_size'
  ) THEN
    ALTER TABLE visitor_analytics 
    ADD CONSTRAINT check_reasonable_screen_size CHECK (
      (screen_width IS NULL OR screen_width > 0) AND 
      (screen_height IS NULL OR screen_height > 0)
    );
  END IF;

  -- Add viewport size constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'check_reasonable_viewport_size'
  ) THEN
    ALTER TABLE visitor_analytics 
    ADD CONSTRAINT check_reasonable_viewport_size CHECK (
      (viewport_width IS NULL OR viewport_width > 0) AND 
      (viewport_height IS NULL OR viewport_height > 0)
    );
  END IF;

  -- Add duration constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'check_reasonable_duration'
  ) THEN
    ALTER TABLE visitor_analytics 
    ADD CONSTRAINT check_reasonable_duration CHECK (
      time_on_page_ms IS NULL OR 
      (time_on_page_ms >= 1000 AND time_on_page_ms <= 3600000)
    );
  END IF;

  -- Add page load duration constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'check_reasonable_page_load_duration'
  ) THEN
    ALTER TABLE visitor_analytics 
    ADD CONSTRAINT check_reasonable_page_load_duration CHECK (
      page_load_duration IS NULL OR 
      (page_load_duration >= 0 AND page_load_duration <= 60000)
    );
  END IF;
END $$;

-- Step 7: Create function to detect session integrity issues
CREATE OR REPLACE FUNCTION detect_session_conflicts()
RETURNS TABLE(
  session_id text,
  conflict_count bigint,
  device_types text[],
  platforms text[],
  browser_names text[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    va.session_id,
    COUNT(DISTINCT CONCAT(COALESCE(va.device_type, 'unknown'), '|', COALESCE(va.platform, 'unknown'), '|', COALESCE(va.browser_name, 'unknown'))) as conflict_count,
    ARRAY_AGG(DISTINCT va.device_type) FILTER (WHERE va.device_type IS NOT NULL) as device_types,
    ARRAY_AGG(DISTINCT va.platform) FILTER (WHERE va.platform IS NOT NULL) as platforms,
    ARRAY_AGG(DISTINCT va.browser_name) FILTER (WHERE va.browser_name IS NOT NULL) as browser_names
  FROM visitor_analytics va
  WHERE va.timestamp >= CURRENT_TIMESTAMP - INTERVAL '7 days'
  GROUP BY va.session_id
  HAVING COUNT(DISTINCT CONCAT(COALESCE(va.device_type, 'unknown'), '|', COALESCE(va.platform, 'unknown'), '|', COALESCE(va.browser_name, 'unknown'))) > 1
  ORDER BY conflict_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Add comment for the function
COMMENT ON FUNCTION detect_session_conflicts() IS 'Detects sessions with conflicting device/browser information that may indicate bots or data quality issues';

-- Step 8: Optimize existing indexes and add new ones for better performance
-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_visitor_analytics_timestamp;
DROP INDEX IF EXISTS idx_visitor_analytics_session_id;

-- Recreate with better performance characteristics
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_timestamp_desc ON visitor_analytics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_session_timestamp ON visitor_analytics(session_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_page_timestamp ON visitor_analytics(page_path, timestamp DESC);

-- Add composite indexes for common analytics queries (without non-immutable functions)
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_enrichment_lookup ON visitor_analytics(ip_address, timestamp DESC) 
WHERE ip_address IS NOT NULL AND city IS NULL;

-- Add index for device type analytics
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_device_analytics ON visitor_analytics(device_type, timestamp DESC) 
WHERE device_type IS NOT NULL;

-- Add index for geographic analytics
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_geo_analytics ON visitor_analytics(country, city, timestamp DESC) 
WHERE country IS NOT NULL;

-- Add index for session analytics (without time-based predicate)
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_session_analytics ON visitor_analytics(session_id, timestamp DESC);

-- Step 9: Update table statistics for better query planning
ANALYZE visitor_analytics;

-- Step 10: Log cleanup results (optional - for monitoring)
DO $$
DECLARE
  total_rows bigint;
  null_cities bigint;
  null_orgs bigint;
BEGIN
  SELECT COUNT(*) INTO total_rows FROM visitor_analytics;
  SELECT COUNT(*) INTO null_cities FROM visitor_analytics WHERE city IS NULL;
  SELECT COUNT(*) INTO null_orgs FROM visitor_analytics WHERE org IS NULL;
  
  RAISE NOTICE 'Analytics cleanup completed. Total rows: %, Rows without city: %, Rows without org: %', 
    total_rows, null_cities, null_orgs;
END $$;