// Publicação via LinkedIn API v2 — post de texto e artigos

import { logger } from '@/lib/logger'
import type { PublishResult } from '@/types'

interface LinkedInPublishInput {
  text: string
  article_url?: string
  article_title?: string
  article_description?: string
}

const LINKEDIN_API = 'https://api.linkedin.com/v2'

interface LinkedInConfig {
  access_token: string
  organization_id: string
}

/** Publica post no LinkedIn via API v2 */
export async function publishToLinkedIn(
  input: LinkedInPublishInput,
  config?: LinkedInConfig
): Promise<PublishResult> {
  const accessToken = config?.access_token || process.env.LINKEDIN_ACCESS_TOKEN
  const orgId = config?.organization_id || process.env.LINKEDIN_ORGANIZATION_ID

  if (!accessToken || !orgId) {
    return { success: false, error: 'LinkedIn não configurado' }
  }

  try {
    const author = `urn:li:organization:${orgId}`

    const shareContent: Record<string, unknown> = {
      shareCommentary: { text: input.text },
      shareMediaCategory: 'NONE',
    }

    // Se tem artigo/link, adicionar como media
    if (input.article_url) {
      shareContent.shareMediaCategory = 'ARTICLE'
      shareContent.media = [
        {
          status: 'READY',
          originalUrl: input.article_url,
          title: { text: input.article_title ?? '' },
          description: { text: input.article_description ?? '' },
        },
      ]
    }

    const postData = {
      author,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': shareContent,
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    }

    const res = await fetch(`${LINKEDIN_API}/ugcPosts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postData),
    })

    if (!res.ok) {
      const error = await res.text()
      logger.error('LinkedIn publish failed', { status: res.status, error })
      return { success: false, error: `LinkedIn ${res.status}: ${error.slice(0, 200)}` }
    }

    const postId = res.headers.get('x-restli-id') ?? ''
    logger.info('LinkedIn post published', { postId })

    return {
      success: true,
      publishId: postId,
      publishedUrl: `https://www.linkedin.com/feed/update/${postId}/`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'LinkedIn publish error'
    logger.error('LinkedIn publish exception', { error: message })
    return { success: false, error: message }
  }
}
