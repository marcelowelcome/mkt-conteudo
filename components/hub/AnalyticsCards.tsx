// Sub-componentes do dashboard de analytics — KPI card e métricas por canal

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CHANNEL_LABELS } from '@/lib/constants'
import { Users } from 'lucide-react'
import type { Channel } from '@/types'

interface KPICardProps {
  title: string
  value: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

export function KPICard({ title, value, description, icon: Icon }: KPICardProps) {
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

interface ChannelMetricsCardProps {
  channel: string
  data: { metrics: Record<string, unknown>; message?: string }
}

export function ChannelMetricsCard({ channel, data }: ChannelMetricsCardProps) {
  const metrics = data.metrics ?? {}
  const label = CHANNEL_LABELS[channel as Channel] ?? channel

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {Object.entries(metrics)
            .filter(([k]) => !k.startsWith('top_') && typeof metrics[k] === 'number')
            .slice(0, 6)
            .map(([key, value]) => (
              <div key={key}>
                <p className="text-xs text-muted-foreground">{formatMetricName(key)}</p>
                <p className="font-medium">{formatMetricValue(key, value as number)}</p>
              </div>
            ))}
        </div>
        {data.message && (
          <p className="mt-2 text-xs text-muted-foreground">{String(data.message)}</p>
        )}
      </CardContent>
    </Card>
  )
}

function formatMetricName(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatMetricValue(key: string, value: number): string {
  if (key.includes('rate')) return `${value.toFixed(1)}%`
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return String(value)
}
