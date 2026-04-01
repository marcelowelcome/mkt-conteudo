// Calendário editorial — visão mensal com entradas por dia

'use client'

import { useState } from 'react'
import { useCalendar } from '@/hooks/useCalendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CHANNEL_LABELS } from '@/lib/constants'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Channel } from '@/types'

interface EditorialCalendarProps {
  workspace: string
}

export function EditorialCalendar({ workspace }: EditorialCalendarProps) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const monthStr = `${year}-${String(month).padStart(2, '0')}`
  const { entries, loading } = useCalendar({ workspaceId: workspace, month: monthStr })

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(year - 1) }
    else setMonth(month - 1)
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(year + 1) }
    else setMonth(month + 1)
  }

  // Gerar dias do mês
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Agrupar entradas por dia
  const entriesByDay: Record<number, typeof entries> = {}
  for (const entry of entries) {
    const day = new Date(entry.scheduled_for).getDate()
    if (!entriesByDay[day]) entriesByDay[day] = []
    entriesByDay[day].push(entry)
  }

  const MONTH_NAMES = [
    '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          {MONTH_NAMES[month]} {year}
        </CardTitle>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64" />
        ) : (
          <div className="grid grid-cols-7 gap-px bg-border rounded overflow-hidden">
            {/* Header */}
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
              <div key={d} className="bg-muted p-1.5 text-center text-xs font-medium text-muted-foreground">
                {d}
              </div>
            ))}

            {/* Células vazias antes do dia 1 */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-card min-h-[70px] p-1" />
            ))}

            {/* Dias */}
            {days.map((day) => {
              const dayEntries = entriesByDay[day] ?? []
              const isToday = day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear()

              return (
                <div
                  key={day}
                  className={`bg-card min-h-[70px] p-1 ${isToday ? 'ring-1 ring-primary' : ''}`}
                >
                  <span className={`text-xs ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                    {day}
                  </span>
                  <div className="mt-0.5 space-y-0.5">
                    {dayEntries.slice(0, 3).map((entry) => (
                      <Badge
                        key={entry.id}
                        variant="secondary"
                        className="block truncate text-[9px] leading-tight"
                      >
                        {CHANNEL_LABELS[entry.channel as Channel] ?? entry.channel}
                      </Badge>
                    ))}
                    {dayEntries.length > 3 && (
                      <span className="text-[9px] text-muted-foreground">
                        +{dayEntries.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
