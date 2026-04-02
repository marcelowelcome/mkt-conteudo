// Log de atividades do workspace

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface ActivityEntry {
  id: string
  action: string
  entity_type: string | null
  entity_id: string | null
  details: Record<string, unknown> | null
  created_at: string
}

export default function ActivityPage() {
  const params = useParams()
  const workspace = params.workspace as string
  const [items, setItems] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchActivity = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/settings/activity?workspace_id=${workspace}&page=${page}&limit=30`)
    const json = await res.json()
    if (json.success) {
      setItems(json.data.items)
      setTotal(json.data.total)
    }
    setLoading(false)
  }, [workspace, page])

  useEffect(() => { fetchActivity() }, [fetchActivity])

  const totalPages = Math.ceil(total / 30)

  const ACTION_COLORS: Record<string, string> = {
    'content.created': 'bg-green-100 text-green-800',
    'content.approved': 'bg-blue-100 text-blue-800',
    'content.adapted': 'bg-purple-100 text-purple-800',
    'content.deleted': 'bg-red-100 text-red-800',
    'publish.wordpress': 'bg-orange-100 text-orange-800',
    'publish.instagram': 'bg-pink-100 text-pink-800',
    'knowledge.ingested': 'bg-teal-100 text-teal-800',
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Atividades</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Log ({total} registros)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma atividade.</p>
          ) : (
            <div className="space-y-1">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded px-3 py-2 hover:bg-muted/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge
                      variant="secondary"
                      className={`text-[9px] shrink-0 ${ACTION_COLORS[item.action] ?? ''}`}
                    >
                      {item.action}
                    </Badge>
                    <span className="text-xs text-muted-foreground truncate">
                      {item.entity_type && `${item.entity_type}`}
                      {item.details && Object.keys(item.details).length > 0 && (
                        <> — {summarizeDetails(item.details)}</>
                      )}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                    {new Date(item.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                Anterior
              </Button>
              <span className="text-xs text-muted-foreground">{page}/{totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function summarizeDetails(details: Record<string, unknown>): string {
  const parts: string[] = []
  if (details.title) parts.push(String(details.title).slice(0, 40))
  if (details.channel) parts.push(String(details.channel))
  if (details.status) parts.push(String(details.status))
  if (details.email) parts.push(String(details.email))
  return parts.join(', ') || JSON.stringify(details).slice(0, 60)
}
