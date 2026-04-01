-- 001_initial_schema.sql
-- Tabelas principais: workspaces, content_pieces, content_adaptations,
-- editorial_calendar, channel_configs, app_config

-- Workspaces (multi-tenant)
CREATE TABLE workspaces (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  site_url     TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conteúdos-base
CREATE TABLE content_pieces (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      TEXT NOT NULL REFERENCES workspaces(id),
  title             TEXT NOT NULL,
  subtitle          TEXT,
  body              TEXT,
  keywords          TEXT[],
  target_persona    TEXT,
  target_channels   TEXT[],
  status            TEXT NOT NULL DEFAULT 'DRAFT',
  author_id         UUID REFERENCES auth.users(id),
  reviewer_id       UUID REFERENCES auth.users(id),
  approver_id       UUID REFERENCES auth.users(id),
  scheduled_for     TIMESTAMP WITH TIME ZONE,
  published_at      TIMESTAMP WITH TIME ZONE,
  version           INTEGER DEFAULT 1,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Versões adaptadas por canal
CREATE TABLE content_adaptations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_piece_id  UUID REFERENCES content_pieces(id) ON DELETE CASCADE,
  workspace_id      TEXT NOT NULL REFERENCES workspaces(id),
  channel           TEXT NOT NULL,
  ai_output         JSONB,
  title_edited      TEXT,
  body_edited       TEXT,
  hashtags_edited   TEXT[],
  subject_edited    TEXT,
  cta_edited        TEXT,
  status            TEXT NOT NULL DEFAULT 'PENDING',
  analyst_notes     TEXT,
  published_at      TIMESTAMP WITH TIME ZONE,
  publish_id        TEXT,
  publish_error     TEXT,
  auto_publish      BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendário editorial
CREATE TABLE editorial_calendar (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      TEXT NOT NULL REFERENCES workspaces(id),
  content_piece_id  UUID REFERENCES content_pieces(id),
  adaptation_id     UUID REFERENCES content_adaptations(id),
  channel           TEXT NOT NULL,
  scheduled_for     TIMESTAMP WITH TIME ZONE NOT NULL,
  status            TEXT NOT NULL DEFAULT 'SCHEDULED',
  auto_publish      BOOLEAN DEFAULT FALSE,
  notes             TEXT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurações de canais por workspace
CREATE TABLE channel_configs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      TEXT NOT NULL REFERENCES workspaces(id),
  channel           TEXT NOT NULL,
  config            JSONB NOT NULL DEFAULT '{}',
  is_active         BOOLEAN DEFAULT FALSE,
  last_tested_at    TIMESTAMP WITH TIME ZONE,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, channel)
);

-- Configuração geral (chave-valor)
CREATE TABLE app_config (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_content_workspace ON content_pieces(workspace_id, status, created_at DESC);
CREATE INDEX idx_adaptations_content ON content_adaptations(content_piece_id);
CREATE INDEX idx_adaptations_workspace ON content_adaptations(workspace_id, channel, status);
CREATE INDEX idx_calendar_workspace ON editorial_calendar(workspace_id, scheduled_for);
CREATE INDEX idx_calendar_autopublish ON editorial_calendar(scheduled_for, auto_publish, status);

-- ROLLBACK:
-- DROP TABLE IF EXISTS app_config;
-- DROP TABLE IF EXISTS channel_configs;
-- DROP TABLE IF EXISTS editorial_calendar;
-- DROP TABLE IF EXISTS content_adaptations;
-- DROP TABLE IF EXISTS content_pieces;
-- DROP TABLE IF EXISTS workspaces;
