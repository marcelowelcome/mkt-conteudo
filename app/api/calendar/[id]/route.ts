// GET / PATCH / DELETE entrada individual do calendário

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response'

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Record<string, string> }
) => {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('editorial_calendar')
    .select('*, content_pieces(title), content_adaptations(channel, status)')
    .eq('id', params.id)
    .single()

  if (error || !data) {
    return apiError('Entrada não encontrada', 404)
  }

  return apiSuccess(data)
})

export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Record<string, string> }
) => {
  const body = await request.json()

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('editorial_calendar')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return apiError(error.message, 500)
  }

  return apiSuccess(data)
})

export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Record<string, string> }
) => {
  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('editorial_calendar')
    .delete()
    .eq('id', params.id)

  if (error) {
    return apiError(error.message, 500)
  }

  return apiSuccess({ deleted: true })
})
