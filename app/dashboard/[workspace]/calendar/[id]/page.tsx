// Editor de entrada individual do calendário editorial

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Save, Trash2 } from 'lucide-react'
import { CHANNEL_LABELS } from '@/lib/constants'
import type { Channel } from '@/types'

interface CalendarEntry {
  id: string
  channel: string
  scheduled_for: string
  status: string
  auto_publish: boolean
  notes: string | null
  content_pieces?: { title: string } | null
}

export default function CalendarEntryPage() {
  const params = useParams()
  const router = useRouter()
  const workspace = params.workspace as string
  const entryId = params.id as string

  const [entry, setEntry] = useState<CalendarEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [scheduledFor, setScheduledFor] = useState('')
  const [status, setStatus] = useState('')
  const [autoPublish, setAutoPublish] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/calendar/${entryId}`)
      const json = await res.json()
      if (json.success) {
        const e = json.data as CalendarEntry
        setEntry(e)
        setScheduledFor(e.scheduled_for.slice(0, 16))
        setStatus(e.status)
        setAutoPublish(e.auto_publish)
        setNotes(e.notes ?? '')
      }
      setLoading(false)
    }
    load()
  }, [entryId])

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/calendar/${entryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheduled_for: new Date(scheduledFor).toISOString(),
        status,
        auto_publish: autoPublish,
        notes: notes.trim() || null,
      }),
    })
    setSaving(false)
    router.push(`/dashboard/${workspace}/calendar`)
  }

  async function handleDelete() {
    if (!confirm('Excluir esta entrada do calendário?')) return
    await fetch(`/api/calendar/${entryId}`, { method: 'DELETE' })
    router.push(`/dashboard/${workspace}/calendar`)
  }

  if (loading) return <Skeleton className="h-64 mx-auto max-w-lg" />

  if (!entry) return <p className="text-sm text-muted-foreground text-center py-12">Entrada não encontrada.</p>

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Editar Entrada</CardTitle>
          {entry.content_pieces?.title && (
            <p className="text-sm text-muted-foreground">{entry.content_pieces.title}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {CHANNEL_LABELS[entry.channel as Channel] ?? entry.channel}
            </Badge>
          </div>

          <div className="space-y-2">
            <Label>Data e horário</Label>
            <Input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SCHEDULED">Agendado</SelectItem>
                <SelectItem value="APPROVED">Aprovado</SelectItem>
                <SelectItem value="PUBLISHED">Publicado</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="auto"
              checked={autoPublish}
              onChange={(e) => setAutoPublish(e.target.checked)}
              className="rounded border-input"
            />
            <Label htmlFor="auto" className="text-sm">Auto-publish (cron)</Label>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Observações sobre esta publicação..."
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-1 h-4 w-4" />
            Excluir
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="mr-1 h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
