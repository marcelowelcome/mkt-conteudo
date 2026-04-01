// Chunking de texto — divide em pedaços de ~512 tokens com overlap de 64

import { RAG_CONFIG } from '@/lib/constants'

interface Chunk {
  content: string
  index: number
  tokenCount: number
}

/** Estimativa simples de tokens (~4 chars por token em português) */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/** Divide texto em chunks com sobreposição */
export function chunkText(text: string): Chunk[] {
  const { CHUNK_SIZE, CHUNK_OVERLAP } = RAG_CONFIG
  const chunks: Chunk[] = []

  // Normalizar whitespace
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return []

  // Dividir por sentenças para chunks mais coerentes
  const sentences = normalized.split(/(?<=[.!?])\s+/)
  let currentChunk = ''
  let chunkIndex = 0

  for (const sentence of sentences) {
    const combined = currentChunk ? `${currentChunk} ${sentence}` : sentence

    if (estimateTokens(combined) > CHUNK_SIZE && currentChunk) {
      chunks.push({
        content: currentChunk.trim(),
        index: chunkIndex,
        tokenCount: estimateTokens(currentChunk),
      })
      chunkIndex++

      // Overlap: manter final do chunk anterior
      const words = currentChunk.split(' ')
      const overlapWords = Math.ceil(CHUNK_OVERLAP * 4) // ~chars para overlap
      const overlapText = words.slice(-Math.ceil(overlapWords / 5)).join(' ')
      currentChunk = `${overlapText} ${sentence}`
    } else {
      currentChunk = combined
    }
  }

  // Último chunk
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      index: chunkIndex,
      tokenCount: estimateTokens(currentChunk),
    })
  }

  return chunks
}
