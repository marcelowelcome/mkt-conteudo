// Configurações do workspace — hub de links

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Activity, Monitor } from 'lucide-react'

interface SettingsPageProps {
  params: { workspace: string }
}

const SETTINGS_ITEMS = [
  {
    title: 'Usuários',
    description: 'Gerenciar membros e roles do workspace',
    href: '/users',
    icon: Users,
  },
  {
    title: 'Atividades',
    description: 'Log de todas as ações no workspace',
    href: '/activity',
    icon: Activity,
  },
  {
    title: 'Saúde do Sistema',
    description: 'Status das APIs, banco e integrações',
    href: '/system',
    icon: Monitor,
  },
]

export default function SettingsPage({ params }: SettingsPageProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SETTINGS_ITEMS.map((item) => (
          <Link key={item.href} href={`/dashboard/${params.workspace}/settings${item.href}`}>
            <Card className="transition-shadow hover:shadow-md cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-sm">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
