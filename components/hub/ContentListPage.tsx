// Página de listagem de conteúdos — filtros por status, canal e busca

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useWorkspaceContent } from '@/hooks/useWorkspaceContent'
import { ContentGrid } from '@/components/hub/ContentGrid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CONTENT_STATUSES, CHANNELS, CHANNEL_LABELS } from '@/lib/constants'
import { Plus, Search } from 'lucide-react'
import type { ContentStatus, Channel } from '@/types'

interface ContentListPageProps {
  workspace: string
}

export function ContentListPage({ workspace }: ContentListPageProps) {
  const [status, setStatus] = useState<ContentStatus | undefined>()
  const [channel, setChannel] = useState<Channel | undefined>()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { items, total, loading, error } = useWorkspaceContent({
    workspaceId: workspace,
    status,
    channel,
    search: search || undefined,
    page,
  })

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Conteúdos</h1>
        <Link href={`/dashboard/${workspace}/content/new`}>
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Novo Conteúdo
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 h-9"
          />
        </div>
        <Select
          value={status ?? 'all'}
          onValueChange={(v) => { setStatus(v === 'all' ? undefined : v as ContentStatus); setPage(1) }}
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {CONTENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={channel ?? 'all'}
          onValueChange={(v) => { setChannel(v === 'all' ? undefined : v as Channel); setPage(1) }}
        >
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {CHANNELS.map((ch) => (
              <SelectItem key={ch} value={ch}>{CHANNEL_LABELS[ch]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Erro */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Grid */}
      <ContentGrid items={items} workspace={workspace} loading={loading} />

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  )
}
