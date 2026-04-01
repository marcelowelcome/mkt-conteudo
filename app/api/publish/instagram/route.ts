// POST publica no Instagram via adaptação

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response'
import { publishToInstagram } from '@/lib/publishers/instagram-publisher'
import { logActivity } from '@/lib/activity'
import type { InstagramAdaptation } from '@/types'

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { adaptation_id, workspace_id, image_url, carousel_urls, video_url, media_type } = body

  if (!adaptation_id || !workspace_id) {
    return apiError('adaptation_id e workspace_id são obrigatórios', 400)
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

  const output = adaptation.ai_output as InstagramAdaptation | null
  if (!output) {
    return apiError('Adaptação sem dados de conteúdo', 400)
  }

  const caption = adaptation.body_edited ?? output.caption
  const rawHashtags = adaptation.hashtags_edited ?? output.hashtags
  const hashtags = Array.isArray(rawHashtags) ? rawHashtags : []
  const hashtagStr = hashtags.map((h: string) => `#${h.replace('#', '')}`).join(' ')
  const fullCaption = hashtagStr ? `${caption}\n\n${hashtagStr}` : caption

  const result = await publishToInstagram({
    caption: fullCaption,
    image_url,
    carousel_urls,
    video_url,
    media_type: media_type ?? 'IMAGE',
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
      action: 'publish.instagram',
      entityType: 'content_adaptation',
      entityId: adaptation_id,
      details: { publishId: result.publishId, mediaType: media_type },
    })
  }

  return result.success ? apiSuccess(result) : apiError(result.error ?? 'Falha', 500)
})
