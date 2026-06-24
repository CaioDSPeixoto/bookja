'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye } from 'lucide-react'
import { listarDocumentos, criarDocumento } from '@/lib/documentos/actions'
import SumarioCapitulos from '@/components/editor/SumarioCapitulos'
import EditorCapitulo from '@/components/editor/EditorCapitulo'
import BauInformacoes from '@/components/editor/BauInformacoes'

type Documento = {
  id: string
  titulo: string
  tipo: string
  conteudo: unknown
  ordem: number
  contagem_palavras?: number
  publico?: boolean
}

export default function EscritaPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('editor')
  const locale = useLocale()
  const searchParams = useSearchParams()
  const [projetoId, setProjetoId] = useState('')
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [capituloAtivoId, setCapituloAtivoId] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)

  const capitulos = documentos.filter(d => d.tipo === 'capitulo')
  const outros = documentos.filter(d => d.tipo !== 'capitulo')
  const capituloAtivo = capitulos.find(c => c.id === capituloAtivoId) || null

  const recarregar = useCallback(async (pid: string) => {
    const docs = await listarDocumentos(pid)
    setDocumentos(docs)
    return docs
  }, [])

  useEffect(() => {
    params.then(async ({ id }) => {
      setProjetoId(id)
      const docs = await recarregar(id)
      const caps = docs.filter((d: Documento) => d.tipo === 'capitulo')
      if (caps.length > 0 && !capituloAtivoId) {
        const docParam = searchParams.get('doc')
        const found = docParam && caps.find((c: Documento) => c.id === docParam)
        setCapituloAtivoId(found ? found.id : caps[0].id)
      }
      setCarregando(false)
    })
  }, [params, recarregar, capituloAtivoId])

  const handleNovoCapitulo = async () => {
    const novoDoc = await criarDocumento(projetoId, '', 'capitulo')
    await recarregar(projetoId)
    setCapituloAtivoId(novoDoc.id)
  }

  const handleDocumentoAtualizado = useCallback(() => {
    recarregar(projetoId)
  }, [projetoId, recarregar])

  if (carregando) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/projeto/${projetoId}/editar`}
            className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-indigo-600"
          >
            <ArrowLeft size={16} />
            {t('voltarEditor')}
          </Link>
        </div>
        <Link
          href={`/${locale}/projeto/${projetoId}/previa`}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-indigo-700 hover:shadow-md"
        >
          <Eye size={16} />
          {t('previa')}
        </Link>
      </header>

      {/* 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sumário */}
        <SumarioCapitulos
          capitulos={capitulos}
          capituloAtivoId={capituloAtivoId}
          onSelecionar={setCapituloAtivoId}
          onNovo={handleNovoCapitulo}
          projetoId={projetoId}
          onReordenar={() => recarregar(projetoId)}
        />

        {/* Editor central */}
        <div className="flex-1 overflow-hidden">
          {capituloAtivo ? (
            <EditorCapitulo
              key={capituloAtivo.id}
              documento={capituloAtivo}
              onAtualizado={handleDocumentoAtualizado}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-gray-400">
              <p className="text-lg">{t('semCapitulos')}</p>
            </div>
          )}
        </div>

        {/* Baú */}
        <BauInformacoes
          documentos={outros}
          projetoId={projetoId}
          onAtualizado={() => recarregar(projetoId)}
        />
      </div>
    </div>
  )
}
