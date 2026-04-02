// Gestão de usuários e roles por workspace

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { UserPlus, Trash2 } from 'lucide-react'

interface UserRole {
  id: string
  user_id: string
  email: string
  role: string
  created_at: string
}

export default function UsersPage() {
  const params = useParams()
  const workspace = params.workspace as string
  const [users, setUsers] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('editor')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/settings/users?workspace_id=${workspace}`)
    const json = await res.json()
    if (json.success) setUsers(json.data)
    setLoading(false)
  }, [workspace])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function handleAdd() {
    if (!email.trim()) return
    setSaving(true)
    setMessage(null)

    const res = await fetch('/api/settings/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace_id: workspace, email: email.trim(), role }),
    })
    const json = await res.json()
    setSaving(false)

    if (json.success) {
      setMessage({ type: 'success', text: 'Usuário adicionado!' })
      setEmail('')
      fetchUsers()
    } else {
      setMessage({ type: 'error', text: json.error ?? 'Erro' })
    }
  }

  async function handleRemove(id: string) {
    if (!confirm('Remover este usuário do workspace?')) return
    await fetch(`/api/settings/users?id=${id}`, { method: 'DELETE' })
    fetchUsers()
  }

  const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-800',
    editor: 'bg-blue-100 text-blue-800',
    viewer: 'bg-gray-100 text-gray-800',
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>

      {/* Adicionar */}
      <Card>
        <CardHeader><CardTitle className="text-base">Adicionar Usuário</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                placeholder="email@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="w-32 space-y-1">
              <Label className="text-xs">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button size="sm" onClick={handleAdd} disabled={saving}>
                <UserPlus className="mr-1 h-4 w-4" />
                {saving ? '...' : 'Adicionar'}
              </Button>
            </div>
          </div>
          {message && (
            <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>
              {message.text}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Lista */}
      <Card>
        <CardHeader><CardTitle className="text-base">Membros ({users.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : users.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Nenhum usuário.</p>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded border p-3">
                  <div>
                    <p className="text-sm font-medium">{u.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Desde {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={ROLE_COLORS[u.role] ?? ''}>{u.role}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => handleRemove(u.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
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
