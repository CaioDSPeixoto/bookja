import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { BookOpen, Settings, Star, Eye } from 'lucide-react'
import Link from 'next/link'
import { buscarPerfilPublico } from '@/lib/perfil/actions'
import { estaBloqueado } from '@/lib/bloqueio/actions'
import { criarClienteServidor } from '@/lib/supabase/server'
import BotaoCopiarPix from './BotaoCopiarPix'
import BotaoBloquear from '@/components/perfil/BotaoBloquear'
import MuralPerfil from '@/components/mural/MuralPerfil'

export default async function PerfilAutorPage({ params }: { params: Promise<{ locale: string; nomeUsuario: string }> }) {
  const { locale, nomeUsuario } = await params
  const t = await getTranslations('perfil')
  const dados = await buscarPerfilPublico(nomeUsuario)

  if (!dados) notFound()

  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  const usuarioLogadoId = user?.id || null

  const { perfil, projetos, leituras } = dados
  const iniciais = (perfil.nome_exibicao || perfil.nome_usuario || '?').slice(0, 2).toUpperCase()
  const ehMeuPerfil = usuarioLogadoId === perfil.id
  const bloqueadoInicial = usuarioLogadoId && !ehMeuPerfil ? await estaBloqueado(perfil.id) : false

  type ProjetoPerfil = {
    id: string
    titulo: string
    sinopse: string | null
    capa_url: string | null
    media_avaliacao: number | null
    contagem_avaliacoes: number | null
    contagem_visualizacoes: number | null
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="h-20 bg-gradient-to-br from-indigo-500 to-violet-500" />
        <div className="flex items-start gap-4 px-5 pb-5">
          <div className="-mt-10 flex-shrink-0">
            {perfil.avatar_url ? (
              <Image src={perfil.avatar_url} alt={perfil.nome_exibicao || ''} width={80} height={80} className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-sm" unoptimized />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-indigo-600 to-violet-600 text-2xl font-bold text-white shadow-sm">
                {iniciais}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-3">
            <h1 className="text-2xl font-bold text-gray-900">{perfil.nome_exibicao || perfil.nome_usuario}</h1>
            {perfil.bio && <p className="mt-2 text-gray-600">{perfil.bio}</p>}
          </div>
          {ehMeuPerfil ? (
            <Link
              href={`/${locale}/configuracoes`}
              className="mt-3 inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Settings size={15} />
              <span className="hidden sm:inline">{t('editarPerfil')}</span>
            </Link>
          ) : usuarioLogadoId ? (
            <div className="mt-3">
              <BotaoBloquear usuarioId={perfil.id} bloqueadoInicial={bloqueadoInicial} />
            </div>
          ) : null}
        </div>
      </div>

      {perfil.chave_pix && (
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-medium text-gray-700">{t('chavePix')}</h2>
          <BotaoCopiarPix chavePix={perfil.chave_pix} />
        </div>
      )}

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">{t('historiasEscritas')}</h2>
        {projetos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-10 text-center text-sm text-gray-500">
            {t('semHistorias')}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {(projetos as ProjetoPerfil[]).map((p) => (
              <Link
                key={p.id}
                href={`/${locale}/historia/${p.id}`}
                className="group flex gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
              >
                <div className="h-24 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50">
                  {p.capa_url ? (
                    <Image src={p.capa_url} alt={p.titulo} width={64} height={96} className="h-full w-full object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center text-indigo-200">
                      <BookOpen size={22} />
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <h3 className="font-medium text-gray-900 line-clamp-1 group-hover:text-indigo-600">{p.titulo}</h3>
                  {p.sinopse && <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{p.sinopse}</p>}
                  <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Star size={12} className={p.contagem_avaliacoes ? 'text-yellow-500' : 'text-gray-300'} fill={p.contagem_avaliacoes ? 'currentColor' : 'none'} />
                      {p.contagem_avaliacoes ? `${(p.media_avaliacao ?? 0).toFixed(1)}` : '—'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={12} className="text-gray-400" />
                      {p.contagem_visualizacoes ?? 0}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {leituras.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">{t('lendoAgora')}</h2>
          <div className="space-y-2">
            {leituras.map((l: { projeto_id: string; projeto: { id: string; titulo: string }[] | { id: string; titulo: string } | null }) => {
              const proj = Array.isArray(l.projeto) ? l.projeto[0] : l.projeto
              return proj ? (
                <Link key={l.projeto_id} href={`/${locale}/historia/${proj.id}`} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/40">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
                    <BookOpen size={16} />
                  </span>
                  <span className="font-medium text-gray-800">{proj.titulo}</span>
                </Link>
              ) : null
            })}
          </div>
        </section>
      )}

      <MuralPerfil perfilId={perfil.id} usuarioLogadoId={usuarioLogadoId} />
    </div>
  )
}
