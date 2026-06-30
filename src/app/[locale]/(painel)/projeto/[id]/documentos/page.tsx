import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { FileText, Globe, Lock } from 'lucide-react'
import { listarDocumentos } from '@/lib/documentos/actions'
import NovoDocumentoForm from './NovoDocumentoForm'
import BotoesReordenar from './BotoesReordenar'

export default async function DocumentosPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id: projetoId } = await params
  const t = await getTranslations('documento')

  let documentos: Awaited<ReturnType<typeof listarDocumentos>> = []
  try {
    documentos = await listarDocumentos(projetoId)
  } catch {
    documentos = []
  }

  const tipoLabel: Record<string, string> = {
    capitulo: t('capitulo'),
    ficha_personagem: t('fichaPersonagem'),
    biblia: t('biblia'),
    nota: t('nota'),
    outro: t('outro'),
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{t('titulo')}</h1>
        <NovoDocumentoForm projetoId={projetoId} locale={locale} />
      </div>

      {documentos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-12 text-center text-sm text-gray-500">{t('semDocumentos')}</div>
      ) : (
        <ul className="space-y-2">
          {documentos.map((doc, index) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition-colors hover:border-indigo-200"
            >
              <Link
                href={`/${locale}/projeto/${projetoId}/doc/${doc.id}`}
                className="group flex min-w-0 flex-1 items-center gap-3"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
                  <FileText size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-800 group-hover:text-indigo-700">{doc.titulo}</p>
                  <p className="text-sm text-gray-500">{tipoLabel[doc.tipo] ?? doc.tipo}</p>
                </div>
              </Link>
              <div className="flex flex-shrink-0 items-center gap-2">
                {doc.publico ? (
                  <span title={t('publico')}><Globe size={16} className="text-green-600" /></span>
                ) : (
                  <span title={t('privado')}><Lock size={16} className="text-gray-400" /></span>
                )}
                <BotoesReordenar
                  projetoId={projetoId}
                  documentos={documentos}
                  index={index}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
