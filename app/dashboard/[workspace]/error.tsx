// Error boundary global do dashboard — captura erros de runtime

'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('[Dashboard Error]', error)
  }, [error])

  return (
    <div className="flex items-center justify-center py-20">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Algo deu errado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.
          </p>
          {error.digest && (
            <p className="mt-2 text-xs text-muted-foreground">
              Código: {error.digest}
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={reset} variant="outline" size="sm">
            Tentar novamente
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
