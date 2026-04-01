// Raiz — redireciona para o dashboard do workspace padrão

import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/dashboard/wt')
}
