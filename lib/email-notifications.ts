// Notificações por email via Resend — aprovação, publicação, relatórios

import { logger } from '@/lib/logger'

const RESEND_API = 'https://api.resend.com/emails'

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

/** Envia email via Resend API */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    logger.warn('Resend não configurado — RESEND_API_KEY ausente')
    return false
  }

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'Content Hub <noreply@welcometrips.com.br>',
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      logger.error('Resend send failed', { status: res.status, body })
      return false
    }

    return true
  } catch (error) {
    logger.error('Resend send error', {
      error: error instanceof Error ? error.message : 'Unknown',
    })
    return false
  }
}

/** Notifica aprovação de adaptação */
export async function notifyApproval(channel: string, title: string): Promise<void> {
  const recipient = process.env.REPORT_RECIPIENT_EMAIL
  if (!recipient) return

  await sendEmail({
    to: recipient,
    subject: `✅ Adaptação aprovada — ${channel}: ${title}`,
    html: `
      <h2>Adaptação Aprovada</h2>
      <p><strong>Canal:</strong> ${channel}</p>
      <p><strong>Conteúdo:</strong> ${title}</p>
      <p>A adaptação foi aprovada e está pronta para agendamento/publicação.</p>
      <hr>
      <p style="color: #888; font-size: 12px;">Content Hub — Welcome Group</p>
    `,
  })
}
