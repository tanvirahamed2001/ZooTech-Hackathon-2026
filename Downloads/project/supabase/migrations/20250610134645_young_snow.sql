/*
  # Add IP Address Tracking

  1. Schema Changes
    - Add `ip_address` column to quiz_responses table
    - Add `user_agent` column to capture browser info too
    - Add indexes for performance

  2. Security
    - Maintain existing RLS policies
    - No changes to access patterns
*/

-- Add IP address and user agent tracking to quiz_responses
ALTER TABLE quiz_responses 
ADD COLUMN ip_address inet,
ADD COLUMN user_agent text;

-- Add indexes for the new columns
CREATE INDEX idx_quiz_responses_ip_address ON quiz_responses(ip_address) WHERE ip_address IS NOT NULL;
CREATE INDEX idx_quiz_responses_user_agent ON quiz_responses(user_agent) WHERE user_agent IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN quiz_responses.ip_address IS 'IP address of the user when they submitted the quiz';
COMMENT ON COLUMN quiz_responses.user_agent IS 'Browser user agent string for additional tracking';