// Tipos compartilhados para API Routes — requests e responses

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number
  page: number
  limit: number
}

export interface PublishResult {
  success: boolean
  publishId?: string
  publishedUrl?: string
  error?: string
}

export interface VectorSearchResult {
  id: string
  content: string
  metadata: Record<string, unknown> | null
  document_id: string
  similarity: number
}
