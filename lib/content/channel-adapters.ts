// Lógica de adaptação por canal — salva adaptações no banco

import { createServerSupabaseClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { Channel, ContentAdaptationOutput } from '@/types'

interface SaveAdaptationsParams {
  contentPieceId: string
  workspaceId: string
  output: ContentAdaptationOutput
  channels: Channel[]
}

/** Salva as adaptações geradas pela IA no banco */
export async function saveAdaptations(params: SaveAdaptationsParams) {
  const { contentPieceId, workspaceId, output, channels } = params
  const supabase = createServerSupabaseClient()
  const results: Array<{ channel: Channel; success: boolean; id?: string }> = []

  for (const channel of channels) {
    const channelOutput = output[channel]
    if (!channelOutput) {
      logger.warn('No output for channel', { channel, contentPieceId })
      results.push({ channel, success: false })
      continue
    }

    // Upsert: se já existe adaptação para esse content+canal, atualiza
    const { data: existing } = await supabase
      .from('content_adaptations')
      .select('id')
      .eq('content_piece_id', contentPieceId)
      .eq('channel', channel)
      .single()

    if (existing) {
      const { error } = await supabase
        .from('content_adaptations')
        .update({
          ai_output: channelOutput,
          status: 'PENDING',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      results.push({ channel, success: !error, id: existing.id })
    } else {
      const { data, error } = await supabase
        .from('content_adaptations')
        .insert({
          content_piece_id: contentPieceId,
          workspace_id: workspaceId,
          channel,
          ai_output: channelOutput,
          status: 'PENDING',
        })
        .select('id')
        .single()

      results.push({ channel, success: !error, id: data?.id })
    }
  }

  logger.info('Adaptations saved', {
    contentPieceId,
    results: results.map((r) => `${r.channel}:${r.success ? 'ok' : 'fail'}`),
  })

  return results
}

/** Busca adaptações de um conteúdo */
export async function getAdaptations(contentPieceId: string) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('content_adaptations')
    .select('*')
    .eq('content_piece_id', contentPieceId)
    .order('created_at', { ascending: true })

  if (error) {
    logger.error('Failed to fetch adaptations', { error: error.message })
    return []
  }

  return data
}
