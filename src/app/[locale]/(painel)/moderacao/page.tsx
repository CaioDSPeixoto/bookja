import { notFound } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import { souAdmin } from '@/lib/denuncias/actions'
import PainelModeracao from '@/components/denuncias/PainelModeracao'

export default async function ModeracaoPage() {
  // Página restrita a administradores; a RLS também protege os dados no banco.
  if (!(await souAdmin())) notFound()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-gray-900">
        <ShieldAlert size={22} className="text-indigo-500" />
        Moderação
      </h1>
      <PainelModeracao />
    </div>
  )
}
