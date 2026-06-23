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
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('titulo')}</h1>
        <NovoDocumentoForm projetoId={projetoId} locale={locale} />
      </div>

      {documentos.length === 0 ? (
        <p className="text-center text-gray-500">{t('semDocumentos')}</p>
      ) : (
        <ul className="space-y-2">
          {documentos.map((doc, index) => (
            <li
              key={doc.id}
              className="flex items-center justify-between rounded border border-gray-200 p-4 hover:bg-gray-50"
            >
              <Link
                href={`/${locale}/projeto/${projetoId}/doc/${doc.id}`}
                className="flex flex-1 items-center gap-3"
              >
                <FileText size={20} className="text-gray-400" />
                <div>
                  <p className="font-medium">{doc.titulo}</p>
                  <p className="text-sm text-gray-500">{tipoLabel[doc.tipo] ?? doc.tipo}</p>
                </div>
              </Link>
              <div className="flex items-center gap-2">
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
