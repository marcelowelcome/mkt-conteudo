// GET lista conteúdos / POST cria conteúdo — filtrado por workspace

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response'
import { logActivity } from '@/lib/activity'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspace_id')
  const status = searchParams.get('status')
  const channel = searchParams.get('channel')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')

  if (!workspaceId) {
    return apiError('workspace_id é obrigatório', 400)
  }

  const supabase = createServerSupabaseClient()
  let query = supabase
    .from('content_pieces')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }
  if (channel) {
    query = query.contains('target_channels', [channel])
  }
  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  const from = (page - 1) * limit
  query = query.range(from, from + limit - 1)

  const { data, error, count } = await query

  if (error) {
    return apiError(error.message, 500)
  }

  return apiSuccess({
    items: data,
    total: count ?? 0,
    page,
    limit,
  })
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { workspace_id, title, subtitle, body: contentBody, keywords, target_persona, target_channels } = body

  if (!workspace_id || !title) {
    return apiError('workspace_id e title são obrigatórios', 400)
  }

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('content_pieces')
    .insert({
      workspace_id,
      title,
      subtitle: subtitle ?? null,
      body: contentBody ?? null,
      keywords: keywords ?? null,
      target_persona: target_persona ?? null,
      target_channels: target_channels ?? null,
      status: 'DRAFT',
    })
    .select()
    .single()

  if (error) {
    return apiError(error.message, 500)
  }

  await logActivity({
    workspaceId: workspace_id,
    action: 'content.created',
    entityType: 'content_piece',
    entityId: data.id,
    details: { title },
  })

  return apiSuccess(data, { status: 201 })
})
