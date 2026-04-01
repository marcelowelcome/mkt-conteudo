// Navegação mobile — bottom bar com ícones principais

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Calendar,
  BarChart3,
  Settings,
} from 'lucide-react'

interface MobileNavProps {
  workspace: string
}

const MOBILE_ITEMS = [
  { label: 'Home', icon: LayoutDashboard, href: '' },
  { label: 'Conteúdos', icon: FileText, href: '/content' },
  { label: 'Calendário', icon: Calendar, href: '/calendar' },
  { label: 'Analytics', icon: BarChart3, href: '/analytics' },
  { label: 'Config', icon: Settings, href: '/settings' },
]

export function MobileNav({ workspace }: MobileNavProps) {
  const pathname = usePathname()
  const basePath = `/dashboard/${workspace}`

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t bg-card md:hidden">
      {MOBILE_ITEMS.map((item) => {
        const href = `${basePath}${item.href}`
        const isActive = item.href === ''
          ? pathname === basePath
          : pathname.startsWith(href)

        return (
          <Link
            key={item.href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
