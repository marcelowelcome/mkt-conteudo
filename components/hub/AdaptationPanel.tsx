// Painel de adaptações — lista versões por canal com ações

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChannelPreview } from '@/components/hub/ChannelPreview'
import { GeneratingScreen } from '@/components/hub/GeneratingScreen'
import { Sparkles } from 'lucide-react'
import type { ContentAdaptation, Channel } from '@/types'

interface AdaptationPanelProps {
  contentId: string
  workspaceId: string
  channels: Channel[]
  initialAdaptations?: ContentAdaptation[]
}

export function AdaptationPanel({
  contentId,
  workspaceId,
  channels,
  initialAdaptations = [],
}: AdaptationPanelProps) {
  const adaptations = initialAdaptations
  const [loading] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [adapting, setAdapting] = useState(false)

  async function handleAdapt() {
    setAdapting(true)
    const res = await fetch(`/api/content/${contentId}/adapt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channels, workspace_id: workspaceId }),
    })
    const json = await res.json()
    setAdapting(false)

    if (json.success) {
      window.location.reload()
    }
  }

  if (showGenerator) {
    return (
      <GeneratingScreen
        contentId={contentId}
        workspaceId={workspaceId}
        channels={channels}
        onComplete={() => {
          setShowGenerator(false)
          handleAdapt()
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Adaptações por Canal</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGenerator(true)}
            >
              <Sparkles className="mr-1 h-4 w-4" />
              Preview Streaming
            </Button>
            <Button
              size="sm"
              onClick={handleAdapt}
              disabled={adapting || channels.length === 0}
            >
              {adapting ? 'Gerando...' : 'Adaptar Canais'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : adaptations.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma adaptação gerada ainda. Clique em &quot;Adaptar Canais&quot; para gerar.
            </p>
          ) : (
            <div className="space-y-3">
              {adaptations.map((a) => (
                <ChannelPreview key={a.id} adaptation={a} workspace={workspaceId} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
