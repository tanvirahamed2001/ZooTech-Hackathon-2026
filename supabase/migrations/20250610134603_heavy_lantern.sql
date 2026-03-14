/*
  # Clean Database Structure for VARK Quiz

  1. New Tables
    - `quiz_responses` - Stores all quiz responses with email capture and results
    - `emails` - Tracks email sending status and content

  2. Security
    - Enable RLS on both tables
    - Allow anonymous users to insert/read quiz responses (for sharing)
    - Restrict email table to service role only

  3. Indexes
    - Performance indexes for common queries
    - Email lookup optimization
*/

-- Drop existing tables if they exist to start clean
DROP TABLE IF EXISTS quiz_responses CASCADE;
DROP TABLE IF EXISTS emails CASCADE;

-- Create quiz_responses table
CREATE TABLE quiz_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  first_name text,
  reason text,
  custom_reason text,
  scores jsonb NOT NULL,
  answers jsonb NOT NULL,
  results_url text NOT NULL,
  email_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create emails table
CREATE TABLE emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient text NOT NULL,
  subject text,
  body text,
  cc text,
  bcc text,
  status text DEFAULT 'pending',
  smtp_response text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

-- Policies for quiz_responses (public read for shared results, no user auth needed)
CREATE POLICY "Anyone can insert quiz responses"
  ON quiz_responses
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can read quiz responses"
  ON quiz_responses
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can update quiz responses"
  ON quiz_responses
  FOR UPDATE
  TO anon
  USING (true);

-- Policies for emails (service role only for sending)
CREATE POLICY "Service role can manage emails"
  ON emails
  FOR ALL
  TO service_role
  USING (true);

-- Add indexes for performance
CREATE INDEX idx_quiz_responses_created_at ON quiz_responses(created_at);
CREATE INDEX idx_quiz_responses_email ON quiz_responses(email) WHERE email IS NOT NULL;
CREATE INDEX idx_quiz_responses_id ON quiz_responses(id);
CREATE INDEX idx_emails_status ON emails(status);
CREATE INDEX idx_emails_created_at ON emails(created_at);