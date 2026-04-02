// GET exporta dados do workspace como JSON

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { apiError } from '@/lib/api-response'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest): Promise<NextResponse | Response> {
  try {
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspace_id')
  const format = searchParams.get('format') ?? 'json'

  if (!workspaceId) return apiError('workspace_id é obrigatório', 400)

  const supabase = createServerSupabaseClient()

  const [contents, adaptations, calendar, knowledge, activity] = await Promise.all([
    supabase.from('content_pieces').select('*').eq('workspace_id', workspaceId),
    supabase.from('content_adaptations').select('*').eq('workspace_id', workspaceId),
    supabase.from('editorial_calendar').select('*').eq('workspace_id', workspaceId),
    supabase.from('knowledge_documents').select('*').eq('workspace_id', workspaceId),
    supabase.from('activity_log').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(500),
  ])

  const exportData = {
    exported_at: new Date().toISOString(),
    workspace_id: workspaceId,
    content_pieces: contents.data ?? [],
    content_adaptations: adaptations.data ?? [],
    editorial_calendar: calendar.data ?? [],
    knowledge_documents: knowledge.data ?? [],
    activity_log: activity.data ?? [],
  }

  if (format === 'csv') {
    // CSV simples dos conteúdos
    const header = 'id,title,status,target_channels,created_at\n'
    const rows = (contents.data ?? [])
      .map((c) => `${c.id},"${c.title}",${c.status},"${(c.target_channels ?? []).join(';')}",${c.created_at}`)
      .join('\n')

    return new Response(header + rows, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="content-hub-${workspaceId}-${Date.now()}.csv"`,
      },
    })
  }

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="content-hub-${workspaceId}-${Date.now()}.json"`,
    },
  })
  } catch (error) {
    logger.error('Export error', { error: (error as Error).message })
    return apiError('Erro na exportação', 500)
  }
}
