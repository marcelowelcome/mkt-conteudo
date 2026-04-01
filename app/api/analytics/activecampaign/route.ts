// GET métricas de email do ActiveCampaign

import { NextRequest } from 'next/server'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response'
import { logger } from '@/lib/logger'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspace_id')
  const days = parseInt(searchParams.get('days') ?? '30')

  if (!workspaceId) {
    return apiError('workspace_id é obrigatório', 400)
  }

  const apiKey = process.env.AC_API_KEY
  const apiUrl = process.env.AC_API_URL

  if (!apiKey || !apiUrl) {
    return apiSuccess({
      channel: 'email',
      period: `${days} dias`,
      message: 'ActiveCampaign não configurado',
      metrics: { campaigns_sent: 0, open_rate: 0, click_rate: 0, top_campaigns: [] },
    })
  }

  try {
    const res = await fetch(`${apiUrl}/api/3/campaigns?orders[sdate]=DESC&limit=10`, {
      headers: { 'Api-Token': apiKey },
    })

    if (!res.ok) {
      logger.error('AC analytics failed', { status: res.status })
      return apiSuccess({
        channel: 'email',
        period: `${days} dias`,
        metrics: { campaigns_sent: 0, open_rate: 0, click_rate: 0, top_campaigns: [] },
      })
    }

    const data = await res.json()
    const campaigns = data.campaigns ?? []

    return apiSuccess({
      channel: 'email',
      period: `${days} dias`,
      metrics: {
        campaigns_sent: campaigns.length,
        open_rate: 0,
        click_rate: 0,
        top_campaigns: campaigns.slice(0, 5).map((c: Record<string, string>) => ({
          name: c.name,
          opens: parseInt(c.opens ?? '0'),
          clicks: parseInt(c.clicks ?? '0'),
        })),
      },
    })
  } catch (error) {
    logger.error('AC analytics error', { error: (error as Error).message })
    return apiSuccess({
      channel: 'email',
      period: `${days} dias`,
      metrics: { campaigns_sent: 0, open_rate: 0, click_rate: 0, top_campaigns: [] },
    })
  }
})
