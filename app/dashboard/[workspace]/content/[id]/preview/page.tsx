// Preview de adaptações por canal — visualização formatada

import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CHANNEL_LABELS } from '@/lib/constants'
import { escapeHtml } from '@/lib/auth'
import type { Channel, ContentAdaptation } from '@/types'

interface PreviewPageProps {
  params: { workspace: string; id: string }
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const supabase = createServerSupabaseClient()

  const { data: content } = await supabase
    .from('content_pieces')
    .select('title, status')
    .eq('id', params.id)
    .eq('workspace_id', params.workspace)
    .single()

  if (!content) notFound()

  const { data: adaptations } = await supabase
    .from('content_adaptations')
    .select('*')
    .eq('content_piece_id', params.id)
    .order('created_at', { ascending: true })

  const items = (adaptations as ContentAdaptation[]) ?? []

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhuma adaptação gerada. Volte ao editor e clique em &quot;Adaptar Canais&quot;.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-bold">{content.title}</h1>
        <p className="text-sm text-muted-foreground">Preview das adaptações por canal</p>
      </div>

      <Tabs defaultValue={items[0].channel}>
        <TabsList>
          {items.map((a) => (
            <TabsTrigger key={a.channel} value={a.channel}>
              {CHANNEL_LABELS[a.channel as Channel] ?? a.channel}
            </TabsTrigger>
          ))}
        </TabsList>

        {items.map((a) => (
          <TabsContent key={a.channel} value={a.channel}>
            <ChannelFullPreview adaptation={a} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function ChannelFullPreview({ adaptation }: { adaptation: ContentAdaptation }) {
  const output = adaptation.ai_output as Record<string, unknown> | null
  if (!output) return <p className="text-sm text-muted-foreground">Sem dados.</p>

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          {CHANNEL_LABELS[adaptation.channel as Channel]}
        </CardTitle>
        <Badge variant="secondary">{adaptation.status}</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          {Object.entries(output).map(([key, value]) => {
            if (key === 'strategic_note') return null
            return (
              <div key={key}>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </p>
                <div className="rounded bg-muted p-3 text-xs whitespace-pre-wrap">
                  {renderValue(value)}
                </div>
              </div>
            )
          })}
          {typeof output.strategic_note === 'string' && (
            <div className="border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Nota Estratégica</p>
              <p className="text-xs text-muted-foreground italic">
                {escapeHtml(output.strategic_note)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function renderValue(value: unknown): string {
  if (typeof value === 'string') return escapeHtml(value)
  if (Array.isArray(value)) return value.map((v) => escapeHtml(String(v))).join(', ')
  if (typeof value === 'object' && value !== null) return JSON.stringify(value, null, 2)
  return String(value)
}
