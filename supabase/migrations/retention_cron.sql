/**
 * GASP RETENTION PROTOCOL: pg_cron SETUP
 * This script schedules the 'retention-drip' Edge Function to pulse every 2 hours.
 */

-- Ensure the extension is active (Requires Superuser or Database permissions)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create the pulse job
SELECT cron.schedule(
    'ghost-retention-pulse', -- Unique Job Name
    '0 */2 * * *',           -- Every 2 hours (00:00, 02:00, etc.)
    $$
    SELECT
      net.http_post(
        url := 'https://vvcwjlcequbkhlpmwzlc.supabase.co/functions/v1/retention-drip',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
        ),
        body := '{}'
      ) as request_id;
    $$
);

-- Note: Ensure 'supabase_service_role_key' is set in your DB settings 
-- or use the hardcoded key if your environment is isolated.

