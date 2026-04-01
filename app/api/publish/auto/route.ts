// POST auto-publish cron — publica entradas agendadas com scheduled_for <= now

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response'
import { validateCronSecret } from '@/lib/auth'
import { publishToWordPress } from '@/lib/publishers/wordpress-publisher'
import { publishToActiveCampaign } from '@/lib/publishers/activecampaign-publisher'
import { publishToInstagram } from '@/lib/publishers/instagram-publisher'
import { publishToLinkedIn } from '@/lib/publishers/linkedin-publisher'
import { sendTelegramMessage } from '@/lib/telegram'
import { logger } from '@/lib/logger'
import type {
  PublishResult, WordPressAdaptation, EmailAdaptation,
  InstagramAdaptation, LinkedInAdaptation,
} from '@/types'

export const POST = withErrorHandler(async (request: NextRequest) => {
  if (!validateCronSecret(request)) {
    return apiError('CRON_SECRET inválido', 401)
  }

  const supabase = createServerSupabaseClient()

  const { data: entries, error } = await supabase
    .from('editorial_calendar')
    .select('*, content_adaptations(*)')
    .eq('auto_publish', true)
    .eq('status', 'SCHEDULED')
    .lte('scheduled_for', new Date().toISOString())

  if (error) {
    return apiError(error.message, 500)
  }

  if (!entries?.length) {
    return apiSuccess({ published: 0, message: 'Nenhuma entrada para publicar' })
  }

  logger.info('Auto-publish: entries found', { count: entries.length })

  const results: Array<{ id: string; channel: string; result: PublishResult }> = []

  for (const entry of entries) {
    const adaptation = entry.content_adaptations
    if (!adaptation?.ai_output) continue

    let result: PublishResult

    switch (entry.channel) {
      case 'wordpress': {
        const o = adaptation.ai_output as WordPressAdaptation
        result = await publishToWordPress({
          title: adaptation.title_edited ?? o.title,
          body_html: adaptation.body_edited ?? o.body_html,
          meta_description: o.meta_description,
          tags: o.tags,
          status: 'publish',
        })
        break
      }
      case 'email': {
        const o = adaptation.ai_output as EmailAdaptation
        result = await publishToActiveCampaign({
          subject: adaptation.subject_edited ?? o.subject_a,
          preheader: o.preheader,
          body_html: adaptation.body_edited ?? o.body_html,
          cta_text: o.cta_text,
          cta_url: o.cta_url,
        })
        break
      }
      case 'instagram': {
        const o = adaptation.ai_output as InstagramAdaptation
        const caption = adaptation.body_edited ?? o.caption
        const rawHashtags = adaptation.hashtags_edited ?? o.hashtags
        const htags = Array.isArray(rawHashtags) ? rawHashtags : []
        const hstr = htags.map((h: string) => `#${h.replace('#', '')}`).join(' ')
        result = await publishToInstagram({
          caption: hstr ? `${caption}\n\n${hstr}` : caption,
        })
        break
      }
      case 'linkedin': {
        const o = adaptation.ai_output as LinkedInAdaptation
        result = await publishToLinkedIn({
          text: adaptation.body_edited ?? o.post_text,
        })
        break
      }
      default:
        result = { success: false, error: `Canal ${entry.channel} não suportado` }
    }

    results.push({ id: entry.id, channel: entry.channel, result })

    if (result.success) {
      await supabase
        .from('editorial_calendar')
        .update({ status: 'PUBLISHED', updated_at: new Date().toISOString() })
        .eq('id', entry.id)

      await supabase
        .from('content_adaptations')
        .update({
          published_at: new Date().toISOString(),
          publish_id: result.publishId ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', adaptation.id)
    } else {
      await supabase
        .from('content_adaptations')
        .update({ publish_error: result.error ?? null, updated_at: new Date().toISOString() })
        .eq('id', adaptation.id)

      // Alerta Telegram em caso de falha
      await sendTelegramMessage(
        `⚠️ <b>Auto-publish falhou</b>\nCanal: ${entry.channel}\nErro: ${result.error?.slice(0, 100)}`
      )
    }
  }

  const published = results.filter((r) => r.result.success).length
  const failed = results.length - published

  logger.info('Auto-publish completed', { total: results.length, published, failed })

  if (failed > 0) {
    await sendTelegramMessage(
      `📊 <b>Auto-publish</b>: ${published}/${results.length} publicados, ${failed} falha(s)`
    )
  }

  return apiSuccess({ published, failed, total: results.length, results })
})
