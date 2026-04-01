-- 003_support_tables.sql
-- Tabelas de suporte: user_roles, activity_log + índices

-- Roles de usuário por workspace
CREATE TABLE user_roles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  role         TEXT NOT NULL DEFAULT 'viewer',
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, workspace_id)
);

-- Log de atividades
CREATE TABLE activity_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  user_id      UUID REFERENCES auth.users(id),
  action       TEXT NOT NULL,
  entity_type  TEXT,
  entity_id    UUID,
  details      JSONB,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_activity_workspace ON activity_log(workspace_id, created_at DESC);
CREATE INDEX idx_activity_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_user_roles_workspace ON user_roles(workspace_id);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);

-- ROLLBACK:
-- DROP TABLE IF EXISTS activity_log;
-- DROP TABLE IF EXISTS user_roles;
