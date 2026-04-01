-- 006_seed_initial_workspace.sql
-- Seed do workspace Welcome Trips + configuração inicial

-- Workspace Welcome Trips
INSERT INTO workspaces (id, name, site_url)
VALUES ('wt', 'Welcome Trips', 'https://www.welcometrips.com.br')
ON CONFLICT (id) DO NOTHING;

-- Workspace Welcome Weddings (futuro — Fase 4)
INSERT INTO workspaces (id, name, site_url)
VALUES ('ww', 'Welcome Weddings', 'https://www.welcomeweddings.com.br')
ON CONFLICT (id) DO NOTHING;

-- Configurações iniciais de canais para Welcome Trips (inativos até configurar credenciais)
INSERT INTO channel_configs (workspace_id, channel, config, is_active)
VALUES
  ('wt', 'wordpress',  '{}', FALSE),
  ('wt', 'email',      '{}', FALSE),
  ('wt', 'instagram',  '{}', FALSE),
  ('wt', 'linkedin',   '{}', FALSE),
  ('wt', 'youtube',    '{}', FALSE)
ON CONFLICT (workspace_id, channel) DO NOTHING;

-- NOTA: O primeiro usuário admin deve ser adicionado manualmente após criar
-- a conta via Supabase Auth:
--
-- INSERT INTO user_roles (user_id, workspace_id, role)
-- VALUES ('<uuid-do-usuario>', 'wt', 'admin');

-- ROLLBACK:
-- DELETE FROM channel_configs WHERE workspace_id IN ('wt', 'ww');
-- DELETE FROM workspaces WHERE id IN ('wt', 'ww');
