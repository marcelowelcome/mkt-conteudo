// Registro de atividades no activity_log para auditoria

import { createServerSupabaseClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

interface LogActivityParams {
  workspaceId: string
  userId?: string
  action: string
  entityType?: string
  entityId?: string
  details?: Record<string, unknown>
}

/** Registra uma atividade no activity_log — fire-and-forget, nunca falha */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const supabase = createServerSupabaseClient()

    await supabase.from('activity_log').insert({
      workspace_id: params.workspaceId,
      user_id: params.userId ?? null,
      action: params.action,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
      details: params.details ?? null,
    })
  } catch (error) {
    // Log de atividade nunca deve quebrar o fluxo principal
    logger.error('Failed to log activity', {
      action: params.action,
      error: error instanceof Error ? error.message : 'Unknown',
    })
  }
}
