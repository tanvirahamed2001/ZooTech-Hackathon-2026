/*
  # Create results table for VARK quiz scores

  1. New Tables
    - `results`
      - `id` (uuid, primary key)
      - `user_email` (text, for identifying results)
      - `visual_score` (integer, defaults to 0)
      - `auditory_score` (integer, defaults to 0)
      - `reading_score` (integer, defaults to 0)
      - `kinesthetic_score` (integer, defaults to 0)
      - `created_at` (timestamp with timezone)

  2. Security
    - Enable RLS on `results` table
    - Add policy for authenticated users to read their own results
    - Add policy for anonymous users to insert results
*/

CREATE TABLE IF NOT EXISTS results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  visual_score integer DEFAULT 0,
  auditory_score integer DEFAULT 0,
  reading_score integer DEFAULT 0,
  kinesthetic_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own results
CREATE POLICY "Users can read own results"
  ON results
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = user_email);

-- Allow anyone to insert results (needed for the edge function)
CREATE POLICY "Anyone can insert results"
  ON results
  FOR INSERT
  TO anon
  WITH CHECK (true);