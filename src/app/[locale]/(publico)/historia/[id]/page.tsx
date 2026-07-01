import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Eye, Star, BookOpen, Download } from 'lucide-react'
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
  const colaboradores = ((historia.projeto_colaborador as Array<{ papel: string; aceito_em: string | null; perfil: { nome_usuario: string; nome_exibicao: string } }>) || [])
    .filter((colaborador) => colaborador.aceito_em)
  const tags = ((historia.projeto_tag as Array<{ tag: { id: number; nome: string } }>) || []).map((pt) => pt.tag)
  const capitulos = historia.documento as Array<{ id: string; titulo: string; ordem: number; publicado_em: string | null }>

  // Progresso de leitura (usuário logado): posição do último capítulo lido.
  let progressoLeitura: { atual: number; total: number; percentual: number; proximoId: string } | null = null
  if (user && capitulos.length > 0) {
    const { data: leitura } = await supabase
      .from('leitura_atual')
      .select('ultimo_documento_id')
      .eq('usuario_id', user.id)
      .eq('projeto_id', id)
      .maybeSingle()
    const idx = leitura?.ultimo_documento_id
      ? capitulos.findIndex((c) => c.id === leitura.ultimo_documento_id)
      : -1
    if (idx >= 0) {
      const atual = idx + 1
      const proximoId = capitulos[Math.min(idx + 1, capitulos.length - 1)].id
      progressoLeitura = {
        atual,
        total: capitulos.length,
        percentual: Math.round((atual / capitulos.length) * 100),
        proximoId,
      }
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Capa */}
        <div className="w-full flex-shrink-0 md:w-64">
          <div className="aspect-[3/4] overflow-hidden rounded-2xl border border-gray-100 bg-gray-100 shadow-sm">
            {historia.capa_url ? (
              <Image src={historia.capa_url} alt={historia.titulo} width={384} height={512} className="h-full w-full object-cover" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-50">
                <BookOpen size={64} className="text-indigo-200" />
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{historia.titulo}</h1>
          <p className="mt-2 text-gray-600">
            {t('por')}{' '}
            <Link href={`/${locale}/perfil/${perfil.nome_usuario}`} className="font-medium text-indigo-600 hover:underline">
              {perfil.nome_exibicao || perfil.nome_usuario}
            </Link>
          </p>

          {colaboradores.length > 0 && (
            <div className="mt-2">
              <span className="text-sm text-gray-500">{t('coautores')}: </span>
              {colaboradores.map((c, i) => (
                <span key={i} className="text-sm text-gray-600">
                  {i > 0 && ', '}
                  <Link href={`/${locale}/perfil/${c.perfil.nome_usuario}`} className="hover:text-indigo-600">
                    {c.perfil.nome_exibicao || c.perfil.nome_usuario}
                  </Link>
                </span>
              ))}
            </div>
          )}

          {/* Estatísticas */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1">
              <Eye size={15} /> {historia.contagem_visualizacoes || 0} {t('visualizacoes')}
            </span>
            {historia.media_avaliacao != null && historia.media_avaliacao > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 font-medium text-yellow-700">
                <Star size={15} fill="currentColor" /> {historia.media_avaliacao.toFixed(1)}
                {historia.contagem_avaliacoes > 0 && <span className="font-normal text-yellow-600/80">({historia.contagem_avaliacoes})</span>}
              </span>
            )}
            {user && user.id !== historia.dono_id && (
              <span className="ml-auto"><BotaoFavoritar projetoId={id} favoritado={favoritado} usuarioLogado={true} /></span>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/${locale}/historias?tag=${tag.id}`}
                  className="rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-700 hover:bg-indigo-100"
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

      {/* Progresso de leitura */}
      {progressoLeitura && (
        <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-indigo-900">
              {t('seuProgresso')}: {progressoLeitura.atual}/{progressoLeitura.total} ({progressoLeitura.percentual}%)
            </span>
            <Link
              href={`/${locale}/historia/${id}/ler/${progressoLeitura.proximoId}`}
              className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              {t('continuarLendo')}
            </Link>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-indigo-100">
            <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${progressoLeitura.percentual}%` }} />
          </div>
        </div>
      )}

      {/* Capítulos */}
      <div className="mt-10">
        <h2 className="mb-4 text-xl font-bold">{t('capitulos')}</h2>
        {capitulos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-10 text-center text-sm text-gray-500">{t('semCapitulos')}</div>
        ) : (
          <ol className="space-y-2">
            {capitulos.map((cap, idx) => (
              <li key={cap.id}>
                <Link
                  href={`/${locale}/historia/${id}/ler/${cap.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50/40"
                >
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-600">
                    {idx + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-gray-800 group-hover:text-indigo-700">{cap.titulo || `Capítulo ${idx + 1}`}</span>
                    {cap.publicado_em && (
                      <span className="text-xs text-gray-400">
                        {new Date(cap.publicado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Exportar - só logado */}
      {user && (
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={`/api/exportar/epub?projetoId=${id}`} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50" download>
            <Download size={15} /> EPUB
          </a>
          <a href={`/api/exportar/pdf?projetoId=${id}`} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50" download>
            <Download size={15} /> PDF
          </a>
        </div>
      )}

      {/* Comentários */}
      <ListaComentarios projetoId={id} usuarioId={user?.id || null} />
    </div>
  )
}
