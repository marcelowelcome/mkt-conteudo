// GET saúde do sistema — tokens, crons, db stats, status dos canais

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspace_id')

  if (!workspaceId) {
    return apiError('workspace_id é obrigatório', 400)
  }

  const supabase = createServerSupabaseClient()

  // Contagens do banco
  const [contents, adaptations, calendar, knowledge, chunks, activity] = await Promise.all([
    supabase.from('content_pieces').select('id', { count: 'exact' }).eq('workspace_id', workspaceId),
    supabase.from('content_adaptations').select('id', { count: 'exact' }).eq('workspace_id', workspaceId),
    supabase.from('editorial_calendar').select('id', { count: 'exact' }).eq('workspace_id', workspaceId),
    supabase.from('knowledge_documents').select('id', { count: 'exact' }).eq('workspace_id', workspaceId),
    supabase.from('document_chunks').select('id', { count: 'exact' }).eq('workspace_id', workspaceId),
    supabase.from('activity_log').select('id', { count: 'exact' }).eq('workspace_id', workspaceId),
  ])

  // Status das APIs configuradas
  const apis = {
    supabase: true,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    wordpress: !!(process.env.WP_SITE_URL && process.env.WP_APP_PASSWORD),
    activecampaign: !!(process.env.AC_API_KEY && process.env.AC_API_URL),
    instagram: !!(process.env.META_ACCESS_TOKEN && process.env.META_IG_USER_ID),
    linkedin: !!(process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_ORGANIZATION_ID),
    youtube: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_REFRESH_TOKEN),
    telegram: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    resend: !!process.env.RESEND_API_KEY,
    cron_secret: !!(process.env.CRON_SECRET && process.env.CRON_SECRET.length >= 32),
  }

  // Configurações de canais
  const { data: channelConfigs } = await supabase
    .from('channel_configs')
    .select('channel, is_active, last_tested_at')
    .eq('workspace_id', workspaceId)

  return apiSuccess({
    database: {
      content_pieces: contents.count ?? 0,
      content_adaptations: adaptations.count ?? 0,
      editorial_calendar: calendar.count ?? 0,
      knowledge_documents: knowledge.count ?? 0,
      document_chunks: chunks.count ?? 0,
      activity_log: activity.count ?? 0,
    },
    apis,
    channels: channelConfigs ?? [],
    environment: process.env.NODE_ENV,
  })
})
