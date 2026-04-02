// GET histórico de versões / POST cria snapshot de versão

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response'

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Record<string, string> }
) => {
  const supabase = createServerSupabaseClient()

  // Buscar atividades de mudança de status como "versões"
  const { data, error } = await supabase
    .from('activity_log')
    .select('action, details, created_at')
    .eq('entity_type', 'content_piece')
    .eq('entity_id', params.id)
    .order('created_at', { ascending: false })

  if (error) return apiError(error.message, 500)

  // Formatar como versões
  const versions = (data ?? []).map((entry, i) => ({
    version: data!.length - i,
    action: entry.action,
    details: entry.details,
    timestamp: entry.created_at,
  }))

  return apiSuccess(versions)
})

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Record<string, string> }
) => {
  const body = await request.json()
  const { workspace_id, snapshot_reason } = body

  if (!workspace_id) return apiError('workspace_id é obrigatório', 400)

  const supabase = createServerSupabaseClient()

  // Buscar estado atual do conteúdo
  const { data: content } = await supabase
    .from('content_pieces')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!content) return apiError('Conteúdo não encontrado', 404)

  // Incrementar versão
  const newVersion = (content.version ?? 1) + 1

  await supabase
    .from('content_pieces')
    .update({ version: newVersion, updated_at: new Date().toISOString() })
    .eq('id', params.id)

  // Registrar snapshot no activity_log
  await supabase.from('activity_log').insert({
    workspace_id,
    action: 'content.version.snapshot',
    entity_type: 'content_piece',
    entity_id: params.id,
    details: {
      version: newVersion,
      reason: snapshot_reason ?? 'manual',
      title: content.title,
      status: content.status,
      body_length: content.body?.length ?? 0,
    },
  })

  return apiSuccess({ version: newVersion })
})
