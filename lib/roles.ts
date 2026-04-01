// Controle de acesso por workspace — getUserRole e helpers de permissão

import { createServerSupabaseClient } from '@/lib/supabase'
import type { UserRole } from '@/types'

interface RoleCheckResult {
  role: UserRole | null
  userId: string | null
  isAuthenticated: boolean
}

/** Retorna o role do usuário autenticado no workspace */
export async function getUserRole(workspaceId: string): Promise<RoleCheckResult> {
  const supabase = createServerSupabaseClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return { role: null, userId: null, isAuthenticated: false }
  }

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('workspace_id', workspaceId)
    .single()

  return {
    role: (roleData?.role as UserRole) ?? null,
    userId: user.id,
    isAuthenticated: true,
  }
}

/** Verifica se o usuário tem pelo menos um dos roles exigidos */
export function hasRole(currentRole: UserRole | null, requiredRoles: UserRole[]): boolean {
  if (!currentRole) return false
  return requiredRoles.includes(currentRole)
}

/** Verifica se o usuário pode editar conteúdo */
export function canEdit(role: UserRole | null): boolean {
  return hasRole(role, ['admin', 'editor'])
}

/** Verifica se o usuário é admin */
export function isAdmin(role: UserRole | null): boolean {
  return role === 'admin'
}
