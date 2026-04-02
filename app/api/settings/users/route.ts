// GET lista usuários do workspace / POST adiciona / PATCH atualiza role / DELETE remove

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response'
import { logActivity } from '@/lib/activity'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspace_id')

  if (!workspaceId) return apiError('workspace_id é obrigatório', 400)

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('user_roles')
    .select('id, user_id, role, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  if (error) return apiError(error.message, 500)

  // Buscar emails dos usuários
  const userIds = (data ?? []).map((r) => r.user_id)
  const users = []

  for (const uid of userIds) {
    const { data: userData } = await supabase.auth.admin.getUserById(uid)
    const role = data?.find((r) => r.user_id === uid)
    users.push({
      id: role?.id,
      user_id: uid,
      email: userData?.user?.email ?? 'desconhecido',
      role: role?.role ?? 'viewer',
      created_at: role?.created_at,
    })
  }

  return apiSuccess(users)
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { workspace_id, email, role } = body

  if (!workspace_id || !email || !role) {
    return apiError('workspace_id, email e role são obrigatórios', 400)
  }

  const supabase = createServerSupabaseClient()

  // Buscar user pelo email
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const user = users.find((u) => u.email === email)

  if (!user) {
    return apiError(`Usuário com email ${email} não encontrado no Supabase Auth`, 404)
  }

  const { data, error } = await supabase
    .from('user_roles')
    .upsert(
      { user_id: user.id, workspace_id, role },
      { onConflict: 'user_id,workspace_id' }
    )
    .select()
    .single()

  if (error) return apiError(error.message, 500)

  await logActivity({
    workspaceId: workspace_id,
    action: 'user.role.set',
    entityType: 'user_role',
    entityId: data.id,
    details: { email, role },
  })

  return apiSuccess(data, { status: 201 })
})

export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return apiError('id é obrigatório', 400)

  const supabase = createServerSupabaseClient()

  const { data: existing } = await supabase
    .from('user_roles')
    .select('workspace_id, user_id')
    .eq('id', id)
    .single()

  if (!existing) return apiError('Role não encontrado', 404)

  const { error } = await supabase.from('user_roles').delete().eq('id', id)
  if (error) return apiError(error.message, 500)

  await logActivity({
    workspaceId: existing.workspace_id,
    action: 'user.role.removed',
    entityType: 'user_role',
    details: { user_id: existing.user_id },
  })

  return apiSuccess({ deleted: true })
})
