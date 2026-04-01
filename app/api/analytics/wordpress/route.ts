// GET métricas do blog WordPress (Google Analytics API)

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

  // TODO: Integrar com Google Analytics Data API (GA4)
  // Por enquanto, buscar dados de publicações do banco
  logger.info('WordPress analytics requested', { workspaceId, days })

  return apiSuccess({
    channel: 'wordpress',
    period: `${days} dias`,
    message: 'Google Analytics API será integrada quando configurada',
    metrics: {
      page_views: 0,
      unique_visitors: 0,
      avg_time_on_page: 0,
      bounce_rate: 0,
      top_posts: [],
    },
  })
})
