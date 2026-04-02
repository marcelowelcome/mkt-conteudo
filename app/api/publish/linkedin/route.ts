// POST publica no LinkedIn via adaptação

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response'
import { publishToLinkedIn } from '@/lib/publishers/linkedin-publisher'
import { getChannelConfig } from '@/lib/channel-config'
import { logActivity } from '@/lib/activity'
import type { LinkedInAdaptation } from '@/types'

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { adaptation_id, workspace_id, article_url } = body

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

  const output = adaptation.ai_output as LinkedInAdaptation | null
  if (!output) {
    return apiError('Adaptação sem dados de conteúdo', 400)
  }

  const channelConfig = await getChannelConfig(workspace_id, 'linkedin')

  const result = await publishToLinkedIn({
    text: adaptation.body_edited ?? output.post_text,
    article_url,
    article_title: adaptation.title_edited ?? undefined,
  }, {
    access_token: channelConfig.access_token,
    organization_id: channelConfig.organization_id,
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
      action: 'publish.linkedin',
      entityType: 'content_adaptation',
      entityId: adaptation_id,
      details: { publishId: result.publishId },
    })
  }

  return result.success ? apiSuccess(result) : apiError(result.error ?? 'Falha', 500)
})
