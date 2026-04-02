// Preview formatado de adaptação por canal — resiliente a nomes variados do Claude

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CHANNEL_LABELS, ADAPTATION_STATUS_COLORS } from '@/lib/constants'
import { escapeHtml } from '@/lib/auth'
import { ExternalLink } from 'lucide-react'
import type { ContentAdaptation, Channel } from '@/types'

interface ChannelPreviewProps {
  adaptation: ContentAdaptation
  workspace?: string
}

export function ChannelPreview({ adaptation, workspace }: ChannelPreviewProps) {
  const label = CHANNEL_LABELS[adaptation.channel as Channel] ?? adaptation.channel
  const statusColor = ADAPTATION_STATUS_COLORS[adaptation.status] ?? ''
  const output = adaptation.ai_output as Record<string, unknown> | null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm">{label}</CardTitle>
        <div className="flex items-center gap-2">
          <Badge className={`text-[10px] ${statusColor}`} variant="secondary">
            {adaptation.status}
          </Badge>
          {workspace && (
            <Link href={`/dashboard/${workspace}/content/${adaptation.content_piece_id}/preview`}>
              <Button variant="ghost" size="sm" className="h-6 px-2">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {output ? (
          <div className="space-y-2 text-sm">
            {renderOutput(output)}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Sem dados de adaptação.</p>
        )}
      </CardContent>
    </Card>
  )
}

/** Renderiza campos do output de forma genérica — resiliente a nomes variados */
function renderOutput(output: Record<string, unknown>) {
  // Separar nota estratégica do resto
  const strategicNote = findField(output, ['strategic_note', 'nota_estrategica'])
  const entries = Object.entries(output).filter(([k]) =>
    !k.includes('strategic_note') && !k.includes('nota_estrategica')
  )

  // Mostrar os 4 primeiros campos relevantes
  const mainFields = entries
    .filter(([, v]) => typeof v === 'string' || Array.isArray(v))
    .slice(0, 4)

  return (
    <>
      {mainFields.map(([key, value]) => (
        <div key={key}>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            {formatKey(key)}
          </p>
          <p className="text-xs whitespace-pre-wrap line-clamp-3">
            {renderValue(value)}
          </p>
        </div>
      ))}
      {entries.length > 4 && (
        <p className="text-[10px] text-muted-foreground">
          +{entries.length - 4} campo(s)
        </p>
      )}
      {typeof strategicNote === 'string' && (
        <div className="mt-2 rounded bg-muted p-2 text-xs text-muted-foreground">
          <strong>Nota estratégica:</strong> {escapeHtml(strategicNote)}
        </div>
      )}
    </>
  )
}

function findField(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    if (k in obj) return obj[k]
  }
  return undefined
}

function formatKey(key: string): string {
  return key.replace(/_/g, ' ')
}

function renderValue(value: unknown): string {
  if (typeof value === 'string') return escapeHtml(value).slice(0, 300)
  if (Array.isArray(value)) return value.map((v) => escapeHtml(String(v))).join(', ')
  return String(value)
}
