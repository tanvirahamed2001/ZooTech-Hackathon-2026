/*
  # Add unsubscribed column to quiz_responses table

  1. Changes
    - Add `unsubscribed` boolean column with default false
    - Add index for performance on unsubscribed column
    - Add policy for anonymous users to update unsubscribed status

  2. Security
    - Allow anonymous users to update unsubscribed status by record ID
    - Maintains existing RLS policies
*/

-- Add unsubscribed column to existing table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quiz_responses' AND column_name = 'unsubscribed'
  ) THEN
    ALTER TABLE quiz_responses ADD COLUMN unsubscribed boolean DEFAULT false;
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_quiz_responses_unsubscribed ON quiz_responses (unsubscribed);

-- Drop existing policy if it exists and recreate
DO $$
BEGIN
  -- Drop the policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quiz_responses' 
    AND policyname = 'Anyone can update unsubscribed status by ID'
  ) THEN
    DROP POLICY "Anyone can update unsubscribed status by ID" ON quiz_responses;
  END IF;
  
  -- Create the new policy
  EXECUTE 'CREATE POLICY "Anyone can update unsubscribed status by ID"
    ON quiz_responses
    FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true)';
END $$;