// Busca vetorial no pgvector via função search_knowledge()

import { createServerSupabaseClient } from '@/lib/supabase'
import { generateEmbedding } from '@/lib/rag/embeddings'
import { RAG_CONFIG } from '@/lib/constants'
import { logger } from '@/lib/logger'
import type { VectorSearchResult } from '@/types'

/** Busca chunks relevantes por similaridade semântica */
export async function vectorSearch(
  query: string,
  workspaceId: string,
  options?: {
    threshold?: number
    limit?: number
  }
): Promise<VectorSearchResult[]> {
  const threshold = options?.threshold ?? RAG_CONFIG.SIMILARITY_THRESHOLD
  const limit = options?.limit ?? RAG_CONFIG.MAX_CHUNKS

  // Gerar embedding da query
  const queryEmbedding = await generateEmbedding(query)

  // Buscar via search_knowledge()
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.rpc('search_knowledge', {
    query_embedding: queryEmbedding,
    p_workspace_id: workspaceId,
    match_threshold: threshold,
    match_count: limit,
  })

  if (error) {
    logger.error('Vector search failed', { error: error.message, workspaceId })
    throw new Error(`Erro na busca vetorial: ${error.message}`)
  }

  logger.info('Vector search completed', {
    query: query.slice(0, 50),
    workspaceId,
    results: data?.length ?? 0,
  })

  return (data as VectorSearchResult[]) ?? []
}
