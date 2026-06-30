import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { BookOpen, ChevronLeft, ChevronRight, StickyNote } from 'lucide-react'
import { criarClienteServidor } from '@/lib/supabase/server'
import { renderizarConteudoHTML } from '@/lib/historias/renderizar'
import BarraProgresso from '@/components/leitura/BarraProgresso'
import BotaoCopiarPix from '@/components/leitura/BotaoCopiarPix'
import { registrarLeituraAtual } from '@/lib/leitura/actions'
import { listarNotasDocumento } from '@/lib/documentos/interacoes'
import ReacoesDocumento from '@/components/leitura/ReacoesDocumento'
import { ListaComentarios } from '@/components/comentarios/ListaComentarios'

type NotaDocumento = {
  id: string
  conteudo: string
  perfil: { nome_usuario?: string; nome_exibicao?: string } | null
}

export default async function LeituraPage({ params }: { params: Promise<{ locale: string; id: string; docId: string }> }) {
  const { locale, id, docId } = await params
  const t = await getTranslations('historia')
  const supabase = await criarClienteServidor()

  const { data: projeto } = await supabase
    .from('projeto')
    .select('id, titulo, dono_id, perfil:dono_id(chave_pix)')
    .eq('id', id)
    .eq('status', 'publicado')
    .single()

  if (!projeto) notFound()

  const { data: documento } = await supabase
    .from('documento')
    .select('id, titulo, conteudo, ordem')
    .eq('id', docId)
    .eq('projeto_id', id)
    .eq('publico', true)
    .eq('status', 'publicado')
    .single()

  if (!documento) notFound()

  const { data: capitulos } = await supabase
    .from('documento')
    .select('id, titulo, ordem')
    .eq('projeto_id', id)
    .eq('publico', true)
    .eq('status', 'publicado')
    .order('ordem')

  const lista = capitulos || []
  const idxAtual = lista.findIndex((capitulo) => capitulo.id === docId)
  const anterior = idxAtual > 0 ? lista[idxAtual - 1] : null
  const proximo = idxAtual < lista.length - 1 ? lista[idxAtual + 1] : null

  const htmlConteudo = renderizarConteudoHTML(documento.conteudo)
  const perfilAutor = projeto.perfil as { chave_pix?: string } | null
  await registrarLeituraAtual(id, docId)

  const { data: { user } } = await supabase.auth.getUser()
  const notas = (await listarNotasDocumento(docId).catch(() => [])) as NotaDocumento[]

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-gray-950">
      <BarraProgresso />

      <section className="border-b border-gray-200 bg-white pt-8">
        <div className="mx-auto max-w-3xl px-5 pb-10">
          <Link
            href={`/${locale}/historia/${id}`}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            <ChevronLeft size={16} />
            {projeto.titulo}
          </Link>
          <div className="flex items-start gap-4">
            <div className="mt-1 hidden h-12 w-12 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 sm:flex">
              <BookOpen size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Capítulo {idxAtual + 1} de {lista.length}
              </p>
              <h1 className="mt-2 text-3xl font-bold leading-tight tracking-normal text-gray-950 sm:text-4xl">
                {documento.titulo}
              </h1>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-5 py-10">
        <article
          className="prose-reader"
          dangerouslySetInnerHTML={{ __html: htmlConteudo }}
        />

        {notas.length > 0 && (
          <section className="mt-12 border-t border-amber-200 pt-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-amber-700">
              <StickyNote size={16} /> Bastidores do capítulo
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {notas.map((nota) => (
                <div key={nota.id} className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                  <p className="whitespace-pre-line break-words">{nota.conteudo}</p>
                  <p className="mt-3 text-[11px] text-amber-700">
                    {nota.perfil?.nome_exibicao || nota.perfil?.nome_usuario || 'Autor'}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {perfilAutor?.chave_pix && (
          <section className="mt-10 border-t border-indigo-100 pt-6 text-center">
            <p className="font-medium text-indigo-900">{t('apoiarAutor')}</p>
            <p className="mt-2 text-sm text-indigo-800">
              {t('chavePix')}: <code className="rounded bg-indigo-50 px-2 py-0.5">{perfilAutor.chave_pix}</code>
            </p>
            <div className="mt-3 flex justify-center">
              <BotaoCopiarPix chavePix={perfilAutor.chave_pix} label={t('copiarPix')} labelCopiado={t('pixCopiado')} />
            </div>
          </section>
        )}

        <nav className="mt-12 grid grid-cols-1 gap-3 border-t border-gray-200 pt-6 sm:grid-cols-2">
          {anterior ? (
            <Link href={`/${locale}/historia/${id}/ler/${anterior.id}`} className="group rounded-md border border-gray-200 bg-white p-4 transition hover:border-indigo-200 hover:bg-indigo-50/50">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 group-hover:text-indigo-600">
                <ChevronLeft size={14} /> {t('capituloAnterior')}
              </span>
              <span className="mt-1 block text-sm font-semibold text-gray-800 line-clamp-2">{anterior.titulo}</span>
            </Link>
          ) : <div />}
          {proximo ? (
            <Link href={`/${locale}/historia/${id}/ler/${proximo.id}`} className="group rounded-md border border-gray-200 bg-white p-4 text-right transition hover:border-indigo-200 hover:bg-indigo-50/50">
              <span className="inline-flex items-center justify-end gap-1 text-xs font-medium text-gray-400 group-hover:text-indigo-600">
                {t('proximoCapitulo')} <ChevronRight size={14} />
              </span>
              <span className="mt-1 block text-sm font-semibold text-gray-800 line-clamp-2">{proximo.titulo}</span>
            </Link>
          ) : <div />}
        </nav>

        <section className="mt-12 border-t border-gray-200 pt-6">
          <ReacoesDocumento documentoId={docId} podeReagir={!!user} />
        </section>

        <section className="mt-12 border-t border-gray-200 pt-8">
          <ListaComentarios projetoId={id} documentoId={docId} usuarioId={user?.id ?? null} permitirAvaliacao={false} />
        </section>
      </div>
    </main>
  )
}
