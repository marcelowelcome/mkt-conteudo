// Preview formatado de adaptação por canal — com ações de aprovação

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CHANNEL_LABELS, ADAPTATION_STATUS_COLORS } from '@/lib/constants'
import { escapeHtml } from '@/lib/auth'
import { ExternalLink, Check, RotateCcw, MessageSquare } from 'lucide-react'
import type { ContentAdaptation, Channel, AdaptationStatus } from '@/types'

interface ChannelPreviewProps {
  adaptation: ContentAdaptation
  workspace?: string
  onStatusChange?: () => void
}

export function ChannelPreview({ adaptation, workspace, onStatusChange }: ChannelPreviewProps) {
  const label = CHANNEL_LABELS[adaptation.channel as Channel] ?? adaptation.channel
  const statusColor = ADAPTATION_STATUS_COLORS[adaptation.status] ?? ''
  const output = adaptation.ai_output as Record<string, unknown> | null
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState(adaptation.analyst_notes ?? '')
  const [saving, setSaving] = useState(false)

  async function handleStatusChange(newStatus: AdaptationStatus) {
    setSaving(true)
    await fetch(`/api/content/${adaptation.content_piece_id}/adapt`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adaptation_id: adaptation.id,
        status: newStatus,
        analyst_notes: notes || undefined,
        workspace_id: adaptation.workspace_id,
      }),
    })
    setSaving(false)
    onStatusChange?.()
  }

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

        {/* Notas do analista */}
        {showNotes && (
          <Textarea
            placeholder="Notas de revisão..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="text-xs"
          />
        )}

        {adaptation.analyst_notes && !showNotes && (
          <p className="text-xs text-muted-foreground italic rounded bg-muted p-2">
            Nota: {adaptation.analyst_notes}
          </p>
        )}

        {/* Ações */}
        {adaptation.status === 'PENDING' && (
          <div className="flex items-center gap-1 pt-1">
            <Button
              size="sm" variant="outline" className="h-7 text-xs"
              onClick={() => handleStatusChange('APPROVED')}
              disabled={saving}
            >
              <Check className="mr-1 h-3 w-3" />
              Aprovar
            </Button>
            <Button
              size="sm" variant="outline" className="h-7 text-xs"
              onClick={() => { setShowNotes(true) }}
            >
              <MessageSquare className="mr-1 h-3 w-3" />
              Nota
            </Button>
            <Button
              size="sm" variant="outline" className="h-7 text-xs text-destructive"
              onClick={() => handleStatusChange('REVISION_REQUESTED')}
              disabled={saving}
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Revisar
            </Button>
          </div>
        )}
        {adaptation.status === 'REVISION_REQUESTED' && (
          <div className="flex items-center gap-1 pt-1">
            <Button
              size="sm" variant="outline" className="h-7 text-xs"
              onClick={() => handleStatusChange('APPROVED')}
              disabled={saving}
            >
              <Check className="mr-1 h-3 w-3" />
              Aprovar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function renderOutput(output: Record<string, unknown>) {
  const strategicNote = typeof output.strategic_note === 'string' ? output.strategic_note : null
  const entries = Object.entries(output).filter(([k]) => !k.includes('strategic_note'))
  const mainFields = entries
    .filter(([, v]) => typeof v === 'string' || Array.isArray(v))
    .slice(0, 4)

  return (
    <>
      {mainFields.map(([key, value]) => (
        <div key={key}>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            {key.replace(/_/g, ' ')}
          </p>
          <p className="text-xs whitespace-pre-wrap line-clamp-3">
            {renderValue(value)}
          </p>
        </div>
      ))}
      {entries.length > 4 && (
        <p className="text-[10px] text-muted-foreground">+{entries.length - 4} campo(s)</p>
      )}
      {strategicNote && (
        <div className="mt-2 rounded bg-muted p-2 text-xs text-muted-foreground">
          <strong>Nota estratégica:</strong> {escapeHtml(strategicNote)}
        </div>
      )}
    </>
  )
}

function renderValue(value: unknown): string {
  if (typeof value === 'string') return escapeHtml(value).slice(0, 300)
  if (Array.isArray(value)) return value.map((v) => escapeHtml(String(v))).join(', ')
  return String(value)
}
