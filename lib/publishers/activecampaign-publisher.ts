// Publicação via ActiveCampaign API — cria campanha de email

import { logger } from '@/lib/logger'
import type { PublishResult } from '@/types'

interface ActiveCampaignPublishInput {
  subject: string
  preheader?: string
  body_html: string
  cta_text?: string
  cta_url?: string
  list_segment?: string
}

interface ActiveCampaignConfig {
  api_key: string
  api_url: string
}

/** Cria uma campanha no ActiveCampaign */
export async function publishToActiveCampaign(
  input: ActiveCampaignPublishInput,
  config?: ActiveCampaignConfig
): Promise<PublishResult> {
  const apiKey = config?.api_key || process.env.AC_API_KEY
  const apiUrl = config?.api_url || process.env.AC_API_URL

  if (!apiKey || !apiUrl) {
    return { success: false, error: 'ActiveCampaign não configurado' }
  }

  const baseUrl = `${apiUrl}/api/3`

  try {
    // 1. Criar campanha
    const campaignRes = await fetch(`${baseUrl}/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Token': apiKey,
      },
      body: JSON.stringify({
        campaign: {
          type: 'single',
          name: input.subject,
          sdate: new Date().toISOString(),
          status: 0, // 0 = draft
        },
      }),
    })

    if (!campaignRes.ok) {
      const errorBody = await campaignRes.text()
      logger.error('AC campaign creation failed', { status: campaignRes.status, body: errorBody })
      return { success: false, error: `ActiveCampaign ${campaignRes.status}: ${errorBody.slice(0, 200)}` }
    }

    const campaignData = await campaignRes.json()
    const campaignId = campaignData.campaign?.id

    if (!campaignId) {
      return { success: false, error: 'ActiveCampaign: ID da campanha não retornado' }
    }

    // 2. Criar mensagem da campanha
    const messageRes = await fetch(`${baseUrl}/campaigns/${campaignId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Token': apiKey,
      },
      body: JSON.stringify({
        message: {
          subject: input.subject,
          preheader_text: input.preheader ?? '',
          html: input.body_html,
        },
      }),
    })

    if (!messageRes.ok) {
      const errorBody = await messageRes.text()
      logger.error('AC message creation failed', { status: messageRes.status, body: errorBody })
      return { success: false, error: `ActiveCampaign message: ${errorBody.slice(0, 200)}` }
    }

    logger.info('ActiveCampaign campaign created', { campaignId })

    return {
      success: true,
      publishId: String(campaignId),
      publishedUrl: `${apiUrl}/app/campaigns/${campaignId}`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ActiveCampaign publish error'
    logger.error('AC publish exception', { error: message })
    return { success: false, error: message }
  }
}
