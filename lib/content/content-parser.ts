// Parseia e valida JSON gerado pelo Claude — extrai adaptações por canal

import { logger } from '@/lib/logger'
import type { ContentAdaptationOutput } from '@/types'

/** Extrai JSON válido do output do Claude (pode conter markdown code fences) */
export function parseAdaptationOutput(raw: string): ContentAdaptationOutput | null {
  try {
    // Remover possíveis code fences markdown
    let cleaned = raw.trim()
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7)
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3)
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3)
    }
    cleaned = cleaned.trim()

    const parsed = JSON.parse(cleaned) as ContentAdaptationOutput

    // Validação mínima: deve ser um objeto com pelo menos um canal
    if (typeof parsed !== 'object' || parsed === null) {
      logger.error('Parsed output is not an object')
      return null
    }

    const validChannels = ['wordpress', 'email', 'instagram', 'linkedin', 'youtube']
    const foundChannels = Object.keys(parsed).filter((k) => validChannels.includes(k))

    if (foundChannels.length === 0) {
      logger.error('No valid channels found in parsed output', {
        keys: Object.keys(parsed),
      })
      return null
    }

    logger.info('Adaptation output parsed', { channels: foundChannels })
    return parsed
  } catch (error) {
    logger.error('Failed to parse adaptation output', {
      error: error instanceof Error ? error.message : 'Unknown',
      rawLength: raw.length,
      rawPreview: raw.slice(0, 200),
    })
    return null
  }
}
