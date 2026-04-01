// GET métricas do YouTube via Data API v3

import { NextRequest } from 'next/server'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response'
import { logger } from '@/lib/logger'

const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspace_id')
  const days = parseInt(searchParams.get('days') ?? '30')

  if (!workspaceId) {
    return apiError('workspace_id é obrigatório', 400)
  }

  const accessToken = await getAccessToken()

  if (!accessToken) {
    return apiSuccess({
      channel: 'youtube',
      period: `${days} dias`,
      message: 'YouTube não configurado',
      metrics: { subscribers: 0, views: 0, watch_time_hours: 0, top_videos: [] },
    })
  }

  try {
    // Buscar dados do canal
    const channelRes = await fetch(
      `${YOUTUBE_API}/channels?part=statistics&mine=true`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const channelData = channelRes.ok ? await channelRes.json() : { items: [] }
    const stats = channelData.items?.[0]?.statistics ?? {}

    // Buscar vídeos recentes
    const videosRes = await fetch(
      `${YOUTUBE_API}/search?part=snippet&forMine=true&type=video&maxResults=10&order=date`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const videosData = videosRes.ok ? await videosRes.json() : { items: [] }

    const videoIds = (videosData.items ?? []).map((v: Record<string, Record<string, string>>) => v.id?.videoId).filter(Boolean)

    let topVideos: Array<{ id: string; title: string; views: number; watch_time: number }> = []
    if (videoIds.length > 0) {
      const statsRes = await fetch(
        `${YOUTUBE_API}/videos?part=statistics,snippet&id=${videoIds.join(',')}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      const statsData = statsRes.ok ? await statsRes.json() : { items: [] }

      topVideos = (statsData.items ?? []).map((v: Record<string, Record<string, string>>) => ({
        id: v.id as unknown as string,
        title: v.snippet?.title ?? '',
        views: parseInt(v.statistics?.viewCount ?? '0'),
        watch_time: 0,
      }))
    }

    return apiSuccess({
      channel: 'youtube',
      period: `${days} dias`,
      metrics: {
        subscribers: parseInt(stats.subscriberCount ?? '0'),
        views: parseInt(stats.viewCount ?? '0'),
        watch_time_hours: 0,
        avg_view_duration: 0,
        ctr: 0,
        top_videos: topVideos.slice(0, 5),
      },
    })
  } catch (error) {
    logger.error('YouTube analytics error', { error: (error as Error).message })
    return apiSuccess({
      channel: 'youtube',
      period: `${days} dias`,
      metrics: { subscribers: 0, views: 0, watch_time_hours: 0, top_videos: [] },
    })
  }
})

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN
  if (!clientId || !clientSecret || !refreshToken) return null

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId, client_secret: clientSecret,
        refresh_token: refreshToken, grant_type: 'refresh_token',
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.access_token ?? null
  } catch { return null }
}
