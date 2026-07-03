import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { SlidersHorizontal } from 'lucide-react'

const CATEGORIA_LABEL: Record<string, string> = {
  genero: 'Gênero',
  tema: 'Tema',
  aviso_conteudo: 'Aviso de conteúdo',
  publico_alvo: 'Classificação',
  fandom: 'Fandom',
}
import { buscarCatalogo, buscarTagsDisponiveis } from '@/lib/historias/queries'
import CatalogoInfinito from '@/components/historia/CatalogoInfinito'
import BuscaCatalogo from '@/components/historia/BuscaCatalogo'

export default async function CatalogoPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ busca?: string; tag?: string; pagina?: string }>
}) {
  const { locale } = await params
  const sp = await searchParams
  const t = await getTranslations('catalogo')

  const { projetos, totalPaginas } = await buscarCatalogo({ busca: sp.busca, tagId: sp.tag, pagina: 1 })
  const tagsAgrupadas = await buscarTagsDisponiveis()

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{t('titulo')}</h1>

      {/* Busca com debounce (título, sinopse ou autor) */}
      <BuscaCatalogo />

      {/* Tags (recolhível para reduzir ruído no mobile) */}
      {(() => {
        const tagAtiva = sp.tag ? Object.values(tagsAgrupadas).flat().find((tg) => String(tg.id) === String(sp.tag)) : null
        return (
          <details className="group mb-6 rounded-xl border border-gray-100 bg-white shadow-sm" open={!!sp.tag}>
            <summary className="flex cursor-pointer select-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-gray-700">
              <span className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-gray-400" />
                {t('todasTags')}
              </span>
              {tagAtiva ? (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">{tagAtiva.nome}</span>
              ) : (
                <span className="text-xs text-gray-400">Todas</span>
              )}
            </summary>
            <div className="space-y-3 border-t border-gray-100 px-4 py-3">
              <Link
                href={`/${locale}/historias${sp.busca ? `?busca=${sp.busca}` : ''}`}
                className={`inline-block rounded-full px-3 py-1 text-sm ${!sp.tag ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {t('todasTags')}
              </Link>
              {Object.entries(tagsAgrupadas).map(([categoria, tagsDaCategoria]) => (
                <div key={categoria}>
                  <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    {CATEGORIA_LABEL[categoria] ?? categoria}
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {tagsDaCategoria.map((tag) => (
                      <Link
                        key={tag.id}
                        href={`/${locale}/historias?tag=${tag.id}${sp.busca ? `&busca=${sp.busca}` : ''}`}
                        className={`rounded-full px-3 py-1 text-sm transition-colors ${String(sp.tag) === String(tag.id) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        {tag.nome}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </details>
        )
      })()}

      {/* Grid com scroll infinito */}
      {projetos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-16 text-center text-sm text-gray-500">{t('semResultados')}</div>
      ) : (
        <CatalogoInfinito
          key={`${sp.busca ?? ''}|${sp.tag ?? ''}`}
          inicial={projetos as React.ComponentProps<typeof CatalogoInfinito>['inicial']}
          totalPaginas={totalPaginas}
          busca={sp.busca}
          tagId={sp.tag}
        />
      )}
    </div>
  )
}
