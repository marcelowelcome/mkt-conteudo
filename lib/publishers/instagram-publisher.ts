// Publicação via Meta Graph API v21.0 — IMAGE, CAROUSEL, REEL

import { logger } from '@/lib/logger'
import type { PublishResult } from '@/types'

interface InstagramPublishInput {
  caption: string
  image_url?: string
  carousel_urls?: string[]
  media_type?: 'IMAGE' | 'CAROUSEL' | 'REELS'
  video_url?: string
}

const GRAPH_API = 'https://graph.facebook.com/v21.0'

/** Publica no Instagram via Meta Graph API */
export async function publishToInstagram(input: InstagramPublishInput): Promise<PublishResult> {
  const accessToken = process.env.META_ACCESS_TOKEN
  const igUserId = process.env.META_IG_USER_ID

  if (!accessToken || !igUserId) {
    return { success: false, error: 'Instagram não configurado (META_ACCESS_TOKEN ou META_IG_USER_ID ausente)' }
  }

  const mediaType = input.media_type ?? 'IMAGE'

  try {
    let containerId: string

    if (mediaType === 'CAROUSEL' && input.carousel_urls?.length) {
      containerId = await createCarousel(igUserId, accessToken, input.caption, input.carousel_urls)
    } else if (mediaType === 'REELS' && input.video_url) {
      containerId = await createMediaContainer(igUserId, accessToken, {
        caption: input.caption,
        video_url: input.video_url,
        media_type: 'REELS',
      })
    } else if (input.image_url) {
      containerId = await createMediaContainer(igUserId, accessToken, {
        caption: input.caption,
        image_url: input.image_url,
      })
    } else {
      return { success: false, error: 'image_url, carousel_urls ou video_url é obrigatório' }
    }

    // Poll até container estar pronto
    await waitForContainer(containerId, accessToken)

    // Publicar
    const publishRes = await fetch(`${GRAPH_API}/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    })

    if (!publishRes.ok) {
      const error = await publishRes.text()
      logger.error('Instagram publish failed', { status: publishRes.status, error })
      return { success: false, error: `Instagram publish: ${error.slice(0, 200)}` }
    }

    const result = await publishRes.json()
    logger.info('Instagram published', { mediaId: result.id })

    return {
      success: true,
      publishId: result.id,
      publishedUrl: `https://www.instagram.com/p/${result.id}/`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Instagram publish error'
    logger.error('Instagram publish exception', { error: message })
    return { success: false, error: message }
  }
}

async function createMediaContainer(
  userId: string,
  token: string,
  params: Record<string, string>
): Promise<string> {
  const res = await fetch(`${GRAPH_API}/${userId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...params, access_token: token }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Container creation failed: ${error.slice(0, 200)}`)
  }

  const data = await res.json()
  return data.id
}

async function createCarousel(
  userId: string,
  token: string,
  caption: string,
  imageUrls: string[]
): Promise<string> {
  // Criar containers individuais para cada item
  const childIds: string[] = []
  for (const url of imageUrls.slice(0, 10)) {
    const id = await createMediaContainer(userId, token, {
      image_url: url,
      is_carousel_item: 'true',
    })
    childIds.push(id)
  }

  // Criar container do carousel
  const res = await fetch(`${GRAPH_API}/${userId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'CAROUSEL',
      caption,
      children: childIds.join(','),
      access_token: token,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Carousel creation failed: ${error.slice(0, 200)}`)
  }

  const data = await res.json()
  return data.id
}

async function waitForContainer(containerId: string, token: string, maxRetries = 20): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    const res = await fetch(
      `${GRAPH_API}/${containerId}?fields=status_code&access_token=${token}`
    )
    const data = await res.json()

    if (data.status_code === 'FINISHED') return
    if (data.status_code === 'ERROR') {
      throw new Error(`Container processing failed: ${JSON.stringify(data)}`)
    }

    // Aguardar 3 segundos entre polls
    await new Promise((resolve) => setTimeout(resolve, 3000))
  }
  throw new Error('Container processing timeout')
}
