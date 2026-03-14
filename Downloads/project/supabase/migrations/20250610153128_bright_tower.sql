/*
  # Clean up unnecessary unsubscribe_tokens table

  1. Remove Tables
    - Drop `unsubscribe_tokens` table (not needed since we use quiz_responses.unsubscribed column)
  
  2. Notes
    - The unsubscribe functionality now uses the main quiz_responses table with the unsubscribed boolean column
    - This is simpler, more secure, and avoids data duplication
*/

-- Drop the unnecessary unsubscribe_tokens table
DROP TABLE IF EXISTS unsubscribe_tokens;