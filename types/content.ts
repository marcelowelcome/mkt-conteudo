// Tipos do Motor de Adaptação — output da IA por canal

export interface WordPressAdaptation {
  title: string
  meta_description: string
  body_html: string
  focus_keyword: string
  tags: string[]
  strategic_note: string
}

export interface EmailAdaptation {
  subject_a: string
  subject_b: string
  preheader: string
  body_html: string
  cta_text: string
  cta_url: string
  list_segment: string
  strategic_note: string
}

export interface InstagramAdaptation {
  caption: string
  hashtags: string[]
  cta: string
  carousel_slides: Array<{ slide: number; headline: string; body: string }>
  visual_brief: string
  strategic_note: string
}

export interface LinkedInAdaptation {
  post_text: string
  opening_insight: string
  cta: string
  strategic_note: string
}

export interface YouTubeAdaptation {
  script_hook: string
  script_body: string
  script_cta: string
  description: string
  tags: string[]
  strategic_note: string
}

export interface ContentAdaptationOutput {
  wordpress?: WordPressAdaptation
  email?: EmailAdaptation
  instagram?: InstagramAdaptation
  linkedin?: LinkedInAdaptation
  youtube?: YouTubeAdaptation
}

export interface BriefingInput {
  title: string
  objective: string
  target_persona: string
  target_channels: string[]
  body?: string
  keywords?: string[]
}
