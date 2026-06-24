import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Eye, Star, BookOpen } from 'lucide-react'
import { buscarHistoriaPublica, registrarVisualizacao } from '@/lib/historias/queries'
import { criarClienteServidor } from '@/lib/supabase/server'
import { ListaComentarios } from '@/components/comentarios/ListaComentarios'
import { BotaoFavoritar } from '@/components/historia/BotaoFavoritar'

export default async function HistoriaPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params
  const t = await getTranslations('historia')
  const historia = await buscarHistoriaPublica(id)

  if (!historia) notFound()

  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  await registrarVisualizacao(id, user?.id)

  let favoritado = false
  if (user) {
    const { data } = await supabase.from('favorito').select('usuario_id').eq('usuario_id', user.id).eq('projeto_id', id).single()
    favoritado = !!data
  }

  const perfil = historia.perfil as { nome_usuario: string; nome_exibicao: string; avatar_url?: string }
  const colaboradores = (historia.projeto_colaborador as Array<{ papel: string; perfil: { nome_usuario: string; nome_exibicao: string } }>) || []
  const tags = ((historia.projeto_tag as Array<{ tag: { id: string; nome: string } }>) || []).map((pt) => pt.tag)
  const capitulos = historia.documento as Array<{ id: string; titulo: string; ordem: number }>

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Capa */}
        <div className="w-full flex-shrink-0 md:w-64">
          <div className="aspect-[3/4] overflow-hidden rounded-lg bg-gray-100">
            {historia.capa_url ? (
              <img src={historia.capa_url} alt={historia.titulo} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                <BookOpen size={64} className="text-gray-300" />
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{historia.titulo}</h1>
          <p className="mt-2 text-gray-600">
            {t('por')}{' '}
            <Link href={`/${locale}/perfil/${perfil.nome_usuario}`} className="font-medium text-blue-600 hover:underline">
              {perfil.nome_exibicao || perfil.nome_usuario}
            </Link>
          </p>

          {colaboradores.length > 0 && (
            <div className="mt-2">
              <span className="text-sm text-gray-500">{t('coautores')}: </span>
              {colaboradores.map((c, i) => (
                <span key={i} className="text-sm text-gray-600">
                  {i > 0 && ', '}
                  <Link href={`/${locale}/perfil/${c.perfil.nome_usuario}`} className="hover:text-blue-600">
                    {c.perfil.nome_exibicao || c.perfil.nome_usuario}
                  </Link>
                </span>
              ))}
            </div>
          )}

          {/* Estatísticas */}
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Eye size={16} /> {historia.contagem_visualizacoes || 0} {t('visualizacoes')}
            </span>
            {historia.media_avaliacao != null && historia.media_avaliacao > 0 && (
              <span className="flex items-center gap-1 text-yellow-600">
                <Star size={16} fill="currentColor" /> {historia.media_avaliacao.toFixed(1)}
              </span>
            )}
            {historia.contagem_avaliacoes > 0 && (
              <span>{historia.contagem_avaliacoes} {t('avaliacoes')}</span>
            )}
            <BotaoFavoritar projetoId={id} favoritado={favoritado} usuarioLogado={!!user} />
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/${locale}/historias?tag=${tag.id}`}
                  className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700 hover:bg-blue-100"
                >
                  {tag.nome}
                </Link>
              ))}
            </div>
          )}

          {/* Sinopse */}
          {historia.sinopse && (
            <div className="mt-6">
              <h2 className="font-semibold text-gray-800">{t('sinopse')}</h2>
              <p className="mt-2 whitespace-pre-line text-gray-600">{historia.sinopse}</p>
            </div>
          )}
        </div>
      </div>

      {/* Capítulos */}
      <div className="mt-10">
        <h2 className="mb-4 text-xl font-bold">{t('capitulos')}</h2>
        {capitulos.length === 0 ? (
          <p className="text-gray-500">{t('semCapitulos')}</p>
        ) : (
          <ol className="space-y-2">
            {capitulos.map((cap, idx) => (
              <li key={cap.id}>
                <Link
                  href={`/${locale}/historia/${id}/ler/${cap.id}`}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 transition hover:bg-gray-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                    {idx + 1}
                  </span>
                  <span className="font-medium">{cap.titulo}</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Exportar */}
      <div className="mt-6 flex gap-3">
        <a href={`/api/exportar/epub?projetoId=${id}`} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" download>EPUB</a>
        <a href={`/api/exportar/pdf?projetoId=${id}`} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" download>PDF</a>
      </div>

      {/* Comentários */}
      <ListaComentarios projetoId={id} usuarioId={user?.id || null} />
    </div>
  )
}
