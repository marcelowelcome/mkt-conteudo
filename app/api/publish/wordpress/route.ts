// POST publica no WordPress — recebe adaptation_id ou dados diretos

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response'
import { publishToWordPress } from '@/lib/publishers/wordpress-publisher'
import { getChannelConfig } from '@/lib/channel-config'
import { logActivity } from '@/lib/activity'
import type { WordPressAdaptation } from '@/types'

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { adaptation_id, workspace_id, status } = body

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

  const output = adaptation.ai_output as WordPressAdaptation | null
  if (!output) {
    return apiError('Adaptação sem dados de conteúdo', 400)
  }

  const channelConfig = await getChannelConfig(workspace_id, 'wordpress')

  const result = await publishToWordPress({
    title: adaptation.title_edited ?? output.title,
    body_html: adaptation.body_edited ?? output.body_html,
    meta_description: output.meta_description,
    focus_keyword: output.focus_keyword,
    tags: output.tags,
    status: status ?? 'draft',
  }, {
    site_url: channelConfig.site_url,
    username: channelConfig.username,
    password: channelConfig.password,
  })

  // Atualizar adaptação com resultado
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
      action: 'publish.wordpress',
      entityType: 'content_adaptation',
      entityId: adaptation_id,
      details: { publishId: result.publishId, url: result.publishedUrl },
    })
  }

  return result.success ? apiSuccess(result) : apiError(result.error ?? 'Falha na publicação', 500)
})
