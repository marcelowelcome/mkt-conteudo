-- 004_pg_cron_setup.sql
-- Configuração do pg_cron + pg_net para cron jobs automáticos
-- NOTA: pg_cron e pg_net devem ser habilitados no dashboard do Supabase antes de rodar

-- Habilitar extensões (se não habilitadas via dashboard)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Job: auto-publish a cada 30 minutos
SELECT cron.schedule(
  'hub-auto-publish',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.base_url') || '/api/publish/auto',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Job: scraping semanal do site (segunda-feira às 6h BRT = 9h UTC)
SELECT cron.schedule(
  'hub-knowledge-scrape',
  '0 9 * * 1',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.base_url') || '/api/knowledge/scrape',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Job: relatório mensal (dia 1, 5h BRT = 8h UTC)
SELECT cron.schedule(
  'hub-report-monthly',
  '0 8 1 * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.base_url') || '/api/analytics',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret')
    ),
    body := '{"report": true}'::jsonb
  );
  $$
);

-- Verificar jobs criados:
-- SELECT * FROM cron.job WHERE jobname LIKE 'hub-%';

-- ROLLBACK:
-- SELECT cron.unschedule('hub-auto-publish');
-- SELECT cron.unschedule('hub-knowledge-scrape');
-- SELECT cron.unschedule('hub-report-monthly');
