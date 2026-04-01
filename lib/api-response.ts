// Helpers padronizados para respostas de API Routes

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

interface ApiSuccessOptions {
  status?: number
}

/** Retorna resposta de sucesso padronizada */
export function apiSuccess<T>(data: T, options?: ApiSuccessOptions) {
  return NextResponse.json(
    { success: true, data },
    { status: options?.status ?? 200 }
  )
}

/** Retorna resposta de erro padronizada */
export function apiError(message: string, status: number = 500) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  )
}

/** Wrapper que adiciona error handling a um handler de API Route */
export function withErrorHandler(
  handler: (request: NextRequest, context: { params: Record<string, string> }) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: { params: Record<string, string> }) => {
    try {
      return await handler(request, context)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor'
      logger.error('API Route error', { error: message, url: request.url })
      return apiError(message, 500)
    }
  }
}
