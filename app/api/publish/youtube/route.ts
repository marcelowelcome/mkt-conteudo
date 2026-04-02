// POST atualiza metadados de vídeo no YouTube via adaptação

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response'
import { publishToYouTube } from '@/lib/publishers/youtube-publisher'
import { getChannelConfig } from '@/lib/channel-config'
import { logActivity } from '@/lib/activity'
import type { YouTubeAdaptation } from '@/types'

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { adaptation_id, workspace_id, video_id } = body

  if (!adaptation_id || !workspace_id || !video_id) {
    return apiError('adaptation_id, workspace_id e video_id são obrigatórios', 400)
  }

  const supabase = createServerSupabaseClient()

  const { data: adaptation, error } = await supabase
    .from('content_adaptations')
    .select('*')
    .eq('id', adaptation_id)
    .eq('workspace_id', workspace_id)
    .single()

  if (error || !adaptation) {
    return apiError('Adaptação não encontrada', 404)
  }

  const output = adaptation.ai_output as YouTubeAdaptation | null
  if (!output) {
    return apiError('Adaptação sem dados de conteúdo', 400)
  }

  const channelConfig = await getChannelConfig(workspace_id, 'youtube')

  const result = await publishToYouTube({
    video_id,
    title: adaptation.title_edited ?? undefined,
    description: adaptation.body_edited ?? output.description,
    tags: output.tags,
  }, {
    client_id: channelConfig.client_id,
    client_secret: channelConfig.client_secret,
    refresh_token: channelConfig.refresh_token,
  })

  await supabase
    .from('content_adaptations')
    .update({
      published_at: result.success ? new Date().toISOString() : null,
      publish_id: result.publishId ?? null,
      publish_error: result.error ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', adaptation_id)

  if (result.success) {
    await logActivity({
      workspaceId: workspace_id,
      action: 'publish.youtube',
      entityType: 'content_adaptation',
      entityId: adaptation_id,
      details: { publishId: result.publishId, videoId: video_id },
    })
  }

  return result.success ? apiSuccess(result) : apiError(result.error ?? 'Falha', 500)
})
