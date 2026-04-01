// Página de edição de conteúdo individual + painel de adaptações

import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { ContentEditor } from '@/components/hub/ContentEditor'
import { AdaptationPanel } from '@/components/hub/AdaptationPanel'
import { StrategyChatPanel } from '@/components/hub/StrategyChatPanel'
import type { ContentPiece, ContentAdaptation, Channel } from '@/types'

interface ContentDetailPageProps {
  params: { workspace: string; id: string }
}

export default async function ContentDetailPage({ params }: ContentDetailPageProps) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('content_pieces')
    .select('*')
    .eq('id', params.id)
    .eq('workspace_id', params.workspace)
    .single()

  if (error || !data) {
    notFound()
  }

  // Buscar adaptações existentes
  const { data: adaptations } = await supabase
    .from('content_adaptations')
    .select('*')
    .eq('content_piece_id', params.id)
    .order('created_at', { ascending: true })

  const content = data as ContentPiece
  const channels = (content.target_channels as Channel[]) ?? []

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ContentEditor content={content} workspace={params.workspace} />
      {channels.length > 0 && (
        <AdaptationPanel
          contentId={content.id}
          workspaceId={params.workspace}
          channels={channels}
          initialAdaptations={(adaptations as ContentAdaptation[]) ?? []}
        />
      )}
      <StrategyChatPanel contentId={content.id} workspaceId={params.workspace} />
    </div>
  )
}
