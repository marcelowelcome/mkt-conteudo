// POST adapta conteúdo — gera via Claude, parseia e salva adaptações

import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response'
import { buildAdaptationPrompt } from '@/lib/content/prompt-builder'
import { parseAdaptationOutput } from '@/lib/content/content-parser'
import { saveAdaptations } from '@/lib/content/channel-adapters'
import { logActivity } from '@/lib/activity'
import { CLAUDE_CONFIG } from '@/lib/constants'
import { logger } from '@/lib/logger'
import type { Channel, ContentPiece } from '@/types'

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Record<string, string> }
) => {
  const body = await request.json()
  const { channels, workspace_id } = body as {
    channels: Channel[]
    workspace_id: string
  }

  if (!channels?.length || !workspace_id) {
    return apiError('channels e workspace_id são obrigatórios', 400)
  }

  // Buscar conteúdo-base
  const supabase = createServerSupabaseClient()
  const { data: content, error } = await supabase
    .from('content_pieces')
    .select('*')
    .eq('id', params.id)
    .eq('workspace_id', workspace_id)
    .single()

  if (error || !content) {
    return apiError('Conteúdo não encontrado', 404)
  }

  // Montar prompt
  const { systemPrompt, userPrompt } = await buildAdaptationPrompt(
    content as ContentPiece,
    channels,
    workspace_id
  )

  logger.info('Starting adaptation (non-streaming)', {
    contentId: params.id,
    channels,
  })

  // Chamar Claude (sem streaming — resposta completa)
  const anthropic = new Anthropic()
  const message = await anthropic.messages.create({
    model: CLAUDE_CONFIG.MODEL,
    max_tokens: CLAUDE_CONFIG.MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const rawOutput = message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')

  // Parsear JSON
  const parsed = parseAdaptationOutput(rawOutput)
  if (!parsed) {
    return apiError('Falha ao parsear output da IA. Tente novamente.', 500)
  }

  // Salvar adaptações
  const results = await saveAdaptations({
    contentPieceId: params.id,
    workspaceId: workspace_id,
    output: parsed,
    channels,
  })

  await logActivity({
    workspaceId: workspace_id,
    action: 'content.adapted',
    entityType: 'content_piece',
    entityId: params.id,
    details: {
      channels,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
      },
    },
  })

  return apiSuccess({
    adaptations: results,
    usage: message.usage,
  })
})
