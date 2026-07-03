import { getTranslations } from 'next-intl/server'
import { Heart } from 'lucide-react'
import Link from 'next/link'
import { buscarFavoritos } from '@/lib/historias/queries'
import { CardHistoria } from '@/components/historia/CardHistoria'

type PerfilAutor = { nome_exibicao?: string; nome_usuario?: string }
type ProjetoTag = { tag: { id: number | string; nome: string } }

export default async function FavoritosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('navegacao')
  const favoritos = await buscarFavoritos()

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t('favoritos')}</h1>

      {favoritos.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <Heart size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Nenhuma história favoritada ainda.</p>
          <Link
            href={`/${locale}/historias`}
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Explorar histórias
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {favoritos.map((proj) => {
            const perfil = (Array.isArray(proj.perfil) ? proj.perfil[0] : proj.perfil) as PerfilAutor | null
            const tags = ((proj.projeto_tag || []) as ProjetoTag[]).map((pt) => ({ id: String(pt.tag.id), nome: pt.tag.nome }))
            return (
              <CardHistoria
                key={proj.id}
                titulo={proj.titulo}
                autor={perfil?.nome_exibicao || perfil?.nome_usuario || ''}
                sinopse={proj.sinopse}
                tags={tags}
                avaliacao={proj.media_avaliacao}
                capa_url={proj.capa_url}
                progresso={proj.progresso_percentual}
                href={`/${locale}/historia/${proj.id}`}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
