// Hook para dados de analytics consolidados e por canal

'use client'

import { useState, useEffect, useCallback } from 'react'

interface AnalyticsData {
  analytics: Record<string, unknown>
  channel_counts: Record<string, number>
  status_counts: Record<string, number>
  recent_activity: Array<{ action: string; created_at: string }>
  period_days: number
}

interface ChannelData {
  channel: string
  metrics: Record<string, unknown>
  period: string
}

export function useAnalytics(workspaceId: string, days: number = 30) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [channels, setChannels] = useState<Record<string, ChannelData>>({})
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)

    // Consolidado
    const mainRes = await fetch(`/api/analytics?workspace_id=${workspaceId}&days=${days}`)
    const mainJson = await mainRes.json()
    if (mainJson.success) setData(mainJson.data)

    // Por canal (em paralelo)
    const channelNames = ['wordpress', 'activecampaign', 'instagram', 'linkedin', 'youtube']
    const results = await Promise.all(
      channelNames.map(async (ch) => {
        const res = await fetch(`/api/analytics/${ch}?workspace_id=${workspaceId}&days=${days}`)
        const json = await res.json()
        return { channel: ch, data: json.success ? json.data : null }
      })
    )

    const channelMap: Record<string, ChannelData> = {}
    for (const r of results) {
      if (r.data) channelMap[r.channel] = r.data
    }
    setChannels(channelMap)
    setLoading(false)
  }, [workspaceId, days])

  useEffect(() => { fetchAll() }, [fetchAll])

  return { data, channels, loading, refresh: fetchAll }
}
