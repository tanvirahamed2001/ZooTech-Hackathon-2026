/*
  # Waitlist Submissions Table

  1. New Tables
    - `waitlist_submissions` - Stores waitlist submissions for AI Coach verticals

  2. Security
    - Enable RLS on waitlist_submissions table
    - Allow anonymous users to insert and read waitlist submissions

  3. Indexes
    - Performance indexes for common queries
    - Email and vertical lookup optimization
*/

-- Create waitlist_submissions table only if it doesn't exist
CREATE TABLE IF NOT EXISTS waitlist_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  confession text NOT NULL,
  vertical text NOT NULL,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS only if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'waitlist_submissions' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE waitlist_submissions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies only if they don't exist
DO $$
BEGIN
  -- Check and create insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'waitlist_submissions' 
    AND policyname = 'Anyone can insert waitlist submissions'
  ) THEN
    CREATE POLICY "Anyone can insert waitlist submissions"
      ON waitlist_submissions
      FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;

  -- Check and create select policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'waitlist_submissions' 
    AND policyname = 'Anyone can read waitlist submissions'
  ) THEN
    CREATE POLICY "Anyone can read waitlist submissions"
      ON waitlist_submissions
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

-- Create indexes only if they don't exist
CREATE INDEX IF NOT EXISTS idx_waitlist_submissions_email ON waitlist_submissions(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_submissions_vertical ON waitlist_submissions(vertical);
CREATE INDEX IF NOT EXISTS idx_waitlist_submissions_created_at ON waitlist_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_submissions_ip_address ON waitlist_submissions(ip_address) WHERE ip_address IS NOT NULL;

-- Add comments for documentation (these are safe to run multiple times)
COMMENT ON TABLE waitlist_submissions IS 'Waitlist submissions for AI Coach verticals with confessions';
COMMENT ON COLUMN waitlist_submissions.confession IS 'User confession about their challenges';
COMMENT ON COLUMN waitlist_submissions.vertical IS 'AI Coach vertical (executive, fitness, study, yoga, lifestyle)';
COMMENT ON COLUMN waitlist_submissions.ip_address IS 'IP address for tracking and analytics';
COMMENT ON COLUMN waitlist_submissions.user_agent IS 'Browser user agent for analytics';