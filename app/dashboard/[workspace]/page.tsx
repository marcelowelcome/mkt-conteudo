// Overview do workspace — KPIs e resumo da semana

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Calendar, BookOpen, BarChart3 } from 'lucide-react'

interface OverviewPageProps {
  params: { workspace: string }
}

const WORKSPACE_NAMES: Record<string, string> = {
  wt: 'Welcome Trips',
  ww: 'Welcome Weddings',
}

export default function OverviewPage({ params }: OverviewPageProps) {
  const workspaceName = WORKSPACE_NAMES[params.workspace] ?? params.workspace

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{workspaceName}</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral do workspace
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Conteúdos"
          value="—"
          description="Total de conteúdos"
          icon={FileText}
        />
        <KPICard
          title="Agendados"
          value="—"
          description="Publicações esta semana"
          icon={Calendar}
        />
        <KPICard
          title="Knowledge Base"
          value="—"
          description="Documentos indexados"
          icon={BookOpen}
        />
        <KPICard
          title="Publicados"
          value="—"
          description="Nos últimos 30 dias"
          icon={BarChart3}
        />
      </div>

      {/* Status placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            <p>Nenhuma atividade registrada ainda.</p>
          </div>
        </CardContent>
      </Card>

      {/* Fase indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline">Fase 1</Badge>
        <span>Fundação — WordPress + ActiveCampaign</span>
      </div>
    </div>
  )
}

interface KPICardProps {
  title: string
  value: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

function KPICard({ title, value, description, icon: Icon }: KPICardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
