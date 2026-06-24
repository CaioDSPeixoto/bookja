import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { criarClienteServidor } from '@/lib/supabase/server'
import { renderizarConteudoHTML } from '@/lib/historias/renderizar'
import BarraProgresso from '@/components/leitura/BarraProgresso'
import HeaderLeitura from '@/components/leitura/HeaderLeitura'
import BotaoCopiarPix from '@/components/leitura/BotaoCopiarPix'

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
    .single()

  if (!documento) notFound()

  const { data: capitulos } = await supabase
    .from('documento')
    .select('id, titulo, ordem')
    .eq('projeto_id', id)
    .eq('publico', true)
    .order('ordem')

  const lista = capitulos || []
  const idxAtual = lista.findIndex((c) => c.id === docId)
  const anterior = idxAtual > 0 ? lista[idxAtual - 1] : null
  const proximo = idxAtual < lista.length - 1 ? lista[idxAtual + 1] : null

  const htmlConteudo = renderizarConteudoHTML(documento.conteudo)
  const perfilAutor = projeto.perfil as { chave_pix?: string } | null

  return (
    <>
      <BarraProgresso />
      <HeaderLeitura
        voltarHref={`/${locale}/historia/${id}`}
        titulo={documento.titulo}
        capituloAtual={idxAtual + 1}
        totalCapitulos={lista.length}
        voltarLabel={t('voltarHistoria')}
      />

      <div className="mx-auto max-w-prose px-4 pt-16 pb-12">
        {/* Conteúdo */}
        <article
          className="prose-reader"
          dangerouslySetInnerHTML={{ __html: htmlConteudo }}
        />

        {/* Apoiar autor */}
        {perfilAutor?.chave_pix && (
          <div className="mt-12 rounded-lg border border-indigo-200 bg-indigo-50 p-5 text-center">
            <p className="font-medium text-indigo-800">{t('apoiarAutor')}</p>
            <p className="mt-2 text-sm text-indigo-700">
              {t('chavePix')}: <code className="rounded bg-indigo-100 px-2 py-0.5">{perfilAutor.chave_pix}</code>
            </p>
            <div className="mt-3 flex justify-center">
              <BotaoCopiarPix chavePix={perfilAutor.chave_pix} label={t('copiarPix')} labelCopiado={t('pixCopiado')} />
            </div>
          </div>
        )}

        {/* Navegação entre capítulos */}
        <nav className="mt-12 grid grid-cols-2 gap-4 border-t border-gray-200 pt-6">
          {anterior ? (
            <Link href={`/${locale}/historia/${id}/ler/${anterior.id}`} className="group flex flex-col items-start gap-1 rounded-lg p-3 hover:bg-gray-50">
              <span className="inline-flex items-center gap-1 text-xs text-gray-400 group-hover:text-indigo-600">
                <ChevronLeft size={14} /> {t('capituloAnterior')}
              </span>
              <span className="text-sm font-medium text-gray-700 line-clamp-1">{anterior.titulo}</span>
            </Link>
          ) : <div />}
          {proximo ? (
            <Link href={`/${locale}/historia/${id}/ler/${proximo.id}`} className="group flex flex-col items-end gap-1 rounded-lg p-3 hover:bg-gray-50">
              <span className="inline-flex items-center gap-1 text-xs text-gray-400 group-hover:text-indigo-600">
                {t('proximoCapitulo')} <ChevronRight size={14} />
              </span>
              <span className="text-sm font-medium text-gray-700 line-clamp-1">{proximo.titulo}</span>
            </Link>
          ) : <div />}
        </nav>
      </div>
    </>
  )
}
