// POST aprova conteúdo — transiciona status para APPROVED

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response'
import { logActivity } from '@/lib/activity'

export const POST = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Record<string, string> }
) => {
  const supabase = createServerSupabaseClient()

  const { data: current } = await supabase
    .from('content_pieces')
    .select('id, status, workspace_id, title')
    .eq('id', params.id)
    .single()

  if (!current) {
    return apiError('Conteúdo não encontrado', 404)
  }

  if (current.status !== 'REVIEW') {
    return apiError(`Só conteúdos em REVIEW podem ser aprovados. Status atual: ${current.status}`, 400)
  }

  const { data, error } = await supabase
    .from('content_pieces')
    .update({ status: 'APPROVED', updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return apiError(error.message, 500)
  }

  await logActivity({
    workspaceId: current.workspace_id,
    action: 'content.approved',
    entityType: 'content_piece',
    entityId: current.id,
    details: { title: current.title },
  })

  return apiSuccess(data)
})
