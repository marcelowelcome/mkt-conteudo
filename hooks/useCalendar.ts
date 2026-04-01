// Hook para dados do calendário editorial — fetch por mês/status

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { EditorialCalendarEntry } from '@/types'

interface CalendarEntry extends EditorialCalendarEntry {
  content_pieces?: { title: string; status: string } | null
  content_adaptations?: { channel: string; status: string } | null
}

interface UseCalendarOptions {
  workspaceId: string
  month?: string // 2026-04
  status?: string
}

export function useCalendar(options: UseCalendarOptions) {
  const [entries, setEntries] = useState<CalendarEntry[]>([])
  const [loading, setLoading] = useState(true)

  const { workspaceId, month, status } = options

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ workspace_id: workspaceId })
    if (month) params.set('month', month)
    if (status) params.set('status', status)

    const res = await fetch(`/api/calendar?${params}`)
    const json = await res.json()

    if (json.success) {
      setEntries(json.data)
    }
    setLoading(false)
  }, [workspaceId, month, status])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  return { entries, loading, refresh: fetchEntries }
}
