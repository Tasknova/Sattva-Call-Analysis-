-- Update analyses table to populate call_id from recordings.call_history_id
-- This fixes the 485 new records that are missing call_id

UPDATE analyses
SET call_id = recordings.call_history_id
FROM recordings
WHERE analyses.recording_id = recordings.id
  AND analyses.call_id IS NULL;

-- Verify the update
SELECT 
  COUNT(*) as total_analyses,
  COUNT(call_id) as with_call_id,
  COUNT(*) - COUNT(call_id) as missing_call_id
FROM analyses;
