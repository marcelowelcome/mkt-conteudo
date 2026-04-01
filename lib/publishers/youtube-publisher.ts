// Atualização de metadados via YouTube Data API v3 — descrição, tags, título

import { logger } from '@/lib/logger'
import type { PublishResult } from '@/types'

interface YouTubePublishInput {
  video_id: string
  title?: string
  description: string
  tags?: string[]
  category_id?: string
}

const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3'

/** Atualiza metadados de um vídeo no YouTube */
export async function publishToYouTube(input: YouTubePublishInput): Promise<PublishResult> {
  const accessToken = await getAccessToken()

  if (!accessToken) {
    return { success: false, error: 'YouTube não configurado (credenciais Google ausentes)' }
  }

  try {
    // Buscar dados atuais do vídeo
    const getRes = await fetch(
      `${YOUTUBE_API}/videos?part=snippet&id=${input.video_id}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!getRes.ok) {
      const error = await getRes.text()
      return { success: false, error: `YouTube GET: ${error.slice(0, 200)}` }
    }

    const videoData = await getRes.json()
    if (!videoData.items?.length) {
      return { success: false, error: 'Vídeo não encontrado no YouTube' }
    }

    const snippet = videoData.items[0].snippet

    // Atualizar metadados
    const updateData = {
      id: input.video_id,
      snippet: {
        ...snippet,
        title: input.title ?? snippet.title,
        description: input.description,
        tags: input.tags ?? snippet.tags,
        categoryId: input.category_id ?? snippet.categoryId,
      },
    }

    const updateRes = await fetch(`${YOUTUBE_API}/videos?part=snippet`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(updateData),
    })

    if (!updateRes.ok) {
      const error = await updateRes.text()
      logger.error('YouTube update failed', { status: updateRes.status, error })
      return { success: false, error: `YouTube PUT: ${error.slice(0, 200)}` }
    }

    const result = await updateRes.json()
    logger.info('YouTube video updated', { videoId: result.id })

    return {
      success: true,
      publishId: result.id,
      publishedUrl: `https://www.youtube.com/watch?v=${result.id}`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'YouTube publish error'
    logger.error('YouTube publish exception', { error: message })
    return { success: false, error: message }
  }
}

/** Obtém access token via refresh token do Google OAuth */
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
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!res.ok) return null

    const data = await res.json()
    return data.access_token ?? null
  } catch {
    return null
  }
}
