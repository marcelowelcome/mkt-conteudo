// POST adapta conteúdo / PATCH atualiza status da adaptação

import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response'
import { buildAdaptationPrompt } from '@/lib/content/prompt-builder'
import { parseAdaptationOutput } from '@/lib/content/content-parser'
import { saveAdaptations } from '@/lib/content/channel-adapters'
import { logActivity } from '@/lib/activity'
import { sendTelegramMessage } from '@/lib/telegram'
import { CLAUDE_CONFIG } from '@/lib/constants'
import { logger } from '@/lib/logger'
import type { Channel, ContentPiece, AdaptationStatus } from '@/types'

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

  const { systemPrompt, userPrompt } = await buildAdaptationPrompt(
    content as ContentPiece, channels, workspace_id
  )

  logger.info('Starting adaptation', { contentId: params.id, channels })

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

  const parsed = parseAdaptationOutput(rawOutput)
  if (!parsed) {
    return apiError('Falha ao parsear output da IA. Tente novamente.', 500)
  }

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
    details: { channels, usage: message.usage },
  })

  return apiSuccess({ adaptations: results, usage: message.usage })
})

export const PATCH = withErrorHandler(async (
  request: NextRequest,
) => {
  const body = await request.json()
  const { adaptation_id, status, analyst_notes, workspace_id } = body as {
    adaptation_id: string
    status?: AdaptationStatus
    analyst_notes?: string
    workspace_id: string
  }

  if (!adaptation_id || !workspace_id) {
    return apiError('adaptation_id e workspace_id são obrigatórios', 400)
  }

  const supabase = createServerSupabaseClient()

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (status) updates.status = status
  if (analyst_notes !== undefined) updates.analyst_notes = analyst_notes

  const { data, error } = await supabase
    .from('content_adaptations')
    .update(updates)
    .eq('id', adaptation_id)
    .eq('workspace_id', workspace_id)
    .select('*, content_pieces(title)')
    .single()

  if (error || !data) {
    return apiError('Adaptação não encontrada', 404)
  }

  const title = (data.content_pieces as { title: string } | null)?.title ?? ''

  await logActivity({
    workspaceId: workspace_id,
    action: `adaptation.${status?.toLowerCase() ?? 'updated'}`,
    entityType: 'content_adaptation',
    entityId: adaptation_id,
    details: { channel: data.channel, status, title },
  })

  // Notificação Telegram em mudança de status
  if (status) {
    const emoji = status === 'APPROVED' ? '✅' : '🔄'
    await sendTelegramMessage(
      `${emoji} <b>${data.channel}</b> — ${title}\nStatus: <b>${status}</b>${analyst_notes ? `\nNota: ${analyst_notes}` : ''}`
    )
  }

  return apiSuccess(data)
})
