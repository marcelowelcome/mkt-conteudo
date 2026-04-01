// Configurações do workspace — placeholder

import { Badge } from '@/components/ui/badge'

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <Badge variant="outline">Em breve</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Configurações gerais do workspace — em desenvolvimento.
      </p>
    </div>
  )
}
