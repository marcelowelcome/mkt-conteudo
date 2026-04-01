// POST dispara scraping do site do workspace — manual ou via cron

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response'
import { validateCronSecret } from '@/lib/auth'
import { scrapeWorkspaceSite } from '@/lib/rag/site-scraper'
import { logActivity } from '@/lib/activity'
import { logger } from '@/lib/logger'

export const POST = withErrorHandler(async (request: NextRequest) => {
  const isCron = request.headers.has('authorization')
  if (isCron && !validateCronSecret(request)) {
    return apiError('CRON_SECRET inválido', 401)
  }

  const body = await request.json().catch(() => ({}))
  const workspaceId = (body as Record<string, string>).workspace_id

  const supabase = createServerSupabaseClient()

  // Se chamado pelo cron, processar todos os workspaces ativos
  if (isCron && !workspaceId) {
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id, site_url')
      .not('site_url', 'is', null)

    const results = []
    for (const ws of workspaces ?? []) {
      if (!ws.site_url) continue
      try {
        const result = await scrapeWorkspaceSite(ws.id, ws.site_url)
        results.push({ workspace: ws.id, ...result })
      } catch (error) {
        logger.error('Scrape failed for workspace', {
          workspace: ws.id,
          error: error instanceof Error ? error.message : 'Unknown',
        })
        results.push({ workspace: ws.id, error: (error as Error).message })
      }
    }

    return apiSuccess({ results })
  }

  // Scrape manual de um workspace específico
  if (!workspaceId) {
    return apiError('workspace_id é obrigatório', 400)
  }

  const { data: ws } = await supabase
    .from('workspaces')
    .select('site_url')
    .eq('id', workspaceId)
    .single()

  if (!ws?.site_url) {
    return apiError('Workspace sem site_url configurado', 400)
  }

  const result = await scrapeWorkspaceSite(workspaceId, ws.site_url)

  await logActivity({
    workspaceId,
    action: 'knowledge.scraped',
    entityType: 'knowledge_document',
    entityId: result.documentId,
    details: { pages: result.pages, chunks: result.chunks },
  })

  return apiSuccess(result)
})
