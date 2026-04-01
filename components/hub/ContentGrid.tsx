// Grid de cards de conteúdo — com estado de loading e vazio

'use client'

import { ContentCard } from '@/components/hub/ContentCard'
import { Skeleton } from '@/components/ui/skeleton'
import type { ContentPiece } from '@/types'

interface ContentGridProps {
  items: ContentPiece[]
  workspace: string
  loading?: boolean
}

export function ContentGrid({ items, workspace, loading }: ContentGridProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-lg" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhum conteúdo encontrado.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Crie o primeiro conteúdo clicando em &quot;Novo Conteúdo&quot;.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((content) => (
        <ContentCard key={content.id} content={content} workspace={workspace} />
      ))}
    </div>
  )
}
