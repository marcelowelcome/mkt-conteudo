// GET lista configs de canais / PATCH salva config de um canal

import { NextRequest } from 'next/server'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response'
import {
  getChannelConfig, saveChannelConfig, isChannelConfigured,
  REQUIRED_FIELDS, SENSITIVE_FIELDS,
} from '@/lib/channel-config'
import { CHANNELS, CHANNEL_LABELS } from '@/lib/constants'
import { logActivity } from '@/lib/activity'
import type { Channel } from '@/types'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspace_id')

  if (!workspaceId) {
    return apiError('workspace_id é obrigatório', 400)
  }

  const channels = await Promise.all(
    CHANNELS.map(async (channel) => {
      const config = await getChannelConfig(workspaceId, channel)
      const configured = await isChannelConfigured(workspaceId, channel)

      // Mascarar campos sensíveis para a resposta
      const maskedConfig: Record<string, string> = {}
      for (const [key, value] of Object.entries(config)) {
        if (SENSITIVE_FIELDS.includes(key) && value) {
          maskedConfig[key] = value.slice(0, 4) + '••••' + value.slice(-4)
        } else {
          maskedConfig[key] = value
        }
      }

      return {
        channel,
        label: CHANNEL_LABELS[channel],
        configured,
        required_fields: REQUIRED_FIELDS[channel],
        config: maskedConfig,
      }
    })
  )

  return apiSuccess(channels)
})

export const PATCH = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { workspace_id, channel, config } = body as {
    workspace_id: string
    channel: Channel
    config: Record<string, string>
  }

  if (!workspace_id || !channel || !config) {
    return apiError('workspace_id, channel e config são obrigatórios', 400)
  }

  if (!CHANNELS.includes(channel)) {
    return apiError(`Canal inválido: ${channel}`, 400)
  }

  // Buscar config existente para merge (não perder campos não enviados)
  const existing = await getChannelConfig(workspace_id, channel)
  const merged = { ...existing }
  for (const [key, value] of Object.entries(config)) {
    // Só atualizar se o valor não for o mascarado
    if (value && !value.includes('••••')) {
      merged[key] = value
    }
  }

  const result = await saveChannelConfig(workspace_id, channel, merged)

  if (!result.success) {
    return apiError(result.error ?? 'Erro ao salvar', 500)
  }

  await logActivity({
    workspaceId: workspace_id,
    action: 'channel.configured',
    entityType: 'channel_config',
    details: { channel },
  })

  return apiSuccess({ channel, saved: true })
})
