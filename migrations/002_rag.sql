-- 002_rag.sql
-- Knowledge Base: pgvector, knowledge_documents, document_chunks, search_knowledge()

-- Habilitar pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Documentos indexados
CREATE TABLE knowledge_documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  title        TEXT NOT NULL,
  source_type  TEXT NOT NULL,
  source_url   TEXT,
  file_name    TEXT,
  description  TEXT,
  is_active    BOOLEAN DEFAULT TRUE,
  indexed_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chunks com embeddings vetoriais
CREATE TABLE document_chunks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  TEXT NOT NULL REFERENCES workspaces(id),
  document_id   UUID REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  chunk_index   INTEGER NOT NULL,
  content       TEXT NOT NULL,
  token_count   INTEGER,
  embedding     vector(1536),
  metadata      JSONB,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice IVFFlat para busca vetorial
CREATE INDEX idx_chunks_embedding ON document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX idx_knowledge_workspace ON knowledge_documents(workspace_id, is_active);
CREATE INDEX idx_chunks_workspace ON document_chunks(workspace_id);

-- Função de busca vetorial com filtro por workspace
CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding vector(1536),
  p_workspace_id  TEXT,
  match_threshold FLOAT DEFAULT 0.70,
  match_count     INT DEFAULT 8
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  document_id UUID,
  similarity FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.content,
    dc.metadata,
    dc.document_id,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  JOIN knowledge_documents kd ON kd.id = dc.document_id
  WHERE kd.is_active = TRUE
    AND dc.workspace_id = p_workspace_id
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ROLLBACK:
-- DROP FUNCTION IF EXISTS search_knowledge;
-- DROP TABLE IF EXISTS document_chunks;
-- DROP TABLE IF EXISTS knowledge_documents;
-- DROP EXTENSION IF EXISTS vector;
