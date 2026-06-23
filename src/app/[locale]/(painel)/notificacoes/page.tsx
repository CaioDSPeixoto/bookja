import { getTranslations } from 'next-intl/server'
import { Bell } from 'lucide-react'

export default async function NotificacoesPage() {
  const t = await getTranslations('navegacao')

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t('notificacoes')}</h1>
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <Bell size={48} className="mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">Nenhuma notificação ainda.</p>
      </div>
    </div>
  )
}
