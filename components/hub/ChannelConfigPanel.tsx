// Painel de configuração de credenciais por canal

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Save, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react'

interface ChannelInfo {
  channel: string
  label: string
  configured: boolean
  required_fields: string[]
  config: Record<string, string>
}

const FIELD_LABELS: Record<string, string> = {
  site_url: 'URL do Site',
  username: 'Usuário',
  password: 'Senha / App Password',
  api_key: 'API Key',
  api_url: 'API URL',
  access_token: 'Access Token',
  ig_user_id: 'Instagram User ID',
  app_id: 'App ID',
  app_secret: 'App Secret',
  organization_id: 'Organization ID',
  client_id: 'Client ID',
  client_secret: 'Client Secret',
  refresh_token: 'Refresh Token',
}

const SENSITIVE_FIELDS = [
  'password', 'api_key', 'access_token', 'app_secret', 'client_secret', 'refresh_token',
]

interface ChannelConfigPanelProps {
  workspace: string
}

export function ChannelConfigPanel({ workspace }: ChannelConfigPanelProps) {
  const [channels, setChannels] = useState<ChannelInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [editingChannel, setEditingChannel] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  const fetchChannels = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/settings/channels?workspace_id=${workspace}`)
    const json = await res.json()
    if (json.success) setChannels(json.data)
    setLoading(false)
  }, [workspace])

  useEffect(() => { fetchChannels() }, [fetchChannels])

  function handleEdit(ch: ChannelInfo) {
    setEditingChannel(ch.channel)
    // Limpar valores mascarados para campos sensíveis
    const clean: Record<string, string> = {}
    for (const [key, value] of Object.entries(ch.config)) {
      clean[key] = value.includes('••••') ? '' : value
    }
    setFormData(clean)
    setMessage(null)
  }

  async function handleSave(channel: string) {
    setSaving(true)
    setMessage(null)

    const res = await fetch('/api/settings/channels', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace_id: workspace, channel, config: formData }),
    })

    const json = await res.json()
    setSaving(false)

    if (json.success) {
      setMessage({ type: 'success', text: 'Credenciais salvas!' })
      setEditingChannel(null)
      fetchChannels()
    } else {
      setMessage({ type: 'error', text: json.error ?? 'Erro ao salvar' })
    }
  }

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Canais</h1>
        <p className="text-sm text-muted-foreground">
          Configure as credenciais de cada canal de distribuição.
        </p>
      </div>

      {message && (
        <div className={`rounded-md p-3 text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {channels.map((ch) => (
        <Card key={ch.channel}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base">{ch.label}</CardTitle>
              <Badge variant={ch.configured ? 'default' : 'secondary'} className="text-[10px]">
                {ch.configured ? (
                  <><CheckCircle className="mr-1 h-3 w-3" />Configurado</>
                ) : (
                  <><XCircle className="mr-1 h-3 w-3" />Pendente</>
                )}
              </Badge>
            </div>
            {editingChannel !== ch.channel && (
              <Button variant="outline" size="sm" onClick={() => handleEdit(ch)}>
                Editar
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editingChannel === ch.channel ? (
              <div className="space-y-3">
                {ch.required_fields.map((field) => {
                  const isSensitive = SENSITIVE_FIELDS.includes(field)
                  const isVisible = showSecrets[field] ?? false

                  return (
                    <div key={field} className="space-y-1">
                      <Label htmlFor={`${ch.channel}-${field}`} className="text-xs">
                        {FIELD_LABELS[field] ?? field}
                      </Label>
                      <div className="flex gap-1">
                        <Input
                          id={`${ch.channel}-${field}`}
                          type={isSensitive && !isVisible ? 'password' : 'text'}
                          placeholder={ch.config[field]?.includes('••••') ? ch.config[field] : ''}
                          value={formData[field] ?? ''}
                          onChange={(e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }))}
                          className="text-sm"
                        />
                        {isSensitive && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowSecrets((prev) => ({ ...prev, [field]: !isVisible }))}
                          >
                            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={() => handleSave(ch.channel)} disabled={saving}>
                    <Save className="mr-1 h-4 w-4" />
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditingChannel(null)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-sm">
                {ch.required_fields.map((field) => (
                  <div key={field}>
                    <p className="text-xs text-muted-foreground">{FIELD_LABELS[field] ?? field}</p>
                    <p className="font-mono text-xs">
                      {ch.config[field] ? (
                        SENSITIVE_FIELDS.includes(field) ? ch.config[field] : ch.config[field]
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
