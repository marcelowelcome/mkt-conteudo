// Dashboard de analytics consolidado por canal

import { AnalyticsDashboard } from '@/components/hub/AnalyticsDashboard'

interface AnalyticsPageProps {
  params: { workspace: string }
}

export default function AnalyticsPage({ params }: AnalyticsPageProps) {
  return <AnalyticsDashboard workspace={params.workspace} />
}
