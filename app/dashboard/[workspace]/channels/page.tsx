// Configuração de credenciais dos canais de distribuição

import { ChannelConfigPanel } from '@/components/hub/ChannelConfigPanel'

interface ChannelsPageProps {
  params: { workspace: string }
}

export default function ChannelsPage({ params }: ChannelsPageProps) {
  return <ChannelConfigPanel workspace={params.workspace} />
}
