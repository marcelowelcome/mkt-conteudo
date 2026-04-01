// Monta o prompt do usuário com 3 camadas de contexto para o Motor de Adaptação

import { vectorSearch } from '@/lib/rag/vector-search'
import { buildSystemPrompt } from '@/lib/content/system-prompt'
import { logger } from '@/lib/logger'
import type { Channel, ContentPiece } from '@/types'

interface PromptResult {
  systemPrompt: string
  userPrompt: string
}

/** Monta prompt completo com 3 camadas: marca (RAG), performance e boas práticas */
export async function buildAdaptationPrompt(
  content: ContentPiece,
  channels: Channel[],
  workspaceId: string
): Promise<PromptResult> {
  // Camada 1: Contexto de marca via RAG
  let brandContext = ''
  try {
    const searchQuery = `${content.title} ${content.target_persona ?? ''} ${content.keywords?.join(' ') ?? ''}`
    const chunks = await vectorSearch(searchQuery, workspaceId)

    if (chunks.length > 0) {
      brandContext = chunks.map((c) => c.content).join('\n\n')
      logger.info('RAG context loaded', { chunks: chunks.length, workspaceId })
    }
  } catch (error) {
    logger.warn('RAG search failed, proceeding without brand context', {
      error: error instanceof Error ? error.message : 'Unknown',
    })
  }

  // Camada 2: System prompt com boas práticas por canal
  const systemPrompt = buildSystemPrompt(channels)

  // Camada 3: Prompt do usuário com conteúdo-base
  const userPrompt = buildUserPrompt(content, channels, brandContext)

  return { systemPrompt, userPrompt }
}

function buildUserPrompt(
  content: ContentPiece,
  channels: Channel[],
  brandContext: string
): string {
  const parts: string[] = []

  // Conteúdo-base
  parts.push(`## Conteúdo-base

**Título**: ${content.title}`)

  if (content.subtitle) {
    parts.push(`**Subtítulo**: ${content.subtitle}`)
  }

  if (content.target_persona) {
    parts.push(`**Persona alvo**: ${content.target_persona}`)
  }

  if (content.keywords?.length) {
    parts.push(`**Palavras-chave**: ${content.keywords.join(', ')}`)
  }

  if (content.body) {
    parts.push(`\n**Corpo do conteúdo**:\n${content.body}`)
  }

  // Contexto de marca (RAG)
  if (brandContext) {
    parts.push(`\n## Contexto da marca (Knowledge Base)\n${brandContext}`)
  }

  // Instrução final
  parts.push(`\n## Canais solicitados\n${channels.join(', ')}`)
  parts.push(`\nGere as adaptações para os canais acima em formato JSON.`)

  return parts.join('\n')
}
