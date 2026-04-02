// GET lista log de atividades do workspace com paginação

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspace_id')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '50')

  if (!workspaceId) return apiError('workspace_id é obrigatório', 400)

  const supabase = createServerSupabaseClient()
  const from = (page - 1) * limit

  const { data, error, count } = await supabase
    .from('activity_log')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (error) return apiError(error.message, 500)

  return apiSuccess({ items: data, total: count ?? 0, page, limit })
})
