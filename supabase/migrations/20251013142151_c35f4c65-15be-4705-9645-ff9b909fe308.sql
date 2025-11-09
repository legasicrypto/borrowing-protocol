-- Schedule the crypto price update to run every 2 minutes
SELECT cron.schedule(
  'update-crypto-prices-every-2-minutes',
  '*/2 * * * *', -- Every 2 minutes
  $$
  SELECT
    net.http_post(
        url:='https://dkzsomxybwlxphvsxprc.supabase.co/functions/v1/update-crypto-prices',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrenNvbXh5YndseHBodnN4cHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNzM2NDIsImV4cCI6MjA3NTg0OTY0Mn0.DXPRCM_8n4aNGFoNmHmDDZn2gLPIl4znWFBzxN1SN7E"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);