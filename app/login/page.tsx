// Página de login — autenticação via Supabase Auth (email/password)

import { Suspense } from 'react'
import { LoginForm } from '@/components/hub/LoginForm'

export const metadata = {
  title: 'Login — Content Hub',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Content Hub</h1>
          <p className="text-sm text-muted-foreground">
            Welcome Group — Plataforma de Conteúdo
          </p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
