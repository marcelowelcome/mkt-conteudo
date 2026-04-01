// Timeline de status do conteúdo — mostra ciclo de vida visual

import { Badge } from '@/components/ui/badge'
import { CONTENT_STATUSES, STATUS_COLORS } from '@/lib/constants'
import { Check } from 'lucide-react'
import type { ContentStatus } from '@/types'

interface ContentTimelineProps {
  currentStatus: ContentStatus
}

export function ContentTimeline({ currentStatus }: ContentTimelineProps) {
  const currentIndex = CONTENT_STATUSES.indexOf(currentStatus)

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {CONTENT_STATUSES.filter((s) => s !== 'ARCHIVED').map((status, i) => {
        const isPast = i < currentIndex
        const isCurrent = status === currentStatus

        return (
          <div key={status} className="flex items-center">
            {i > 0 && (
              <div className={`h-px w-4 ${isPast ? 'bg-primary' : 'bg-border'}`} />
            )}
            <Badge
              variant={isCurrent ? 'default' : 'outline'}
              className={`text-[10px] shrink-0 ${
                isPast ? STATUS_COLORS[status] : ''
              } ${isPast ? '' : ''}`}
            >
              {isPast && <Check className="mr-0.5 h-3 w-3" />}
              {status}
            </Badge>
          </div>
        )
      })}
    </div>
  )
}
