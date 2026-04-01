// GET lista entradas do calendário / POST cria entrada

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response'
import { logActivity } from '@/lib/activity'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspace_id')
  const month = searchParams.get('month') // formato: 2026-04
  const status = searchParams.get('status')

  if (!workspaceId) {
    return apiError('workspace_id é obrigatório', 400)
  }

  const supabase = createServerSupabaseClient()
  let query = supabase
    .from('editorial_calendar')
    .select('*, content_pieces(title, status), content_adaptations(channel, ai_output, status)')
    .eq('workspace_id', workspaceId)
    .order('scheduled_for', { ascending: true })

  if (month) {
    const start = `${month}-01T00:00:00Z`
    const [year, m] = month.split('-').map(Number)
    const end = new Date(year, m, 0, 23, 59, 59).toISOString()
    query = query.gte('scheduled_for', start).lte('scheduled_for', end)
  }

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return apiError(error.message, 500)
  }

  return apiSuccess(data)
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { workspace_id, content_piece_id, adaptation_id, channel, scheduled_for, auto_publish, notes } = body

  if (!workspace_id || !channel || !scheduled_for) {
    return apiError('workspace_id, channel e scheduled_for são obrigatórios', 400)
  }

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('editorial_calendar')
    .insert({
      workspace_id,
      content_piece_id: content_piece_id || null,
      adaptation_id: adaptation_id || null,
      channel,
      scheduled_for,
      auto_publish: auto_publish ?? false,
      notes: notes ?? null,
      status: 'SCHEDULED',
    })
    .select()
    .single()

  if (error) {
    return apiError(error.message, 500)
  }

  await logActivity({
    workspaceId: workspace_id,
    action: 'calendar.created',
    entityType: 'editorial_calendar',
    entityId: data.id,
    details: { channel, scheduled_for },
  })

  return apiSuccess(data, { status: 201 })
})
