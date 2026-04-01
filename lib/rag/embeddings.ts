// Wrapper da OpenAI Embeddings API — gera embeddings em lote

import OpenAI from 'openai'
import { logger } from '@/lib/logger'
import { RAG_CONFIG } from '@/lib/constants'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/** Gera embedding para um texto */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: RAG_CONFIG.EMBEDDING_MODEL,
    input: text,
  })
  return response.data[0].embedding
}

/** Gera embeddings em lote (batch de EMBEDDING_BATCH_SIZE) */
export async function generateEmbeddingsBatch(
  texts: string[]
): Promise<number[][]> {
  const results: number[][] = []
  const batchSize = RAG_CONFIG.EMBEDDING_BATCH_SIZE

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    logger.info('Generating embeddings batch', {
      batch: Math.floor(i / batchSize) + 1,
      total: Math.ceil(texts.length / batchSize),
      size: batch.length,
    })

    const response = await openai.embeddings.create({
      model: RAG_CONFIG.EMBEDDING_MODEL,
      input: batch,
    })

    results.push(...response.data.map((d) => d.embedding))
  }

  return results
}
