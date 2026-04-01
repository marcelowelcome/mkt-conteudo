// Web scraper do site do workspace — extrai texto de páginas para Knowledge Base

import { createServerSupabaseClient } from '@/lib/supabase'
import { chunkText } from '@/lib/rag/chunker'
import { generateEmbeddingsBatch } from '@/lib/rag/embeddings'
import { logger } from '@/lib/logger'

interface ScrapeResult {
  pages: number
  chunks: number
  documentId: string
}

/** Scrape e indexa o site de um workspace */
export async function scrapeWorkspaceSite(
  workspaceId: string,
  siteUrl: string
): Promise<ScrapeResult> {
  logger.info('Starting site scrape', { workspaceId, siteUrl })

  // Buscar páginas principais do site
  const pages = await fetchSitePages(siteUrl)

  if (pages.length === 0) {
    throw new Error('Nenhuma página encontrada para indexar')
  }

  // Concatenar texto de todas as páginas
  const fullText = pages.map((p) => `# ${p.title}\n\n${p.text}`).join('\n\n---\n\n')

  // Criar/atualizar documento no banco
  const supabase = createServerSupabaseClient()

  // Remover scrape anterior do mesmo site
  const { data: existing } = await supabase
    .from('knowledge_documents')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('source_type', 'WEBSITE')
    .eq('source_url', siteUrl)
    .single()

  if (existing) {
    await supabase.from('document_chunks').delete().eq('document_id', existing.id)
    await supabase.from('knowledge_documents').delete().eq('id', existing.id)
  }

  const { data: doc, error: docError } = await supabase
    .from('knowledge_documents')
    .insert({
      workspace_id: workspaceId,
      title: `Site: ${siteUrl}`,
      source_type: 'WEBSITE',
      source_url: siteUrl,
      description: `${pages.length} páginas indexadas`,
      is_active: true,
    })
    .select()
    .single()

  if (docError || !doc) {
    throw new Error(`Erro ao criar documento: ${docError?.message}`)
  }

  // Chunking + embeddings
  const chunks = chunkText(fullText)
  const embeddings = await generateEmbeddingsBatch(chunks.map((c) => c.content))

  const chunkRows = chunks.map((chunk, i) => ({
    workspace_id: workspaceId,
    document_id: doc.id,
    chunk_index: chunk.index,
    content: chunk.content,
    token_count: chunk.tokenCount,
    embedding: embeddings[i],
    metadata: { source_url: siteUrl, pages: pages.length },
  }))

  const { error: chunkError } = await supabase.from('document_chunks').insert(chunkRows)

  if (chunkError) {
    await supabase.from('knowledge_documents').delete().eq('id', doc.id)
    throw new Error(`Erro ao salvar chunks: ${chunkError.message}`)
  }

  logger.info('Site scrape completed', {
    workspaceId,
    pages: pages.length,
    chunks: chunks.length,
  })

  return { pages: pages.length, chunks: chunks.length, documentId: doc.id }
}

interface PageContent {
  url: string
  title: string
  text: string
}

async function fetchSitePages(siteUrl: string): Promise<PageContent[]> {
  const pages: PageContent[] = []
  const baseUrl = siteUrl.replace(/\/$/, '')

  // Páginas-chave típicas de um site de turismo
  const paths = ['/', '/sobre', '/about', '/destinos', '/servicos', '/services', '/contato']

  for (const path of paths) {
    try {
      const url = `${baseUrl}${path}`
      const res = await fetch(url, {
        headers: { 'User-Agent': 'ContentHub-Scraper/1.0' },
        signal: AbortSignal.timeout(10000),
      })

      if (!res.ok) continue

      const html = await res.text()
      const title = extractTitle(html)
      const text = extractText(html)

      if (text.length > 50) {
        pages.push({ url, title, text })
      }
    } catch {
      // Página não existe ou timeout — pular
    }
  }

  return pages
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  return match?.[1]?.trim() ?? 'Sem título'
}

function extractText(html: string): string {
  return html
    // Remover scripts e styles
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    // Converter tags block para quebras de linha
    .replace(/<\/?(p|div|br|h[1-6]|li|tr|td|th|blockquote)[^>]*>/gi, '\n')
    // Remover todas as tags restantes
    .replace(/<[^>]+>/g, ' ')
    // Decodificar entidades HTML básicas
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Limpar whitespace
    .replace(/\s+/g, ' ')
    .trim()
}
