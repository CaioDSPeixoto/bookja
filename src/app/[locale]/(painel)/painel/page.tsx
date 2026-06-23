import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Plus, FileText } from 'lucide-react'
import { listarProjetos } from '@/lib/projetos/actions'

const corStatus: Record<string, string> = {
  rascunho: 'bg-gray-200 text-gray-700',
  revisao: 'bg-yellow-100 text-yellow-800',
  publicado: 'bg-green-100 text-green-800',
}

export default async function PainelPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('projeto')
  const projetos = await listarProjetos()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('meusProjetos')}</h1>
        <Link
          href={`/${locale}/projeto/novo`}
          className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          {t('criarProjeto')}
        </Link>
      </div>

      {projetos.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <FileText size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="mb-4 text-gray-600">{t('semProjetos')}</p>
          <Link
            href={`/${locale}/projeto/novo`}
            className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            {t('criarProjeto')}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {projetos.map((projeto: { id: string; titulo: string; status: string; created_at: string; documento?: { count: number }[] }) => (
            <Link
              key={projeto.id}
              href={`/${locale}/projeto/${projeto.id}/editar`}
              className="block rounded-lg border border-gray-200 p-4 transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{projeto.titulo}</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${corStatus[projeto.status] || corStatus.rascunho}`}>
                  {t(projeto.status)}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                <span>{new Date(projeto.created_at).toLocaleDateString('pt-BR')}</span>
                <span className="flex items-center gap-1">
                  <FileText size={14} />
                  {projeto.documento?.[0]?.count ?? 0}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
