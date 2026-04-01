// Constantes globais — status, canais, cores e configurações

import type { Channel, ContentStatus, AdaptationStatus } from '@/types'

export const CONTENT_STATUSES: ContentStatus[] = [
  'DRAFT', 'REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED',
]

export const CHANNELS: Channel[] = [
  'wordpress', 'email', 'instagram', 'linkedin', 'youtube',
]

export const CHANNEL_LABELS: Record<Channel, string> = {
  wordpress: 'WordPress',
  email: 'E-mail',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
}

export const STATUS_COLORS: Record<ContentStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  REVIEW: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  SCHEDULED: 'bg-blue-100 text-blue-800',
  PUBLISHED: 'bg-purple-100 text-purple-800',
  ARCHIVED: 'bg-red-100 text-red-800',
}

export const ADAPTATION_STATUS_COLORS: Record<AdaptationStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REVISION_REQUESTED: 'bg-red-100 text-red-800',
}

/** Transições de status válidas para content_pieces */
export const VALID_STATUS_TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  DRAFT: ['REVIEW', 'ARCHIVED'],
  REVIEW: ['DRAFT', 'APPROVED', 'ARCHIVED'],
  APPROVED: ['REVIEW', 'SCHEDULED', 'ARCHIVED'],
  SCHEDULED: ['APPROVED', 'PUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['ARCHIVED'],
  ARCHIVED: ['DRAFT'],
}

/** Parâmetros do RAG */
export const RAG_CONFIG = {
  CHUNK_SIZE: 512,
  CHUNK_OVERLAP: 64,
  EMBEDDING_MODEL: 'text-embedding-3-small' as const,
  EMBEDDING_DIMENSIONS: 1536,
  SIMILARITY_THRESHOLD: 0.70,
  MAX_CHUNKS: 8,
  EMBEDDING_BATCH_SIZE: 100,
}

/** Configuração do Claude para geração */
export const CLAUDE_CONFIG = {
  MODEL: 'claude-sonnet-4-20250514' as const,
  MAX_TOKENS: 8000,
}
