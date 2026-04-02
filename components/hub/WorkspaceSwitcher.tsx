// Seletor de workspace — troca entre Welcome Trips e Welcome Weddings

'use client'

import { useRouter } from 'next/navigation'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface WorkspaceSwitcherProps {
  current: string
}

const WORKSPACES = [
  { id: 'wt', name: 'Welcome Trips' },
  { id: 'ww', name: 'Welcome Weddings' },
]

export function WorkspaceSwitcher({ current }: WorkspaceSwitcherProps) {
  const router = useRouter()

  function handleChange(wsId: string) {
    router.push(`/dashboard/${wsId}`)
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="w-full h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {WORKSPACES.map((ws) => (
          <SelectItem key={ws.id} value={ws.id} className="text-xs">
            {ws.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
