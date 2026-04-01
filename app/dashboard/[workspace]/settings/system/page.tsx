// Dashboard de saúde do sistema — status APIs, banco e configurações

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface SystemHealth {
  database: Record<string, number>
  apis: Record<string, boolean>
  channels: Array<{ channel: string; is_active: boolean; last_tested_at: string | null }>
  environment: string
}

export default function SystemPage() {
  const params = useParams()
  const workspace = params.workspace as string
  const [data, setData] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/settings/system?workspace_id=${workspace}`)
    const json = await res.json()
    if (json.success) setData(json.data)
    setLoading(false)
  }, [workspace])

  useEffect(() => { fetch_() }, [fetch_])

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-40" />)}</div>
  }

  if (!data) return <p className="text-sm text-muted-foreground">Erro ao carregar.</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Saúde do Sistema</h1>
        <Button variant="outline" size="sm" onClick={fetch_}>
          <RefreshCw className="mr-1 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Banco de dados */}
      <Card>
        <CardHeader><CardTitle className="text-base">Banco de Dados</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(data.database).map(([table, count]) => (
              <div key={table}>
                <p className="text-xs text-muted-foreground">{table.replace(/_/g, ' ')}</p>
                <p className="text-lg font-bold">{count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* APIs */}
      <Card>
        <CardHeader><CardTitle className="text-base">APIs e Integrações</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(data.apis).map(([api, configured]) => (
              <div key={api} className="flex items-center gap-2">
                <Badge variant={configured ? 'default' : 'secondary'} className="text-[10px]">
                  {configured ? '✓' : '✗'}
                </Badge>
                <span className="text-sm">{api.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Canais */}
      <Card>
        <CardHeader><CardTitle className="text-base">Canais do Workspace</CardTitle></CardHeader>
        <CardContent>
          {data.channels.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum canal configurado.</p>
          ) : (
            <div className="space-y-2">
              {data.channels.map((ch) => (
                <div key={ch.channel} className="flex items-center justify-between rounded border p-2">
                  <span className="text-sm font-medium">{ch.channel}</span>
                  <Badge variant={ch.is_active ? 'default' : 'outline'}>
                    {ch.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Ambiente: {data.environment}
      </p>
    </div>
  )
}
