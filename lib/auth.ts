// Validação de segurança — cron secret e sanitização HTML

import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'

/** Valida CRON_SECRET no header Authorization para cron jobs */
export function validateCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false

  const token = authHeader.replace('Bearer ', '')
  const secret = process.env.CRON_SECRET

  if (!secret || secret.length < 32) {
    logger.error('CRON_SECRET não configurado ou menor que 32 chars')
    return false
  }

  return token === secret
}

/** Escapa HTML para prevenir XSS em conteúdo gerado por IA */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/** Extrai workspace_id validado dos params da rota */
export function getWorkspaceId(params: { workspace?: string }): string | null {
  const id = params.workspace
  if (!id || typeof id !== 'string') return null
  // Aceita apenas IDs alfanuméricos curtos (ex: 'wt', 'ww')
  if (!/^[a-z]{2,10}$/.test(id)) return null
  return id
}
