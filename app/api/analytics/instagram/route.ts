// GET métricas do Instagram via Meta Graph API

import { NextRequest } from 'next/server'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response'
import { logger } from '@/lib/logger'

const GRAPH_API = 'https://graph.facebook.com/v21.0'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspace_id')
  const days = parseInt(searchParams.get('days') ?? '30')

  if (!workspaceId) {
    return apiError('workspace_id é obrigatório', 400)
  }

  const token = process.env.META_ACCESS_TOKEN
  const igUserId = process.env.META_IG_USER_ID

  if (!token || !igUserId) {
    return apiSuccess({
      channel: 'instagram',
      period: `${days} dias`,
      message: 'Instagram não configurado',
      metrics: { followers: 0, reach: 0, engagement_rate: 0, top_posts: [] },
    })
  }

  try {
    // Buscar métricas do perfil
    const profileRes = await fetch(
      `${GRAPH_API}/${igUserId}?fields=followers_count,media_count&access_token=${token}`
    )
    const profile = profileRes.ok ? await profileRes.json() : {}

    // Buscar insights do período (v21.0)
    const since = Math.floor((Date.now() - days * 86400000) / 1000)
    const until = Math.floor(Date.now() / 1000)

    const insightsRes = await fetch(
      `${GRAPH_API}/${igUserId}/insights?metric=reach,accounts_engaged&period=day&since=${since}&until=${until}&access_token=${token}`
    )
    const insights = insightsRes.ok ? await insightsRes.json() : { data: [] }

    // Calcular totais
    let totalReach = 0
    let totalEngaged = 0
    for (const metric of insights.data ?? []) {
      const values = metric.values ?? []
      const sum = values.reduce((acc: number, v: { value: number }) => acc + (v.value ?? 0), 0)
      if (metric.name === 'reach') totalReach = sum
      if (metric.name === 'accounts_engaged') totalEngaged = sum
    }

    // Buscar posts recentes
    const mediaRes = await fetch(
      `${GRAPH_API}/${igUserId}/media?fields=id,caption,like_count,comments_count,timestamp&limit=10&access_token=${token}`
    )
    const media = mediaRes.ok ? await mediaRes.json() : { data: [] }

    const topPosts = (media.data ?? []).map((p: Record<string, unknown>) => ({
      id: p.id,
      caption: String(p.caption ?? '').slice(0, 80),
      reach: 0,
      engagement: ((p.like_count as number) ?? 0) + ((p.comments_count as number) ?? 0),
    }))

    return apiSuccess({
      channel: 'instagram',
      period: `${days} dias`,
      metrics: {
        followers: profile.followers_count ?? 0,
        reach: totalReach,
        engagement_rate: totalReach > 0 ? (totalEngaged / totalReach) * 100 : 0,
        saves: 0,
        shares: 0,
        top_posts: topPosts.slice(0, 5),
      },
    })
  } catch (error) {
    logger.error('Instagram analytics error', { error: (error as Error).message })
    return apiSuccess({
      channel: 'instagram',
      period: `${days} dias`,
      metrics: { followers: 0, reach: 0, engagement_rate: 0, top_posts: [] },
    })
  }
})
