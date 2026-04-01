// Editor de conteúdo — campos estruturados + ações de status

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ContentTimeline } from '@/components/hub/ContentTimeline'
import { CHANNELS, CHANNEL_LABELS, VALID_STATUS_TRANSITIONS } from '@/lib/constants'
import { Save, ArrowRight, Trash2 } from 'lucide-react'
import type { ContentPiece, Channel, ContentStatus } from '@/types'

interface ContentEditorProps {
  content: ContentPiece
  workspace: string
}

export function ContentEditor({ content, workspace }: ContentEditorProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [title, setTitle] = useState(content.title)
  const [subtitle, setSubtitle] = useState(content.subtitle ?? '')
  const [body, setBody] = useState(content.body ?? '')
  const [targetPersona, setTargetPersona] = useState(content.target_persona ?? '')
  const [keywords, setKeywords] = useState(content.keywords?.join(', ') ?? '')
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>(
    (content.target_channels as Channel[]) ?? []
  )

  const nextStatuses = VALID_STATUS_TRANSITIONS[content.status] ?? []

  function toggleChannel(ch: Channel) {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    )
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(null)

    const res = await fetch(`/api/content/${content.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        body: body.trim() || null,
        target_persona: targetPersona.trim() || null,
        keywords: keywords.trim() ? keywords.split(',').map((k) => k.trim()) : null,
        target_channels: selectedChannels.length > 0 ? selectedChannels : null,
      }),
    })

    const json = await res.json()
    setSaving(false)

    if (!json.success) {
      setError(json.error ?? 'Erro ao salvar')
      return
    }
    setSuccess('Salvo com sucesso')
    setTimeout(() => setSuccess(null), 2000)
  }

  async function handleStatusChange(newStatus: ContentStatus) {
    const res = await fetch(`/api/content/${content.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })

    const json = await res.json()
    if (!json.success) {
      setError(json.error ?? 'Erro ao mudar status')
      return
    }
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja excluir este conteúdo?')) return

    const res = await fetch(`/api/content/${content.id}`, { method: 'DELETE' })
    const json = await res.json()

    if (!json.success) {
      setError(json.error ?? 'Erro ao excluir')
      return
    }
    router.push(`/dashboard/${workspace}/content`)
  }

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <ContentTimeline currentStatus={content.status} />

      {/* Editor */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Editar Conteúdo</CardTitle>
          <Badge variant="secondary">{content.status}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtítulo</Label>
            <Input
              id="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Conteúdo principal</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="persona">Persona alvo</Label>
              <Input
                id="persona"
                value={targetPersona}
                onChange={(e) => setTargetPersona(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keywords">Palavras-chave</Label>
              <Input
                id="keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Canais de destino</Label>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((ch) => (
                <Badge
                  key={ch}
                  variant={selectedChannels.includes(ch) ? 'default' : 'outline'}
                  className="cursor-pointer select-none"
                  onClick={() => toggleChannel(ch)}
                >
                  {CHANNEL_LABELS[ch]}
                </Badge>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="mr-1 h-4 w-4" />
          Excluir
        </Button>

        <div className="flex flex-wrap gap-2">
          {nextStatuses.filter((s) => s !== 'ARCHIVED').map((status) => (
            <Button
              key={status}
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange(status)}
            >
              <ArrowRight className="mr-1 h-4 w-4" />
              {status}
            </Button>
          ))}
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="mr-1 h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
