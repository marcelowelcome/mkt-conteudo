-- 005_rls_policies.sql
-- Row Level Security em todas as tabelas — isolamento por workspace

-- Habilitar RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_adaptations ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorial_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Função helper: retorna workspaces do usuário autenticado
CREATE OR REPLACE FUNCTION user_workspace_ids()
RETURNS SETOF TEXT
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT workspace_id FROM user_roles WHERE user_id = auth.uid();
$$;

-- Função helper: verifica se usuário tem role específica no workspace
CREATE OR REPLACE FUNCTION user_has_role(p_workspace_id TEXT, p_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND workspace_id = p_workspace_id
      AND role = ANY(p_roles)
  );
$$;

-- ==================
-- WORKSPACES
-- ==================
CREATE POLICY "Users can view their workspaces"
  ON workspaces FOR SELECT
  USING (id IN (SELECT user_workspace_ids()));

-- ==================
-- CONTENT_PIECES
-- ==================
CREATE POLICY "Users can view content in their workspaces"
  ON content_pieces FOR SELECT
  USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "Editors can insert content"
  ON content_pieces FOR INSERT
  WITH CHECK (user_has_role(workspace_id, ARRAY['admin', 'editor']));

CREATE POLICY "Editors can update content"
  ON content_pieces FOR UPDATE
  USING (user_has_role(workspace_id, ARRAY['admin', 'editor']));

CREATE POLICY "Admins can delete content"
  ON content_pieces FOR DELETE
  USING (user_has_role(workspace_id, ARRAY['admin']));

-- ==================
-- CONTENT_ADAPTATIONS
-- ==================
CREATE POLICY "Users can view adaptations in their workspaces"
  ON content_adaptations FOR SELECT
  USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "Editors can insert adaptations"
  ON content_adaptations FOR INSERT
  WITH CHECK (user_has_role(workspace_id, ARRAY['admin', 'editor']));

CREATE POLICY "Editors can update adaptations"
  ON content_adaptations FOR UPDATE
  USING (user_has_role(workspace_id, ARRAY['admin', 'editor']));

-- ==================
-- EDITORIAL_CALENDAR
-- ==================
CREATE POLICY "Users can view calendar in their workspaces"
  ON editorial_calendar FOR SELECT
  USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "Editors can manage calendar"
  ON editorial_calendar FOR INSERT
  WITH CHECK (user_has_role(workspace_id, ARRAY['admin', 'editor']));

CREATE POLICY "Editors can update calendar"
  ON editorial_calendar FOR UPDATE
  USING (user_has_role(workspace_id, ARRAY['admin', 'editor']));

CREATE POLICY "Admins can delete calendar entries"
  ON editorial_calendar FOR DELETE
  USING (user_has_role(workspace_id, ARRAY['admin']));

-- ==================
-- CHANNEL_CONFIGS
-- ==================
CREATE POLICY "Admins can view channel configs"
  ON channel_configs FOR SELECT
  USING (user_has_role(workspace_id, ARRAY['admin']));

CREATE POLICY "Admins can manage channel configs"
  ON channel_configs FOR ALL
  USING (user_has_role(workspace_id, ARRAY['admin']));

-- ==================
-- KNOWLEDGE_DOCUMENTS
-- ==================
CREATE POLICY "Users can view knowledge docs in their workspaces"
  ON knowledge_documents FOR SELECT
  USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "Editors can manage knowledge docs"
  ON knowledge_documents FOR INSERT
  WITH CHECK (user_has_role(workspace_id, ARRAY['admin', 'editor']));

CREATE POLICY "Editors can update knowledge docs"
  ON knowledge_documents FOR UPDATE
  USING (user_has_role(workspace_id, ARRAY['admin', 'editor']));

-- ==================
-- DOCUMENT_CHUNKS
-- ==================
CREATE POLICY "Users can view chunks in their workspaces"
  ON document_chunks FOR SELECT
  USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "System can manage chunks"
  ON document_chunks FOR INSERT
  WITH CHECK (user_has_role(workspace_id, ARRAY['admin', 'editor']));

-- ==================
-- USER_ROLES
-- ==================
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles in workspace"
  ON user_roles FOR SELECT
  USING (user_has_role(workspace_id, ARRAY['admin']));

CREATE POLICY "Admins can manage roles"
  ON user_roles FOR ALL
  USING (user_has_role(workspace_id, ARRAY['admin']));

-- ==================
-- ACTIVITY_LOG
-- ==================
CREATE POLICY "Users can view activity in their workspaces"
  ON activity_log FOR SELECT
  USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "System can insert activity"
  ON activity_log FOR INSERT
  WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

-- ROLLBACK:
-- DROP POLICY IF EXISTS ... (listar todas as policies acima)
-- ALTER TABLE ... DISABLE ROW LEVEL SECURITY; (para cada tabela)
-- DROP FUNCTION IF EXISTS user_workspace_ids();
-- DROP FUNCTION IF EXISTS user_has_role(TEXT, TEXT[]);
