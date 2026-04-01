// Tipos das tabelas do Supabase — espelham o schema SQL

export type ContentStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED'
export type AdaptationStatus = 'PENDING' | 'APPROVED' | 'REVISION_REQUESTED'
export type CalendarStatus = 'SCHEDULED' | 'APPROVED' | 'PUBLISHED' | 'CANCELLED'
export type Channel = 'wordpress' | 'email' | 'instagram' | 'linkedin' | 'youtube'
export type UserRole = 'admin' | 'editor' | 'viewer'
export type SourceType = 'PDF' | 'WEBSITE' | 'MANUAL'

export interface Workspace {
  id: string
  name: string
  site_url: string | null
  created_at: string
}

export interface ContentPiece {
  id: string
  workspace_id: string
  title: string
  subtitle: string | null
  body: string | null
  keywords: string[] | null
  target_persona: string | null
  target_channels: Channel[] | null
  status: ContentStatus
  author_id: string | null
  reviewer_id: string | null
  approver_id: string | null
  scheduled_for: string | null
  published_at: string | null
  version: number
  created_at: string
  updated_at: string
}

export interface ContentAdaptation {
  id: string
  content_piece_id: string
  workspace_id: string
  channel: Channel
  ai_output: Record<string, unknown> | null
  title_edited: string | null
  body_edited: string | null
  hashtags_edited: string[] | null
  subject_edited: string | null
  cta_edited: string | null
  status: AdaptationStatus
  analyst_notes: string | null
  published_at: string | null
  publish_id: string | null
  publish_error: string | null
  auto_publish: boolean
  created_at: string
  updated_at: string
}

export interface EditorialCalendarEntry {
  id: string
  workspace_id: string
  content_piece_id: string | null
  adaptation_id: string | null
  channel: Channel
  scheduled_for: string
  status: CalendarStatus
  auto_publish: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ChannelConfig {
  id: string
  workspace_id: string
  channel: Channel
  config: Record<string, unknown>
  is_active: boolean
  last_tested_at: string | null
  created_at: string
}

export interface KnowledgeDocument {
  id: string
  workspace_id: string
  title: string
  source_type: SourceType
  source_url: string | null
  file_name: string | null
  description: string | null
  is_active: boolean
  indexed_at: string
  created_at: string
}

export interface DocumentChunk {
  id: string
  workspace_id: string
  document_id: string
  chunk_index: number
  content: string
  token_count: number | null
  embedding: number[] | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface UserRoleRecord {
  id: string
  user_id: string
  workspace_id: string
  role: UserRole
  created_at: string
}

export interface ActivityLogEntry {
  id: string
  workspace_id: string
  user_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  details: Record<string, unknown> | null
  created_at: string
}
