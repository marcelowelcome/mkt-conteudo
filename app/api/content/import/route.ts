// POST importa conteúdo de PDF, DOCX ou URL — extrai texto e cria content_piece

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response'
import { parsePdf } from '@/lib/rag/pdf-parser'
import { logActivity } from '@/lib/activity'
import { logger } from '@/lib/logger'

export const POST = withErrorHandler(async (request: NextRequest) => {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const url = formData.get('url') as string | null
  const workspaceId = formData.get('workspace_id') as string

  if (!workspaceId) {
    return apiError('workspace_id é obrigatório', 400)
  }

  let title = ''
  let body = ''

  if (file) {
    // Importação de arquivo (PDF)
    if (file.name.endsWith('.pdf')) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const { text } = await parsePdf(buffer)
      title = file.name.replace('.pdf', '')
      body = text
    } else if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      title = file.name.replace(/\.(txt|md)$/, '')
      body = await file.text()
    } else {
      return apiError('Formatos suportados: PDF, TXT, MD', 400)
    }
  } else if (url) {
    // Importação de URL — extrair texto da página
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'ContentHub-Importer/1.0' },
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) return apiError(`URL retornou ${res.status}`, 400)

      const html = await res.text()
      title = (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? url).trim()
      body = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    } catch (error) {
      return apiError(`Erro ao acessar URL: ${(error as Error).message}`, 400)
    }
  } else {
    return apiError('Envie um arquivo (file) ou uma URL (url)', 400)
  }

  if (!body.trim()) {
    return apiError('Nenhum texto extraído do conteúdo', 400)
  }

  logger.info('Content imported', { title, bodyLength: body.length, source: file ? 'file' : 'url' })

  // Criar content_piece
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('content_pieces')
    .insert({
      workspace_id: workspaceId,
      title,
      body: body.slice(0, 50000), // Limitar tamanho
      status: 'DRAFT',
    })
    .select()
    .single()

  if (error) return apiError(error.message, 500)

  await logActivity({
    workspaceId,
    action: 'content.imported',
    entityType: 'content_piece',
    entityId: data.id,
    details: { title, source: file ? file.name : url },
  })

  return apiSuccess(data, { status: 201 })
})
