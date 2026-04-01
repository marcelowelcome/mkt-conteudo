// Tela de streaming — mostra progresso da geração do Claude em tempo real

'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface GeneratingScreenProps {
  contentId: string
  workspaceId: string
  channels: string[]
  onComplete: () => void
}

export function GeneratingScreen({
  contentId,
  workspaceId,
  channels,
  onComplete,
}: GeneratingScreenProps) {
  const [output, setOutput] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usage, setUsage] = useState<{ input_tokens: number; output_tokens: number } | null>(null)

  const startGeneration = useCallback(async () => {
    setGenerating(true)
    setOutput('')
    setError(null)
    setUsage(null)

    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_piece_id: contentId,
          channels,
          workspace_id: workspaceId,
        }),
      })

      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? 'Erro na geração')
        setGenerating(false)
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        setError('Stream não disponível')
        setGenerating(false)
        return
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))

        for (const line of lines) {
          const json = JSON.parse(line.slice(6))
          if (json.text) {
            setOutput((prev) => prev + json.text)
          }
          if (json.done) {
            setUsage(json.usage)
          }
          if (json.error) {
            setError(json.error)
          }
        }
      }

      setGenerating(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na geração')
      setGenerating(false)
    }
  }, [contentId, workspaceId, channels])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Motor de Adaptação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!generating && !output && (
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Gerar adaptações para: {channels.join(', ')}
            </p>
            <Button onClick={startGeneration}>Gerar Adaptações via IA</Button>
          </div>
        )}

        {generating && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando adaptações...
            </div>
            <pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
              {output || 'Aguardando resposta do Claude...'}
            </pre>
          </div>
        )}

        {!generating && output && (
          <div className="space-y-3">
            <pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
              {output}
            </pre>
            {usage && (
              <p className="text-xs text-muted-foreground">
                Tokens: {usage.input_tokens} input / {usage.output_tokens} output
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={startGeneration}>
                Regenerar
              </Button>
              <Button size="sm" onClick={onComplete}>
                Salvar e Continuar
              </Button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}
