// POST agenda conteúdo — transiciona para SCHEDULED com data/hora

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response'
import { logActivity } from '@/lib/activity'

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Record<string, string> }
) => {
  const body = await request.json()
  const { scheduled_for } = body

  if (!scheduled_for) {
    return apiError('scheduled_for é obrigatório', 400)
  }

  const scheduledDate = new Date(scheduled_for)
  if (isNaN(scheduledDate.getTime())) {
    return apiError('scheduled_for deve ser uma data válida', 400)
  }

  if (scheduledDate <= new Date()) {
    return apiError('scheduled_for deve ser no futuro', 400)
  }

  const supabase = createServerSupabaseClient()

  const { data: current } = await supabase
    .from('content_pieces')
    .select('id, status, workspace_id, title')
    .eq('id', params.id)
    .single()

  if (!current) {
    return apiError('Conteúdo não encontrado', 404)
  }

  if (current.status !== 'APPROVED') {
    return apiError(`Só conteúdos APPROVED podem ser agendados. Status atual: ${current.status}`, 400)
  }

  const { data, error } = await supabase
    .from('content_pieces')
    .update({
      status: 'SCHEDULED',
      scheduled_for,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return apiError(error.message, 500)
  }

  await logActivity({
    workspaceId: current.workspace_id,
    action: 'content.scheduled',
    entityType: 'content_piece',
    entityId: current.id,
    details: { title: current.title, scheduled_for },
  })

  return apiSuccess(data)
})
