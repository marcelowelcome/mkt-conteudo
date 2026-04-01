// Visão Kanban do calendário editorial — colunas por status

'use client'

import { useCalendar } from '@/hooks/useCalendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CHANNEL_LABELS } from '@/lib/constants'
import type { Channel, CalendarStatus } from '@/types'

interface CalendarKanbanProps {
  workspace: string
}

const KANBAN_COLUMNS: { status: CalendarStatus; label: string; color: string }[] = [
  { status: 'SCHEDULED', label: 'Agendado', color: 'bg-blue-50 border-blue-200' },
  { status: 'APPROVED', label: 'Aprovado', color: 'bg-green-50 border-green-200' },
  { status: 'PUBLISHED', label: 'Publicado', color: 'bg-purple-50 border-purple-200' },
  { status: 'CANCELLED', label: 'Cancelado', color: 'bg-gray-50 border-gray-200' },
]

export function CalendarKanban({ workspace }: CalendarKanbanProps) {
  const { entries, loading } = useCalendar({ workspaceId: workspace })

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48" />)}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {KANBAN_COLUMNS.map((col) => {
        const columnEntries = entries.filter((e) => e.status === col.status)

        return (
          <div key={col.status} className={`rounded-lg border p-3 ${col.color}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">{col.label}</h3>
              <Badge variant="secondary" className="text-[10px]">
                {columnEntries.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {columnEntries.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  Vazio
                </p>
              ) : (
                columnEntries.map((entry) => (
                  <Card key={entry.id} className="shadow-sm">
                    <CardHeader className="p-2 pb-1">
                      <CardTitle className="text-xs font-medium truncate">
                        {entry.content_pieces?.title ?? 'Sem título'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 pt-0">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[9px]">
                          {CHANNEL_LABELS[entry.channel as Channel] ?? entry.channel}
                        </Badge>
                        <span className="text-[9px] text-muted-foreground">
                          {formatShortDate(entry.scheduled_for)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
