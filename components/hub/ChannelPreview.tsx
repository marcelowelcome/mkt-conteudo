// Preview formatado de adaptação por canal

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CHANNEL_LABELS, ADAPTATION_STATUS_COLORS } from '@/lib/constants'
import { escapeHtml } from '@/lib/auth'
import type { ContentAdaptation, Channel } from '@/types'

interface ChannelPreviewProps {
  adaptation: ContentAdaptation
}

export function ChannelPreview({ adaptation }: ChannelPreviewProps) {
  const label = CHANNEL_LABELS[adaptation.channel as Channel] ?? adaptation.channel
  const statusColor = ADAPTATION_STATUS_COLORS[adaptation.status] ?? ''
  const output = adaptation.ai_output as Record<string, unknown> | null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm">{label}</CardTitle>
        <Badge className={`text-[10px] ${statusColor}`} variant="secondary">
          {adaptation.status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        {output ? (
          <div className="space-y-2 text-sm">
            {renderChannelOutput(adaptation.channel as Channel, output)}
            {typeof output.strategic_note === 'string' && (
              <div className="mt-2 rounded bg-muted p-2 text-xs text-muted-foreground">
                <strong>Nota estratégica:</strong>{' '}
                {escapeHtml(output.strategic_note)}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Sem dados de adaptação.</p>
        )}
      </CardContent>
    </Card>
  )
}

function renderChannelOutput(channel: Channel, output: Record<string, unknown>) {
  switch (channel) {
    case 'wordpress':
      return (
        <div className="space-y-1">
          <p><strong>Título:</strong> {escapeHtml(String(output.title ?? ''))}</p>
          <p><strong>Meta:</strong> {escapeHtml(String(output.meta_description ?? ''))}</p>
          <p><strong>Keyword:</strong> {escapeHtml(String(output.focus_keyword ?? ''))}</p>
          <p className="text-xs text-muted-foreground">
            Tags: {Array.isArray(output.tags) ? output.tags.join(', ') : '—'}
          </p>
        </div>
      )
    case 'email':
      return (
        <div className="space-y-1">
          <p><strong>Assunto A:</strong> {escapeHtml(String(output.subject_a ?? ''))}</p>
          <p><strong>Assunto B:</strong> {escapeHtml(String(output.subject_b ?? ''))}</p>
          <p><strong>Preheader:</strong> {escapeHtml(String(output.preheader ?? ''))}</p>
          <p><strong>CTA:</strong> {escapeHtml(String(output.cta_text ?? ''))}</p>
        </div>
      )
    case 'instagram':
      return (
        <div className="space-y-1">
          <p className="whitespace-pre-wrap text-xs">{escapeHtml(String(output.caption ?? ''))}</p>
          <p className="text-xs text-muted-foreground">
            Hashtags: {Array.isArray(output.hashtags) ? output.hashtags.slice(0, 10).join(' ') : '—'}
          </p>
        </div>
      )
    case 'linkedin':
      return (
        <div className="space-y-1">
          <p><strong>Insight:</strong> {escapeHtml(String(output.opening_insight ?? ''))}</p>
          <p className="whitespace-pre-wrap text-xs">
            {escapeHtml(String(output.post_text ?? '')).slice(0, 300)}...
          </p>
        </div>
      )
    case 'youtube':
      return (
        <div className="space-y-1">
          <p><strong>Hook:</strong> {escapeHtml(String(output.script_hook ?? ''))}</p>
          <p><strong>CTA:</strong> {escapeHtml(String(output.script_cta ?? ''))}</p>
        </div>
      )
    default:
      return <pre className="text-xs">{JSON.stringify(output, null, 2)}</pre>
  }
}
