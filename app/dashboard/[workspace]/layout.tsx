// Layout do dashboard — sidebar (desktop) + bottom nav (mobile) + header

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { Sidebar } from '@/components/hub/Sidebar'
import { MobileNav } from '@/components/hub/MobileNav'
import { UserMenu } from '@/components/hub/UserMenu'

interface DashboardLayoutProps {
  children: React.ReactNode
  params: { workspace: string }
}

const VALID_WORKSPACES = ['wt', 'ww']

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { workspace } = params

  // Valida workspace
  if (!VALID_WORKSPACES.includes(workspace)) {
    redirect('/dashboard/wt')
  }

  // Busca sessão do usuário
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Busca role do usuário no workspace
  let role = 'viewer'
  try {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('workspace_id', workspace)
      .single()
    role = roleData?.role ?? 'viewer'
  } catch {
    // Se RLS bloquear, usa viewer como fallback
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar workspace={workspace} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b bg-card px-4">
          <h2 className="text-sm font-medium md:hidden">Content Hub</h2>
          <div className="hidden md:block" />
          <UserMenu email={user.email ?? ''} role={role} />
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
          {children}
        </main>
      </div>

      <MobileNav workspace={workspace} />
    </div>
  )
}
