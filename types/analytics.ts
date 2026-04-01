// Tipos de métricas de analytics por canal

export interface ChannelMetrics {
  channel: string
  period: string
  metrics: Record<string, number>
  trend?: number // % variação vs período anterior
}

export interface WordPressMetrics {
  page_views: number
  unique_visitors: number
  avg_time_on_page: number // segundos
  bounce_rate: number // %
  top_posts: Array<{ title: string; views: number; url: string }>
}

export interface EmailMetrics {
  campaigns_sent: number
  total_sent: number
  open_rate: number // %
  click_rate: number // %
  unsubscribe_rate: number // %
  top_campaigns: Array<{ name: string; opens: number; clicks: number }>
}

export interface InstagramMetrics {
  followers: number
  reach: number
  impressions: number
  engagement_rate: number // %
  saves: number
  shares: number
  top_posts: Array<{ id: string; reach: number; engagement: number; caption: string }>
}

export interface LinkedInMetrics {
  followers: number
  impressions: number
  click_rate: number // %
  engagement_rate: number // %
  top_posts: Array<{ id: string; impressions: number; clicks: number }>
}

export interface YouTubeMetrics {
  subscribers: number
  views: number
  watch_time_hours: number
  avg_view_duration: number // segundos
  ctr: number // % click-through rate thumbnails
  top_videos: Array<{ id: string; title: string; views: number; watch_time: number }>
}

export interface ConsolidatedAnalytics {
  period: string
  workspace_id: string
  channels: {
    wordpress?: WordPressMetrics
    email?: EmailMetrics
    instagram?: InstagramMetrics
    linkedin?: LinkedInMetrics
    youtube?: YouTubeMetrics
  }
  summary: {
    total_reach: number
    total_engagement: number
    best_channel: string
    content_published: number
  }
}
