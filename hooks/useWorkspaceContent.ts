// Hook para CRUD de conteúdos do workspace — fetch, create, update, delete

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ContentPiece, ContentStatus, Channel } from '@/types'

interface UseWorkspaceContentOptions {
  workspaceId: string
  status?: ContentStatus
  channel?: Channel
  search?: string
  page?: number
  limit?: number
}

interface ContentResponse {
  items: ContentPiece[]
  total: number
  page: number
  limit: number
}

export function useWorkspaceContent(options: UseWorkspaceContentOptions) {
  const [data, setData] = useState<ContentResponse>({ items: [], total: 0, page: 1, limit: 20 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { workspaceId, status, channel, search, page = 1, limit = 20 } = options

  const fetchContent = useCallback(async () => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({ workspace_id: workspaceId, page: String(page), limit: String(limit) })
    if (status) params.set('status', status)
    if (channel) params.set('channel', channel)
    if (search) params.set('search', search)

    const res = await fetch(`/api/content?${params}`)
    const json = await res.json()

    if (!json.success) {
      setError(json.error ?? 'Erro ao carregar conteúdos')
      setLoading(false)
      return
    }

    setData(json.data)
    setLoading(false)
  }, [workspaceId, status, channel, search, page, limit])

  useEffect(() => {
    fetchContent()
  }, [fetchContent])

  async function createContent(input: {
    title: string
    subtitle?: string
    body?: string
    keywords?: string[]
    target_persona?: string
    target_channels?: string[]
  }) {
    const res = await fetch('/api/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace_id: workspaceId, ...input }),
    })
    const json = await res.json()
    if (json.success) {
      await fetchContent()
    }
    return json
  }

  async function updateContent(id: string, updates: Partial<ContentPiece>) {
    const res = await fetch(`/api/content/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    const json = await res.json()
    if (json.success) {
      await fetchContent()
    }
    return json
  }

  async function deleteContent(id: string) {
    const res = await fetch(`/api/content/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.success) {
      await fetchContent()
    }
    return json
  }

  return {
    ...data,
    loading,
    error,
    refresh: fetchContent,
    createContent,
    updateContent,
    deleteContent,
  }
}
