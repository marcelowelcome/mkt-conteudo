// Geração e envio de relatório mensal via Resend

import { createServerSupabaseClient } from '@/lib/supabase'
import { sendEmail } from '@/lib/email-notifications'
import { logger } from '@/lib/logger'

/** Gera e envia relatório mensal para o email configurado */
export async function generateMonthlyReport(workspaceId: string): Promise<boolean> {
  const recipient = process.env.REPORT_RECIPIENT_EMAIL
  if (!recipient) {
    logger.warn('REPORT_RECIPIENT_EMAIL não configurado')
    return false
  }

  const supabase = createServerSupabaseClient()
  const since = new Date(Date.now() - 30 * 86400000).toISOString()

  // Métricas do período
  const [contents, published, adaptations, ws] = await Promise.all([
    supabase.from('content_pieces').select('id', { count: 'exact' }).eq('workspace_id', workspaceId).gte('created_at', since),
    supabase.from('content_adaptations').select('channel', { count: 'exact' }).eq('workspace_id', workspaceId).not('published_at', 'is', null).gte('published_at', since),
    supabase.from('content_adaptations').select('channel').eq('workspace_id', workspaceId).not('published_at', 'is', null).gte('published_at', since),
    supabase.from('workspaces').select('name').eq('id', workspaceId).single(),
  ])

  // Contagem por canal
  const channelCounts: Record<string, number> = {}
  for (const a of adaptations.data ?? []) {
    channelCounts[a.channel] = (channelCounts[a.channel] ?? 0) + 1
  }

  const wsName = ws.data?.name ?? workspaceId
  const month = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const channelRows = Object.entries(channelCounts)
    .map(([ch, count]) => `<tr><td style="padding:4px 12px">${ch}</td><td style="padding:4px 12px">${count}</td></tr>`)
    .join('') || '<tr><td colspan="2" style="padding:8px;color:#888">Nenhuma publicação</td></tr>'

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#111;font-size:24px">${wsName} — Relatório Mensal</h1>
      <p style="color:#666">${month}</p>
      <hr style="border:1px solid #eee">

      <h2 style="font-size:16px">Resumo</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:4px 12px;color:#666">Conteúdos criados</td><td style="font-weight:bold">${contents.count ?? 0}</td></tr>
        <tr><td style="padding:4px 12px;color:#666">Publicações</td><td style="font-weight:bold">${published.count ?? 0}</td></tr>
      </table>

      <h2 style="font-size:16px;margin-top:20px">Publicações por Canal</h2>
      <table style="width:100%;border-collapse:collapse">
        ${channelRows}
      </table>

      <hr style="border:1px solid #eee;margin-top:20px">
      <p style="color:#888;font-size:12px">Content Hub — Welcome Group</p>
    </div>
  `

  const sent = await sendEmail({
    to: recipient,
    subject: `📊 ${wsName} — Relatório ${month}`,
    html,
  })

  if (sent) {
    logger.info('Monthly report sent', { workspaceId, recipient })
  }

  return sent
}
