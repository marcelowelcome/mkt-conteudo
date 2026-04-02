// POST teste de notificação Telegram — envia mensagem de teste

import { NextRequest, NextResponse } from 'next/server'
import { apiSuccess, apiError } from '@/lib/api-response'
import { sendTelegramMessage } from '@/lib/telegram'
import { logger } from '@/lib/logger'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const success = await sendTelegramMessage(
      '✅ <b>Content Hub</b> — Teste de notificação Telegram funcionando!'
    )

    if (!success) {
      return apiError('Falha ao enviar. Verifique TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID.', 500)
    }

    return apiSuccess({ sent: true })
  } catch (error) {
    logger.error('Telegram test error', { error: (error as Error).message })
    return apiError('Erro no teste Telegram', 500)
  }
}
