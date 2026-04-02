// Sidebar de navegação do dashboard — desktop (fixo à esquerda)

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Calendar,
  BookOpen,
  BarChart3,
  Link2,
  Settings,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { WorkspaceSwitcher } from '@/components/hub/WorkspaceSwitcher'

interface SidebarProps {
  workspace: string
}

const NAV_ITEMS = [
  { label: 'Overview', icon: LayoutDashboard, href: '' },
  { label: 'Conteúdos', icon: FileText, href: '/content' },
  { label: 'Calendário', icon: Calendar, href: '/calendar' },
  { label: 'Knowledge Base', icon: BookOpen, href: '/knowledge' },
  { label: 'Analytics', icon: BarChart3, href: '/analytics' },
  { label: 'Canais', icon: Link2, href: '/channels' },
  { label: 'Configurações', icon: Settings, href: '/settings' },
]

export function Sidebar({ workspace }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const basePath = `/dashboard/${workspace}`

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:bg-card">
      <div className="border-b px-3 py-3 space-y-2">
        <Link href={basePath} className="font-semibold text-sm tracking-tight">
          Content Hub
        </Link>
        <WorkspaceSwitcher current={workspace} />
      </div>

      <nav className="flex-1 space-y-1 px-2 py-3">
        {NAV_ITEMS.map((item) => {
          const href = `${basePath}${item.href}`
          const isActive = item.href === ''
            ? pathname === basePath
            : pathname.startsWith(href)

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-2">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
