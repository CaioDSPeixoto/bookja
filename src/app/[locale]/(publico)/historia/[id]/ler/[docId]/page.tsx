import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { criarClienteServidor } from '@/lib/supabase/server'
import { renderizarConteudoHTML } from '@/lib/historias/renderizar'

export default async function LeituraPage({ params }: { params: Promise<{ locale: string; id: string; docId: string }> }) {
  const { locale, id, docId } = await params
  const t = await getTranslations('historia')
  const supabase = await criarClienteServidor()

  // Verifica projeto publicado
  const { data: projeto } = await supabase
    .from('projeto')
    .select('id, titulo, dono_id, perfil:dono_id(chave_pix)')
    .eq('id', id)
    .eq('status', 'publicado')
    .single()

  if (!projeto) notFound()

  // Busca documento público
  const { data: documento } = await supabase
    .from('documento')
    .select('id, titulo, conteudo, ordem')
    .eq('id', docId)
    .eq('projeto_id', id)
    .eq('publico', true)
    .single()

  if (!documento) notFound()

  // Busca capítulos para navegação
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
    <div className="mx-auto max-w-prose px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href={`/${locale}/historia/${id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600">
          <ArrowLeft size={16} /> {t('voltarHistoria')}
        </Link>
        <h1 className="text-2xl font-bold">{documento.titulo}</h1>
      </div>

      {/* Conteúdo */}
      <article
        className="prose prose-lg max-w-none leading-relaxed"
        dangerouslySetInnerHTML={{ __html: htmlConteudo }}
      />

      {/* Apoiar autor */}
      {perfilAutor?.chave_pix && (
        <div className="mt-10 rounded-lg border border-green-200 bg-green-50 p-4 text-center">
          <p className="font-medium text-green-800">{t('apoiarAutor')}</p>
          <p className="mt-1 text-sm text-green-700">{t('chavePix')}: <code className="rounded bg-green-100 px-2 py-0.5">{perfilAutor.chave_pix}</code></p>
        </div>
      )}

      {/* Navegação */}
      <nav className="mt-10 flex items-center justify-between border-t pt-6">
        {anterior ? (
          <Link href={`/${locale}/historia/${id}/ler/${anterior.id}`} className="flex items-center gap-1 text-blue-600 hover:underline">
            <ChevronLeft size={18} /> {t('capituloAnterior')}
          </Link>
        ) : <span />}
        {proximo ? (
          <Link href={`/${locale}/historia/${id}/ler/${proximo.id}`} className="flex items-center gap-1 text-blue-600 hover:underline">
            {t('proximoCapitulo')} <ChevronRight size={18} />
          </Link>
        ) : <span />}
      </nav>
    </div>
  )
}
