// Knowledge Base — upload de PDFs e gestão de documentos indexados

import { KnowledgeBaseManager } from '@/components/hub/knowledge/KnowledgeBaseManager'

interface KnowledgePageProps {
  params: { workspace: string }
}

export default function KnowledgePage({ params }: KnowledgePageProps) {
  return <KnowledgeBaseManager workspace={params.workspace} />
}
