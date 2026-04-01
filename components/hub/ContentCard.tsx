// Card de conteúdo — exibe título, status, canais e data

'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { STATUS_COLORS, CHANNEL_LABELS } from '@/lib/constants'
import type { ContentPiece } from '@/types'

interface ContentCardProps {
  content: ContentPiece
  workspace: string
}

export function ContentCard({ content, workspace }: ContentCardProps) {
  const statusColor = STATUS_COLORS[content.status] ?? ''

  return (
    <Link href={`/dashboard/${workspace}/content/${content.id}`}>
      <Card className="transition-shadow hover:shadow-md cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold leading-tight line-clamp-2">
              {content.title}
            </h3>
            <Badge className={`shrink-0 text-[10px] ${statusColor}`} variant="secondary">
              {content.status}
            </Badge>
          </div>
          {content.subtitle && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {content.subtitle}
            </p>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1">
            {content.target_channels?.map((ch) => (
              <Badge key={ch} variant="outline" className="text-[10px]">
                {CHANNEL_LABELS[ch] ?? ch}
              </Badge>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            {formatDate(content.created_at)}
            {content.target_persona && ` · ${content.target_persona}`}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
