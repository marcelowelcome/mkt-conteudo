// GET lista documentos / PATCH toggle ativo/inativo

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspace_id')

  if (!workspaceId) {
    return apiError('workspace_id é obrigatório', 400)
  }

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('knowledge_documents')
    .select('*, document_chunks(count)')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) {
    return apiError(error.message, 500)
  }

  // Formatar para incluir contagem de chunks
  const documents = data.map((doc) => ({
    ...doc,
    chunk_count: doc.document_chunks?.[0]?.count ?? 0,
    document_chunks: undefined,
  }))

  return apiSuccess(documents)
})

export const PATCH = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { id, is_active } = body

  if (!id || typeof is_active !== 'boolean') {
    return apiError('id e is_active são obrigatórios', 400)
  }

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('knowledge_documents')
    .update({ is_active })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return apiError(error.message, 500)
  }

  return apiSuccess(data)
})
