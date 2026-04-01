// Gestão da Knowledge Base — upload de PDFs, lista e toggle de documentos

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Upload, FileText, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'

interface KnowledgeDocument {
  id: string
  title: string
  source_type: string
  file_name: string | null
  description: string | null
  is_active: boolean
  chunk_count: number
  created_at: string
}

interface KnowledgeBaseManagerProps {
  workspace: string
}

export function KnowledgeBaseManager({ workspace }: KnowledgeBaseManagerProps) {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/knowledge/documents?workspace_id=${workspace}`)
    const json = await res.json()
    if (json.success) {
      setDocuments(json.data)
    }
    setLoading(false)
  }, [workspace])

  useEffect(() => { fetchDocuments() }, [fetchDocuments])

  async function handleUpload() {
    const file = fileRef.current?.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadError(null)
    setUploadSuccess(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('workspace_id', workspace)
    if (title.trim()) formData.append('title', title.trim())

    const res = await fetch('/api/knowledge/ingest', {
      method: 'POST',
      body: formData,
    })

    const json = await res.json()
    setUploading(false)

    if (!json.success) {
      setUploadError(json.error ?? 'Erro no upload')
      return
    }

    setUploadSuccess(`${json.data.chunks} chunks indexados (${json.data.pages} páginas)`)
    setTitle('')
    if (fileRef.current) fileRef.current.value = ''
    setTimeout(() => setUploadSuccess(null), 4000)
    fetchDocuments()
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch('/api/knowledge/documents', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !isActive }),
    })
    fetchDocuments()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
        <p className="text-sm text-muted-foreground">
          Documentos indexados para contexto de marca no Motor de Adaptação.
        </p>
      </div>

      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload de PDF</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="title">Título do documento (opcional)</Label>
            <Input
              id="title"
              placeholder="Ex: Playbook de Marca Welcome Trips"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="file">Arquivo PDF</Label>
              <Input id="file" type="file" accept=".pdf" ref={fileRef} />
            </div>
            <Button onClick={handleUpload} disabled={uploading} size="sm">
              {uploading ? (
                <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Processando...</>
              ) : (
                <><Upload className="mr-1 h-4 w-4" />Upload</>
              )}
            </Button>
          </div>
          {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
          {uploadSuccess && <p className="text-sm text-green-600">{uploadSuccess}</p>}
        </CardContent>
      </Card>

      {/* Lista de documentos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Documentos ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : documents.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum documento indexado. Faça upload de um PDF acima.
            </p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.chunk_count} chunks · {doc.source_type}
                        {doc.file_name && ` · ${doc.file_name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={doc.is_active ? 'default' : 'secondary'}>
                      {doc.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(doc.id, doc.is_active)}
                    >
                      {doc.is_active ? (
                        <ToggleRight className="h-5 w-5 text-primary" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
