// GET / PATCH configurações gerais do workspace

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspace_id')

  if (!workspaceId) return apiError('workspace_id é obrigatório', 400)

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single()

  if (error || !data) return apiError('Workspace não encontrado', 404)

  return apiSuccess(data)
})

export const PATCH = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { workspace_id, name, site_url } = body

  if (!workspace_id) return apiError('workspace_id é obrigatório', 400)

  const supabase = createServerSupabaseClient()

  const updates: Record<string, string> = {}
  if (name) updates.name = name
  if (site_url !== undefined) updates.site_url = site_url

  const { data, error } = await supabase
    .from('workspaces')
    .update(updates)
    .eq('id', workspace_id)
    .select()
    .single()

  if (error) return apiError(error.message, 500)

  return apiSuccess(data)
})
