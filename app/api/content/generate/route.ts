// POST gera rascunho via Claude + RAG com streaming

import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase'
import { buildAdaptationPrompt } from '@/lib/content/prompt-builder'
import { CLAUDE_CONFIG } from '@/lib/constants'
import { logger } from '@/lib/logger'
import type { Channel, ContentPiece } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content_piece_id, channels, workspace_id } = body as {
      content_piece_id: string
      channels: Channel[]
      workspace_id: string
    }

    if (!content_piece_id || !channels?.length || !workspace_id) {
      return new Response(
        JSON.stringify({ error: 'content_piece_id, channels e workspace_id são obrigatórios' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Buscar conteúdo-base
    const supabase = createServerSupabaseClient()
    const { data: content, error } = await supabase
      .from('content_pieces')
      .select('*')
      .eq('id', content_piece_id)
      .eq('workspace_id', workspace_id)
      .single()

    if (error || !content) {
      return new Response(
        JSON.stringify({ error: 'Conteúdo não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Montar prompt com 3 camadas de contexto
    const { systemPrompt, userPrompt } = await buildAdaptationPrompt(
      content as ContentPiece,
      channels,
      workspace_id
    )

    logger.info('Starting Claude generation', {
      contentId: content_piece_id,
      channels,
      model: CLAUDE_CONFIG.MODEL,
    })

    // Chamar Claude com streaming
    const anthropic = new Anthropic()
    const stream = anthropic.messages.stream({
      model: CLAUDE_CONFIG.MODEL,
      max_tokens: CLAUDE_CONFIG.MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    // Converter para ReadableStream do Web API
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
              )
            }
          }

          // Evento final
          const finalMessage = await stream.finalMessage()
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                usage: {
                  input_tokens: finalMessage.usage.input_tokens,
                  output_tokens: finalMessage.usage.output_tokens,
                },
              })}\n\n`
            )
          )
          controller.close()
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Stream error'
          logger.error('Claude stream error', { error: message })
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
          )
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
    logger.error('Generate error', { error: message })
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
