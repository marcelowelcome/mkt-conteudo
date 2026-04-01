// Notificações via Telegram Bot API — alertas críticos e relatórios

import { logger } from '@/lib/logger'

const TELEGRAM_API = 'https://api.telegram.org/bot'

/** Envia mensagem de texto via Telegram Bot API */
export async function sendTelegramMessage(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    logger.warn('Telegram não configurado — TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID ausente')
    return false
  }

  try {
    const response = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      logger.error('Telegram send failed', { status: response.status, body })
      return false
    }

    return true
  } catch (error) {
    logger.error('Telegram send error', {
      error: error instanceof Error ? error.message : 'Unknown',
    })
    return false
  }
}
