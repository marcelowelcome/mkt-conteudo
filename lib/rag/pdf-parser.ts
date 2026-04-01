// Extração de texto de PDFs via unpdf (wrapper server-side)

import { logger } from '@/lib/logger'
import { extractText } from 'unpdf'

interface ParseResult {
  text: string
  pages: number
}

/** Extrai texto de um buffer de PDF */
export async function parsePdf(buffer: Buffer): Promise<ParseResult> {
  try {
    const uint8 = new Uint8Array(buffer)
    const result = await extractText(uint8)

    // text pode ser string ou string[] (uma por página)
    const fullText = Array.isArray(result.text)
      ? result.text.join('\n\n')
      : String(result.text)

    logger.info('PDF parsed', { pages: result.totalPages, textLength: fullText.length })

    return { text: fullText, pages: result.totalPages }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to parse PDF'
    logger.error('PDF parse error', { error: message })
    throw new Error(`Erro ao processar PDF: ${message}`)
  }
}
