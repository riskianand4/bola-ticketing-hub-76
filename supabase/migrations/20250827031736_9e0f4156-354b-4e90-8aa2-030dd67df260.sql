-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the match timer to run every minute
SELECT cron.schedule(
    'match-timer-increment', 
    '* * * * *', -- Every minute
    $$
    SELECT net.http_post(
        url := 'https://sitfhtntzrkpireosamj.functions.supabase.co/functions/v1/match-timer',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpdGZodG50enJrcGlyZW9zYW1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMzc1NzYsImV4cCI6MjA3MDkxMzU3Nn0.4u_fkNr9yeQzbT3VgHoHFWnyz58Cf8FjkN1ca4stlA0"}'::jsonb,
        body := '{}'::jsonb
    ) as request_id;
    $$
);