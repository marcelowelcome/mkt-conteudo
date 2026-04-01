// GET / PATCH / DELETE conteúdo individual por ID — com validação de workspace

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response'
import { logActivity } from '@/lib/activity'
import { VALID_STATUS_TRANSITIONS } from '@/lib/constants'
import type { ContentStatus } from '@/types'

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Record<string, string> }
) => {
  const workspaceId = new URL(request.url).searchParams.get('workspace_id')
  const supabase = createServerSupabaseClient()

  let query = supabase.from('content_pieces').select('*').eq('id', params.id)
  if (workspaceId) query = query.eq('workspace_id', workspaceId)

  const { data, error } = await query.single()

  if (error || !data) {
    return apiError('Conteúdo não encontrado', 404)
  }

  return apiSuccess(data)
})

export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Record<string, string> }
) => {
  const body = await request.json()
  const supabase = createServerSupabaseClient()

  // Buscar conteúdo atual para validação
  const { data: current } = await supabase
    .from('content_pieces')
    .select('status, workspace_id')
    .eq('id', params.id)
    .single()

  if (!current) {
    return apiError('Conteúdo não encontrado', 404)
  }

  // Validar transição de status
  if (body.status) {
    const currentStatus = current.status as ContentStatus
    const newStatus = body.status as ContentStatus
    const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus]

    if (!validTransitions?.includes(newStatus)) {
      return apiError(
        `Transição inválida: ${currentStatus} → ${newStatus}. Permitidas: ${validTransitions?.join(', ')}`,
        400
      )
    }
  }

  // Não permitir mudar workspace_id
  delete body.workspace_id

  const { data, error } = await supabase
    .from('content_pieces')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return apiError(error.message, 500)
  }

  if (body.status) {
    await logActivity({
      workspaceId: data.workspace_id,
      action: `content.status.${body.status.toLowerCase()}`,
      entityType: 'content_piece',
      entityId: data.id,
      details: { status: body.status },
    })
  }

  return apiSuccess(data)
})

export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Record<string, string> }
) => {
  const supabase = createServerSupabaseClient()

  const { data: existing } = await supabase
    .from('content_pieces')
    .select('id, workspace_id, title')
    .eq('id', params.id)
    .single()

  if (!existing) {
    return apiError('Conteúdo não encontrado', 404)
  }

  const { error } = await supabase
    .from('content_pieces')
    .delete()
    .eq('id', params.id)

  if (error) {
    return apiError(error.message, 500)
  }

  await logActivity({
    workspaceId: existing.workspace_id,
    action: 'content.deleted',
    entityType: 'content_piece',
    entityId: existing.id,
    details: { title: existing.title },
  })

  return apiSuccess({ deleted: true })
})
