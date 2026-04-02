// POST publica no ActiveCampaign — cria campanha de email

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response'
import { publishToActiveCampaign } from '@/lib/publishers/activecampaign-publisher'
import { getChannelConfig } from '@/lib/channel-config'
import { logActivity } from '@/lib/activity'
import type { EmailAdaptation } from '@/types'

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { adaptation_id, workspace_id } = body

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

  const output = adaptation.ai_output as EmailAdaptation | null
  if (!output) {
    return apiError('Adaptação sem dados de conteúdo', 400)
  }

  const channelConfig = await getChannelConfig(workspace_id, 'email')

  const result = await publishToActiveCampaign({
    subject: adaptation.subject_edited ?? output.subject_a,
    preheader: output.preheader,
    body_html: adaptation.body_edited ?? output.body_html,
    cta_text: adaptation.cta_edited ?? output.cta_text,
    cta_url: output.cta_url,
    list_segment: output.list_segment,
  }, {
    api_key: channelConfig.api_key,
    api_url: channelConfig.api_url,
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
      action: 'publish.activecampaign',
      entityType: 'content_adaptation',
      entityId: adaptation_id,
      details: { publishId: result.publishId },
    })
  }

  return result.success ? apiSuccess(result) : apiError(result.error ?? 'Falha na publicação', 500)
})
