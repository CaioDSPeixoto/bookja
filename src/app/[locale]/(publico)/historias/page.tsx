import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Search } from 'lucide-react'
import { buscarCatalogo, buscarTagsDisponiveis } from '@/lib/historias/queries'
import { CardHistoria } from '@/components/historia/CardHistoria'

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

  const pagina = Number(sp.pagina) || 1
  const { projetos, totalPaginas } = await buscarCatalogo({ busca: sp.busca, tagId: sp.tag, pagina })
  const tagsAgrupadas = await buscarTagsDisponiveis()

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t('titulo')}</h1>

      {/* Busca */}
      <form className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            name="busca"
            defaultValue={sp.busca}
            placeholder={t('buscar')}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none"
          />
        </div>
        {sp.tag && <input type="hidden" name="tag" value={sp.tag} />}
        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          {t('titulo')}
        </button>
      </form>

      {/* Tags */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href={`/${locale}/historias${sp.busca ? `?busca=${sp.busca}` : ''}`}
          className={`rounded-full px-3 py-1 text-sm ${!sp.tag ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          {t('todasTags')}
        </Link>
        {Object.values(tagsAgrupadas).flat().map((tag) => (
          <Link
            key={tag.id}
            href={`/${locale}/historias?tag=${tag.id}${sp.busca ? `&busca=${sp.busca}` : ''}`}
            className={`rounded-full px-3 py-1 text-sm ${sp.tag === tag.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {tag.nome}
          </Link>
        ))}
      </div>

      {/* Grid */}
      {projetos.length === 0 ? (
        <p className="py-12 text-center text-gray-500">{t('semResultados')}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {projetos.map((p: Record<string, unknown>) => {
            const perfil = (Array.isArray(p.perfil) ? p.perfil[0] : p.perfil) as { nome_exibicao?: string; nome_usuario?: string } | null
            const tags = ((p.projeto_tag as Array<{ tag: { id: string; nome: string } }>) || []).map((pt) => pt.tag)
            return (
              <CardHistoria
                key={p.id as string}
                titulo={p.titulo as string}
                autor={perfil?.nome_exibicao || perfil?.nome_usuario || ''}
                sinopse={p.sinopse as string}
                tags={tags}
                avaliacao={p.media_avaliacao as number}
                capa_url={p.capa_url as string}
                href={`/${locale}/historia/${p.id}`}
              />
            )
          })}
        </div>
      )}

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          {pagina > 1 && (
            <Link
              href={`/${locale}/historias?pagina=${pagina - 1}${sp.busca ? `&busca=${sp.busca}` : ''}${sp.tag ? `&tag=${sp.tag}` : ''}`}
              className="rounded-lg border px-4 py-2 hover:bg-gray-50"
            >
              {t('anterior')}
            </Link>
          )}
          <span className="text-sm text-gray-600">
            {t('pagina', { atual: pagina, total: totalPaginas })}
          </span>
          {pagina < totalPaginas && (
            <Link
              href={`/${locale}/historias?pagina=${pagina + 1}${sp.busca ? `&busca=${sp.busca}` : ''}${sp.tag ? `&tag=${sp.tag}` : ''}`}
              className="rounded-lg border px-4 py-2 hover:bg-gray-50"
            >
              {t('proxima')}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
