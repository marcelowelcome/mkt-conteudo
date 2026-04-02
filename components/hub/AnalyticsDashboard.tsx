// Dashboard de analytics consolidado — KPIs + métricas por canal

'use client'

import { useState } from 'react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { CHANNEL_LABELS } from '@/lib/constants'
import { KPICard, ChannelMetricsCard } from '@/components/hub/AnalyticsCards'
import { BarChart3, Eye, TrendingUp, FileText } from 'lucide-react'
import type { Channel } from '@/types'

interface AnalyticsDashboardProps {
  workspace: string
}

export function AnalyticsDashboard({ workspace }: AnalyticsDashboardProps) {
  const [days, setDays] = useState(30)
  const { data, channels, loading } = useAnalytics(workspace, days)

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  const statusCounts = data?.status_counts ?? {}
  const channelCounts = data?.channel_counts ?? {}
  const totalPublished = data?.analytics
    ? (data.analytics as Record<string, Record<string, number>>).summary?.content_published ?? 0
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <Select value={String(days)} onValueChange={(v) => setDays(parseInt(v))}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 dias</SelectItem>
            <SelectItem value="30">30 dias</SelectItem>
            <SelectItem value="60">60 dias</SelectItem>
            <SelectItem value="90">90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Publicados"
          value={String(totalPublished)}
          description={`Últimos ${days} dias`}
          icon={FileText}
        />
        <KPICard
          title="Em Produção"
          value={String((statusCounts['DRAFT'] ?? 0) + (statusCounts['REVIEW'] ?? 0))}
          description="Draft + Review"
          icon={TrendingUp}
        />
        <KPICard
          title="Canais Ativos"
          value={String(Object.keys(channelCounts).length)}
          description="Com publicações"
          icon={BarChart3}
        />
        <KPICard
          title="Agendados"
          value={String(statusCounts['SCHEDULED'] ?? 0)}
          description="Prontos para publicar"
          icon={Eye}
        />
      </div>

      {/* Publicações por canal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Publicações por Canal</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(channelCounts).length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma publicação no período.
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(channelCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([ch, count]) => (
                  <div key={ch} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {CHANNEL_LABELS[ch as Channel] ?? ch}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 rounded-full bg-primary" style={{
                        width: `${Math.max(20, (count / Math.max(...Object.values(channelCounts))) * 200)}px`
                      }} />
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Métricas por canal */}
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(channels).map(([ch, chData]) => (
          <ChannelMetricsCard key={ch} channel={ch} data={chData} />
        ))}
      </div>

      {/* Atividade recente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          {(data?.recent_activity ?? []).length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhuma atividade no período.
            </p>
          ) : (
            <div className="space-y-2">
              {(data?.recent_activity ?? []).slice(0, 10).map((act, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{act.action}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(act.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

