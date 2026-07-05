'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Eye, ListOrdered } from 'lucide-react'
import { listarDocumentos, criarDocumento } from '@/lib/documentos/actions'
import SumarioCapitulos from '@/components/editor/SumarioCapitulos'
import EditorCapitulo from '@/components/editor/EditorCapitulo'

type Documento = {
  id: string
  titulo: string
  tipo: string
  conteudo: unknown
  ordem: number
  status?: 'rascunho' | 'revisao' | 'revisao_supervisionada' | 'publicado'
  contagem_palavras?: number
  publico?: boolean
}

export default function EscritaPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('editor')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [projetoId, setProjetoId] = useState('')
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [capituloAtivoId, setCapituloAtivoId] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [sumarioAberto, setSumarioAberto] = useState(false)
  const salvarPendenteRef = useRef<(() => Promise<boolean>) | null>(null)

  const capitulos = documentos.filter(d => d.tipo === 'capitulo')
  const capituloAtivo = capitulos.find(c => c.id === capituloAtivoId) || null

  async function garantirSalvamentoPendente() {
    if (!salvarPendenteRef.current) return true
    return salvarPendenteRef.current()
  }

  async function selecionarCapitulo(id: string) {
    if (id === capituloAtivoId) return
    const salvou = await garantirSalvamentoPendente()
    if (!salvou) return
    setCapituloAtivoId(id)
  }

  const recarregar = useCallback(async (pid: string) => {
    const docs = (await listarDocumentos(pid)) as Documento[]
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
  }, [params, recarregar, capituloAtivoId, searchParams])

  const handleNovoCapitulo = async () => {
    const salvou = await garantirSalvamentoPendente()
    if (!salvou) return
    const novoDoc = await criarDocumento(projetoId, '', 'capitulo')
    await recarregar(projetoId)
    setCapituloAtivoId(novoDoc.id)
    setSumarioAberto(false)
  }

  const handleDocumentoAtualizado = useCallback(() => {
    recarregar(projetoId)
  }, [projetoId, recarregar])

  async function navegarAposSalvar(href: string) {
    const salvou = await garantirSalvamentoPendente()
    if (!salvou) return
    router.push(href)
  }

  if (carregando) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between gap-2 border-b border-gray-100 bg-white px-4 py-3 shadow-sm sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => navegarAposSalvar(`/${locale}/projeto/${projetoId}/editar`)}
            className="flex flex-shrink-0 items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-indigo-600"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">{t('voltarEditor')}</span>
          </button>
          <button
            type="button"
            onClick={() => setSumarioAberto(true)}
            className="flex min-w-0 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 md:hidden"
          >
            <ListOrdered size={16} className="flex-shrink-0" />
            <span className="truncate">{capituloAtivo?.titulo || t('semCapitulos')}</span>
          </button>
        </div>
        <button
          type="button"
          onClick={() => navegarAposSalvar(`/${locale}/projeto/${projetoId}/previa`)}
          className="inline-flex flex-shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-indigo-700 hover:shadow-md sm:px-4"
        >
          <Eye size={16} />
          <span className="hidden sm:inline">{t('previa')}</span>
        </button>
      </header>

      {/* Layout de escrita */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sumário */}
        <SumarioCapitulos
          capitulos={capitulos}
          capituloAtivoId={capituloAtivoId}
          onSelecionar={selecionarCapitulo}
          onNovo={handleNovoCapitulo}
          projetoId={projetoId}
          onReordenar={() => recarregar(projetoId)}
          aberto={sumarioAberto}
          onFechar={() => setSumarioAberto(false)}
        />

        {/* Editor central */}
        <div className="flex-1 overflow-hidden">
          {capituloAtivo ? (
            <EditorCapitulo
              key={capituloAtivo.id}
              documento={capituloAtivo}
              projetoId={projetoId}
              onAtualizado={handleDocumentoAtualizado}
              onRegistrarSalvamentoPendente={(salvarPendente) => {
                salvarPendenteRef.current = salvarPendente
              }}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-gray-400">
              <p className="text-lg">{t('semCapitulos')}</p>
            </div>
          )}
        </div>

        {/* Baú */}
      </div>
    </div>
  )
}
