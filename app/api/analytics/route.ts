// GET métricas consolidadas / POST gera relatório mensal

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response'
import { validateCronSecret } from '@/lib/auth'
import type { ConsolidatedAnalytics } from '@/types'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspace_id')
  const days = parseInt(searchParams.get('days') ?? '30')

  if (!workspaceId) {
    return apiError('workspace_id é obrigatório', 400)
  }

  const supabase = createServerSupabaseClient()
  const since = new Date(Date.now() - days * 86400000).toISOString()

  // Conteúdos publicados no período
  const { count: publishedCount } = await supabase
    .from('content_adaptations')
    .select('id', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .not('published_at', 'is', null)
    .gte('published_at', since)

  // Adaptações por canal
  const { data: channelStats } = await supabase
    .from('content_adaptations')
    .select('channel, status')
    .eq('workspace_id', workspaceId)
    .not('published_at', 'is', null)
    .gte('published_at', since)

  const channelCounts: Record<string, number> = {}
  for (const s of channelStats ?? []) {
    channelCounts[s.channel] = (channelCounts[s.channel] ?? 0) + 1
  }

  // Atividade recente
  const { data: recentActivity } = await supabase
    .from('activity_log')
    .select('action, created_at')
    .eq('workspace_id', workspaceId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(20)

  // Conteúdos por status
  const { data: statusCounts } = await supabase
    .from('content_pieces')
    .select('status')
    .eq('workspace_id', workspaceId)

  const statusMap: Record<string, number> = {}
  for (const s of statusCounts ?? []) {
    statusMap[s.status] = (statusMap[s.status] ?? 0) + 1
  }

  // Identificar melhor canal
  const bestChannel = Object.entries(channelCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'nenhum'

  const analytics: ConsolidatedAnalytics = {
    period: `${days} dias`,
    workspace_id: workspaceId,
    channels: {},
    summary: {
      total_reach: 0,
      total_engagement: 0,
      best_channel: bestChannel,
      content_published: publishedCount ?? 0,
    },
  }

  return apiSuccess({
    analytics,
    channel_counts: channelCounts,
    status_counts: statusMap,
    recent_activity: recentActivity,
    period_days: days,
  })
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  if (!validateCronSecret(request)) {
    return apiError('CRON_SECRET inválido', 401)
  }

  const { generateMonthlyReport } = await import('@/lib/monthly-report')

  const supabase = createServerSupabaseClient()
  const { data: workspaces } = await supabase.from('workspaces').select('id')

  const results = []
  for (const ws of workspaces ?? []) {
    const sent = await generateMonthlyReport(ws.id)
    results.push({ workspace: ws.id, sent })
  }

  return apiSuccess({ results })
})
