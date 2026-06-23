import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { listarDocumentos } from '@/lib/documentos/actions'
import BotaoImprimir from './BotaoImprimir'

export default async function PreviaPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const t = await getTranslations('editor')

  let capitulos: { id: string; titulo: string; conteudo: unknown; ordem: number }[] = []
  try {
    const docs = await listarDocumentos(id)
    capitulos = docs
      .filter((d: { tipo: string }) => d.tipo === 'capitulo')
      .sort((a: { ordem: number }, b: { ordem: number }) => a.ordem - b.ordem)
  } catch {
    capitulos = []
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/90 px-6 py-3 shadow-sm backdrop-blur print:hidden">
        <Link
          href={`/${locale}/projeto/${id}/escrita`}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600"
        >
          <ArrowLeft size={16} />
          {t('voltarEditor')}
        </Link>
        <BotaoImprimir label={t('imprimir')} />
      </header>

      {/* Book content */}
      <main className="mx-auto max-w-prose px-6 py-12 font-serif">
        {capitulos.map((cap, index) => (
          <article key={cap.id} className="mb-16">
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
              {cap.titulo || `${t('capitulo', { numero: index + 1 })}`}
            </h2>
            <div className="whitespace-pre-wrap text-lg leading-8 text-gray-800">
              {typeof cap.conteudo === 'string' ? cap.conteudo : ''}
            </div>
          </article>
        ))}

        {capitulos.length === 0 && (
          <p className="text-center text-gray-400">{t('semCapitulos')}</p>
        )}
      </main>
    </div>
  )
}
