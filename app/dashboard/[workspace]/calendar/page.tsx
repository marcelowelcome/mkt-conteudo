// Calendário editorial — tabs com visão mensal e kanban

'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EditorialCalendar } from '@/components/hub/EditorialCalendar'
import { CalendarKanban } from '@/components/hub/CalendarKanban'
import { useParams } from 'next/navigation'

export default function CalendarPage() {
  const params = useParams()
  const workspace = params.workspace as string

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Calendário Editorial</h1>

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar">Mensal</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar" className="mt-4">
          <EditorialCalendar workspace={workspace} />
        </TabsContent>
        <TabsContent value="kanban" className="mt-4">
          <CalendarKanban workspace={workspace} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
