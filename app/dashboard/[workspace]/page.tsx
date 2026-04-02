// Overview do workspace — KPIs reais do banco + atividade recente + próximos agendamentos

import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { KPICard } from '@/components/hub/AnalyticsCards'
import { CHANNEL_LABELS } from '@/lib/constants'
import { FileText, Calendar, BookOpen, BarChart3 } from 'lucide-react'
import type { Channel } from '@/types'

interface OverviewPageProps {
  params: { workspace: string }
}

const WORKSPACE_NAMES: Record<string, string> = {
  wt: 'Welcome Trips',
  ww: 'Welcome Weddings',
}

export default async function OverviewPage({ params }: OverviewPageProps) {
  const ws = params.workspace
  const workspaceName = WORKSPACE_NAMES[ws] ?? ws
  const supabase = createServerSupabaseClient()

  // KPIs em paralelo
  const [contents, scheduled, knowledge, published, activity, upcoming] = await Promise.all([
    supabase.from('content_pieces').select('id', { count: 'exact' }).eq('workspace_id', ws),
    supabase.from('editorial_calendar').select('id', { count: 'exact' }).eq('workspace_id', ws).eq('status', 'SCHEDULED'),
    supabase.from('knowledge_documents').select('id', { count: 'exact' }).eq('workspace_id', ws).eq('is_active', true),
    supabase.from('content_adaptations').select('id', { count: 'exact' }).eq('workspace_id', ws).not('published_at', 'is', null),
    supabase.from('activity_log').select('action, entity_type, details, created_at').eq('workspace_id', ws).order('created_at', { ascending: false }).limit(8),
    supabase.from('editorial_calendar').select('channel, scheduled_for, status, content_pieces(title)').eq('workspace_id', ws).eq('status', 'SCHEDULED').order('scheduled_for', { ascending: true }).limit(5),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{workspaceName}</h1>
        <p className="text-sm text-muted-foreground">Visão geral do workspace</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Conteúdos" value={String(contents.count ?? 0)} description="Total no workspace" icon={FileText} />
        <KPICard title="Agendados" value={String(scheduled.count ?? 0)} description="Prontos para publicar" icon={Calendar} />
        <KPICard title="Knowledge Base" value={String(knowledge.count ?? 0)} description="Documentos ativos" icon={BookOpen} />
        <KPICard title="Publicados" value={String(published.count ?? 0)} description="Total publicado" icon={BarChart3} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Próximos agendamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Próximos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {(upcoming.data ?? []).length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhum agendamento.</p>
            ) : (
              <div className="space-y-2">
                {(upcoming.data ?? []).map((entry, i) => {
                  const cp = entry.content_pieces as unknown as { title: string } | null
                  const title = cp?.title ?? 'Sem título'
                  return (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline" className="text-[9px] shrink-0">
                          {CHANNEL_LABELS[entry.channel as Channel] ?? entry.channel}
                        </Badge>
                        <span className="truncate text-xs">{title}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                        {new Date(entry.scheduled_for).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Atividade recente */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Atividade Recente</CardTitle>
            <Link href={`/dashboard/${ws}/settings/activity`} className="text-xs text-muted-foreground hover:underline">
              Ver tudo
            </Link>
          </CardHeader>
          <CardContent>
            {(activity.data ?? []).length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma atividade.</p>
            ) : (
              <div className="space-y-1">
                {(activity.data ?? []).map((act, i) => {
                  const details = act.details as Record<string, unknown> | null
                  const summary = details?.title ? String(details.title).slice(0, 30) : (details?.channel ? String(details.channel) : '')
                  return (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground truncate">
                        {act.action}{summary ? ` — ${summary}` : ''}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                        {new Date(act.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
