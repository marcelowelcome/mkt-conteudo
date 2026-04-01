// Listagem de conteúdos do workspace — filtros, busca e grid

import { ContentListPage } from '@/components/hub/ContentListPage'

interface ContentPageProps {
  params: { workspace: string }
}

export default function ContentPage({ params }: ContentPageProps) {
  return <ContentListPage workspace={params.workspace} />
}
