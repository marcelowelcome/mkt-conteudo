// POST upload e ingestão de PDFs — extrai texto, chunka e gera embeddings

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response'
import { parsePdf } from '@/lib/rag/pdf-parser'
import { chunkText } from '@/lib/rag/chunker'
import { generateEmbeddingsBatch } from '@/lib/rag/embeddings'
import { logActivity } from '@/lib/activity'
import { logger } from '@/lib/logger'

export const POST = withErrorHandler(async (request: NextRequest) => {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const workspaceId = formData.get('workspace_id') as string | null
  const title = formData.get('title') as string | null
  const description = formData.get('description') as string | null

  if (!file || !workspaceId) {
    return apiError('file e workspace_id são obrigatórios', 400)
  }

  if (!file.name.endsWith('.pdf')) {
    return apiError('Apenas arquivos PDF são aceitos', 400)
  }

  const supabase = createServerSupabaseClient()

  // 1. Parse do PDF
  logger.info('Ingesting PDF', { fileName: file.name, workspaceId })
  const buffer = Buffer.from(await file.arrayBuffer())
  const { text, pages } = await parsePdf(buffer)

  if (!text.trim()) {
    return apiError('PDF não contém texto extraível', 400)
  }

  // 2. Criar documento
  const { data: doc, error: docError } = await supabase
    .from('knowledge_documents')
    .insert({
      workspace_id: workspaceId,
      title: title || file.name.replace('.pdf', ''),
      source_type: 'PDF',
      file_name: file.name,
      description: description || `PDF com ${pages} página(s)`,
      is_active: true,
    })
    .select()
    .single()

  if (docError) {
    return apiError(docError.message, 500)
  }

  // 3. Chunking
  const chunks = chunkText(text)
  logger.info('Chunked text', { documentId: doc.id, chunks: chunks.length })

  // 4. Gerar embeddings em lote
  const embeddings = await generateEmbeddingsBatch(chunks.map((c) => c.content))

  // 5. Inserir chunks com embeddings
  const chunkRows = chunks.map((chunk, i) => ({
    workspace_id: workspaceId,
    document_id: doc.id,
    chunk_index: chunk.index,
    content: chunk.content,
    token_count: chunk.tokenCount,
    embedding: embeddings[i],
    metadata: { file_name: file.name, pages },
  }))

  const { error: chunkError } = await supabase
    .from('document_chunks')
    .insert(chunkRows)

  if (chunkError) {
    logger.error('Failed to insert chunks', { error: chunkError.message })
    // Cleanup: remover documento criado
    await supabase.from('knowledge_documents').delete().eq('id', doc.id)
    return apiError(`Erro ao salvar chunks: ${chunkError.message}`, 500)
  }

  await logActivity({
    workspaceId,
    action: 'knowledge.ingested',
    entityType: 'knowledge_document',
    entityId: doc.id,
    details: { fileName: file.name, chunks: chunks.length, pages },
  })

  return apiSuccess({
    document: doc,
    chunks: chunks.length,
    pages,
  }, { status: 201 })
})
