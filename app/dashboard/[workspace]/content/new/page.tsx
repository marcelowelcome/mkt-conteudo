// Página de criação de novo conteúdo — formulário de briefing

import { BriefingForm } from '@/components/hub/BriefingForm'

interface NewContentPageProps {
  params: { workspace: string }
}

export default function NewContentPage({ params }: NewContentPageProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <BriefingForm workspace={params.workspace} />
    </div>
  )
}
