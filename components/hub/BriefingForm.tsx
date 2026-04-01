// Formulário de briefing — criação de novo conteúdo

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CHANNELS, CHANNEL_LABELS } from '@/lib/constants'
import type { Channel } from '@/types'

interface BriefingFormProps {
  workspace: string
}

export function BriefingForm({ workspace }: BriefingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [body, setBody] = useState('')
  const [targetPersona, setTargetPersona] = useState('')
  const [keywords, setKeywords] = useState('')
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>([])

  function toggleChannel(ch: Channel) {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    setError(null)

    const res = await fetch('/api/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspace_id: workspace,
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        body: body.trim() || null,
        target_persona: targetPersona.trim() || null,
        keywords: keywords.trim() ? keywords.split(',').map((k) => k.trim()) : null,
        target_channels: selectedChannels.length > 0 ? selectedChannels : null,
      }),
    })

    const json = await res.json()
    setLoading(false)

    if (!json.success) {
      setError(json.error ?? 'Erro ao criar conteúdo')
      return
    }

    router.push(`/dashboard/${workspace}/content/${json.data.id}`)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Novo Conteúdo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Título do conteúdo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtítulo</Label>
            <Input
              id="subtitle"
              placeholder="Subtítulo (opcional)"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Conteúdo principal</Label>
            <Textarea
              id="body"
              placeholder="Escreva o conteúdo-base ou cole um texto existente..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="persona">Persona alvo</Label>
              <Input
                id="persona"
                placeholder="Ex: casais 30-45 anos"
                value={targetPersona}
                onChange={(e) => setTargetPersona(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keywords">Palavras-chave</Label>
              <Input
                id="keywords"
                placeholder="Separadas por vírgula"
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
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading || !title.trim()}>
            {loading ? 'Criando...' : 'Criar Rascunho'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
