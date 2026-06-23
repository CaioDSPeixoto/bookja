import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Plus, FileText, BookOpen } from 'lucide-react'
import { listarProjetos } from '@/lib/projetos/actions'

const bordaStatus: Record<string, string> = {
  rascunho: 'border-l-gray-300',
  revisao: 'border-l-yellow-400',
  publicado: 'border-l-green-500',
}

const badgeStatus: Record<string, string> = {
  rascunho: 'bg-gray-100 text-gray-600',
  revisao: 'bg-yellow-50 text-yellow-700',
  publicado: 'bg-green-50 text-green-700',
}

export default async function PainelPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('projeto')
  const projetos = await listarProjetos()

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{t('meusProjetos')}</h1>
        <Link
          href={`/${locale}/projeto/novo`}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md"
        >
          <Plus size={18} />
          {t('criarProjeto')}
        </Link>
      </div>

      {projetos.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 px-8 py-16">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <BookOpen size={32} className="text-indigo-400" />
          </div>
          <p className="mb-1 text-lg font-medium text-gray-700">{t('semProjetos')}</p>
          <p className="mb-6 text-sm text-gray-400">Crie seu primeiro projeto e comece a escrever.</p>
          <Link
            href={`/${locale}/projeto/novo`}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md"
          >
            <Plus size={18} />
            {t('criarProjeto')}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projetos.map((projeto: { id: string; titulo: string; sinopse?: string; status: string; criado_em: string; documento?: { count: number }[] }) => (
            <Link
              key={projeto.id}
              href={`/${locale}/projeto/${projeto.id}/editar`}
              className={`group block rounded-xl border border-gray-200 border-l-4 ${bordaStatus[projeto.status] || bordaStatus.rascunho} bg-white p-5 transition-all duration-200 hover:shadow-lg hover:scale-[1.01]`}
            >
              <h2 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{projeto.titulo}</h2>
              {projeto.sinopse && (
                <p className="mt-2 text-sm text-gray-500 line-clamp-2">{projeto.sinopse}</p>
              )}
              <div className="mt-4 flex items-center gap-3 text-xs text-gray-400">
                <span>{new Date(projeto.criado_em).toLocaleDateString('pt-BR')}</span>
                <span className="flex items-center gap-1">
                  <FileText size={12} />
                  {projeto.documento?.[0]?.count ?? 0}
                </span>
                <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeStatus[projeto.status] || badgeStatus.rascunho}`}>
                  {t(projeto.status)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
