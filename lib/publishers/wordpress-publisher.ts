// Publicação via WordPress REST API — cria post com título, corpo, tags e imagem

import { logger } from '@/lib/logger'
import type { PublishResult } from '@/types'

interface WordPressPublishInput {
  title: string
  body_html: string
  meta_description?: string
  focus_keyword?: string
  tags?: string[]
  status?: 'publish' | 'draft' | 'future'
  date?: string
}

interface WordPressConfig {
  site_url: string
  username: string
  password: string
}

/** Publica ou agenda um post no WordPress via REST API */
export async function publishToWordPress(
  input: WordPressPublishInput,
  config?: WordPressConfig
): Promise<PublishResult> {
  const siteUrl = config?.site_url || process.env.WP_SITE_URL
  const username = config?.username || process.env.WP_APP_USERNAME
  const password = config?.password || process.env.WP_APP_PASSWORD

  if (!siteUrl || !username || !password) {
    return { success: false, error: 'WordPress não configurado' }
  }

  try {
    // Resolver IDs de tags (criar se não existirem)
    const tagIds = input.tags ? await resolveTagIds(siteUrl, username, password, input.tags) : []

    const postData: Record<string, unknown> = {
      title: input.title,
      content: input.body_html,
      status: input.status ?? 'draft',
      excerpt: input.meta_description ?? '',
      tags: tagIds,
    }

    if (input.date && input.status === 'future') {
      postData.date = input.date
    }

    const response = await fetch(`${siteUrl}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
      },
      body: JSON.stringify(postData),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      logger.error('WordPress publish failed', { status: response.status, body: errorBody })
      return { success: false, error: `WordPress API ${response.status}: ${errorBody.slice(0, 200)}` }
    }

    const result = await response.json()

    logger.info('WordPress post created', { postId: result.id, link: result.link })

    return {
      success: true,
      publishId: String(result.id),
      publishedUrl: result.link,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'WordPress publish error'
    logger.error('WordPress publish exception', { error: message })
    return { success: false, error: message }
  }
}

async function resolveTagIds(
  siteUrl: string,
  username: string,
  password: string,
  tags: string[]
): Promise<number[]> {
  const auth = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
  const ids: number[] = []

  for (const tag of tags.slice(0, 10)) {
    try {
      // Buscar tag existente
      const searchRes = await fetch(
        `${siteUrl}/wp-json/wp/v2/tags?search=${encodeURIComponent(tag)}`,
        { headers: { Authorization: auth } }
      )
      const existing = await searchRes.json()

      if (Array.isArray(existing) && existing.length > 0) {
        ids.push(existing[0].id)
      } else {
        // Criar tag
        const createRes = await fetch(`${siteUrl}/wp-json/wp/v2/tags`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: auth },
          body: JSON.stringify({ name: tag }),
        })
        if (createRes.ok) {
          const created = await createRes.json()
          ids.push(created.id)
        }
      }
    } catch {
      logger.warn('Failed to resolve tag', { tag })
    }
  }

  return ids
}
