// Busca configuração de canal — banco (channel_configs) com fallback para env vars

import { createServerSupabaseClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { Channel } from '@/types'

/** Mapa de env vars por canal */
const ENV_FALLBACKS: Record<Channel, Record<string, string>> = {
  wordpress: {
    site_url: 'WP_SITE_URL',
    username: 'WP_APP_USERNAME',
    password: 'WP_APP_PASSWORD',
  },
  email: {
    api_key: 'AC_API_KEY',
    api_url: 'AC_API_URL',
  },
  instagram: {
    access_token: 'META_ACCESS_TOKEN',
    ig_user_id: 'META_IG_USER_ID',
    app_id: 'META_APP_ID',
    app_secret: 'META_APP_SECRET',
  },
  linkedin: {
    access_token: 'LINKEDIN_ACCESS_TOKEN',
    organization_id: 'LINKEDIN_ORGANIZATION_ID',
  },
  youtube: {
    client_id: 'GOOGLE_CLIENT_ID',
    client_secret: 'GOOGLE_CLIENT_SECRET',
    refresh_token: 'GOOGLE_REFRESH_TOKEN',
  },
}

/** Campos obrigatórios por canal */
export const REQUIRED_FIELDS: Record<Channel, string[]> = {
  wordpress: ['site_url', 'username', 'password'],
  email: ['api_key', 'api_url'],
  instagram: ['access_token', 'ig_user_id'],
  linkedin: ['access_token', 'organization_id'],
  youtube: ['client_id', 'client_secret', 'refresh_token'],
}

/** Rótulos dos campos para a UI */
export const FIELD_LABELS: Record<string, string> = {
  site_url: 'URL do Site',
  username: 'Usuário',
  password: 'Senha / App Password',
  api_key: 'API Key',
  api_url: 'API URL',
  access_token: 'Access Token',
  ig_user_id: 'Instagram User ID',
  app_id: 'App ID',
  app_secret: 'App Secret',
  organization_id: 'Organization ID',
  client_id: 'Client ID',
  client_secret: 'Client Secret',
  refresh_token: 'Refresh Token',
}

/** Campos que devem ser exibidos como password na UI */
export const SENSITIVE_FIELDS = [
  'password', 'api_key', 'access_token', 'app_secret', 'client_secret', 'refresh_token',
]

/** Busca config do canal: primeiro do banco, depois das env vars */
export async function getChannelConfig(
  workspaceId: string,
  channel: Channel
): Promise<Record<string, string>> {
  const supabase = createServerSupabaseClient()

  // 1. Tentar do banco
  const { data } = await supabase
    .from('channel_configs')
    .select('config, is_active')
    .eq('workspace_id', workspaceId)
    .eq('channel', channel)
    .single()

  const dbConfig = (data?.config as Record<string, string>) ?? {}

  // 2. Merge com env vars (banco tem prioridade)
  const envMap = ENV_FALLBACKS[channel] ?? {}
  const merged: Record<string, string> = {}

  for (const [field, envKey] of Object.entries(envMap)) {
    merged[field] = dbConfig[field] || process.env[envKey] || ''
  }

  return merged
}

/** Verifica se canal está configurado (todos os campos obrigatórios preenchidos) */
export async function isChannelConfigured(
  workspaceId: string,
  channel: Channel
): Promise<boolean> {
  const config = await getChannelConfig(workspaceId, channel)
  const required = REQUIRED_FIELDS[channel] ?? []
  return required.every((field) => !!config[field])
}

/** Salva config do canal no banco */
export async function saveChannelConfig(
  workspaceId: string,
  channel: Channel,
  config: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient()

  const { error } = await supabase
    .from('channel_configs')
    .upsert(
      {
        workspace_id: workspaceId,
        channel,
        config,
        is_active: true,
      },
      { onConflict: 'workspace_id,channel' }
    )

  if (error) {
    logger.error('Failed to save channel config', { channel, error: error.message })
    return { success: false, error: error.message }
  }

  return { success: true }
}
