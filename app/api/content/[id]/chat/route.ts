// POST chat estratégico com IA sobre um conteúdo — streaming

import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase'
import { vectorSearch } from '@/lib/rag/vector-search'
import { CLAUDE_CONFIG } from '@/lib/constants'
import { logger } from '@/lib/logger'
import type { ContentPiece } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, workspace_id, history } = body as {
      message: string
      workspace_id: string
      history?: Array<{ role: 'user' | 'assistant'; content: string }>
    }

    if (!message || !workspace_id) {
      return new Response(
        JSON.stringify({ error: 'message e workspace_id são obrigatórios' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Extrair content_id da URL
    const url = new URL(request.url)
    const contentId = url.pathname.split('/').filter(Boolean).at(-2) ?? ''

    // Buscar conteúdo
    const supabase = createServerSupabaseClient()
    const { data: content } = await supabase
      .from('content_pieces')
      .select('*')
      .eq('id', contentId)
      .eq('workspace_id', workspace_id)
      .single()

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Conteúdo não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Buscar adaptações existentes
    const { data: adaptations } = await supabase
      .from('content_adaptations')
      .select('channel, ai_output, status')
      .eq('content_piece_id', contentId)

    // Contexto RAG
    let ragContext = ''
    try {
      const chunks = await vectorSearch(message, workspace_id, { limit: 4 })
      if (chunks.length > 0) {
        ragContext = chunks.map((c) => c.content).join('\n\n')
      }
    } catch {
      // RAG opcional
    }

    const c = content as ContentPiece
    const systemPrompt = `Você é um consultor estratégico de marketing de conteúdo do Welcome Group.

Você está discutindo sobre o conteúdo: "${c.title}"
Status atual: ${c.status}
Persona alvo: ${c.target_persona ?? 'não definida'}
Canais: ${c.target_channels?.join(', ') ?? 'nenhum'}

${adaptations?.length ? `Adaptações existentes: ${adaptations.map((a) => `${a.channel} (${a.status})`).join(', ')}` : ''}

${ragContext ? `Contexto da marca:\n${ragContext}` : ''}

Responda em português brasileiro. Seja direto, estratégico e acionável.
Sugira melhorias concretas quando possível.`

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...(history ?? []),
      { role: 'user' as const, content: message },
    ]

    logger.info('Strategy chat started', { contentId, messageLength: message.length })

    const anthropic = new Anthropic()
    const stream = anthropic.messages.stream({
      model: CLAUDE_CONFIG.MODEL,
      max_tokens: 2000,
      system: systemPrompt,
      messages,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
              )
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
          controller.close()
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Stream error'
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    logger.error('Chat error', { error: message })
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
