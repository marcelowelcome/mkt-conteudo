// GET métricas do LinkedIn via API v2

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

  const token = process.env.LINKEDIN_ACCESS_TOKEN
  const orgId = process.env.LINKEDIN_ORGANIZATION_ID

  if (!token || !orgId) {
    return apiSuccess({
      channel: 'linkedin',
      period: `${days} dias`,
      message: 'LinkedIn não configurado',
      metrics: { followers: 0, impressions: 0, engagement_rate: 0, top_posts: [] },
    })
  }

  try {
    // Buscar followers
    const followersRes = await fetch(
      `https://api.linkedin.com/v2/networkSizes/urn:li:organization:${orgId}?edgeType=CompanyFollowedByMember`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const followersData = followersRes.ok ? await followersRes.json() : {}

    // Buscar posts recentes
    const postsRes = await fetch(
      `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn:li:organization:${orgId})&count=10`,
      { headers: { Authorization: `Bearer ${token}`, 'X-Restli-Protocol-Version': '2.0.0' } }
    )
    const postsData = postsRes.ok ? await postsRes.json() : { elements: [] }

    return apiSuccess({
      channel: 'linkedin',
      period: `${days} dias`,
      metrics: {
        followers: followersData.firstDegreeSize ?? 0,
        impressions: 0,
        click_rate: 0,
        engagement_rate: 0,
        top_posts: (postsData.elements ?? []).slice(0, 5).map((p: Record<string, unknown>) => ({
          id: p.id,
          impressions: 0,
          clicks: 0,
        })),
      },
    })
  } catch (error) {
    logger.error('LinkedIn analytics error', { error: (error as Error).message })
    return apiSuccess({
      channel: 'linkedin',
      period: `${days} dias`,
      metrics: { followers: 0, impressions: 0, engagement_rate: 0, top_posts: [] },
    })
  }
})
