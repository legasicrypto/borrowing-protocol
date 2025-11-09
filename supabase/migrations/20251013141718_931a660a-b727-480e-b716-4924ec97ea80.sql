-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the liquidation monitor to run every 5 minutes
SELECT cron.schedule(
  'monitor-liquidations-every-5-minutes',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://dkzsomxybwlxphvsxprc.supabase.co/functions/v1/monitor-liquidations',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrenNvbXh5YndseHBodnN4cHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNzM2NDIsImV4cCI6MjA3NTg0OTY0Mn0.DXPRCM_8n4aNGFoNmHmDDZn2gLPIl4znWFBzxN1SN7E"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);