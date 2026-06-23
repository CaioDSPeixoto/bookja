'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { Save } from 'lucide-react'
import { obterDocumento, atualizarDocumento } from '@/lib/documentos/actions'

export default function EditorDocumentoPage() {
  const t = useTranslations('documento')
  const tEditor = useTranslations('editor')
  const params = useParams()
  const router = useRouter()
  const docId = params.docId as string

  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [status, setStatus] = useState<'salvo' | 'salvando' | 'pendente'>('salvo')
  const [carregando, setCarregando] = useState(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    obterDocumento(docId).then((doc) => {
      setTitulo(doc.titulo)
      setConteudo(typeof doc.conteudo === 'string' ? doc.conteudo : JSON.stringify(doc.conteudo ?? ''))
      setCarregando(false)
    }).catch(() => router.back())
  }, [docId, router])

  const contarPalavras = (texto: string) => texto.trim() ? texto.trim().split(/\s+/).length : 0

  const salvar = useCallback(async () => {
    setStatus('salvando')
    try {
      await atualizarDocumento(docId, {
        titulo,
        conteudo,
        contagem_palavras: contarPalavras(conteudo),
      })
      setStatus('salvo')
    } catch {
      setStatus('pendente')
    }
  }, [docId, titulo, conteudo])

  // Auto-save a cada 30s
  useEffect(() => {
    if (status !== 'pendente') return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(salvar, 30000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [titulo, conteudo, status, salvar])

  const handleChange = () => setStatus('pendente')

  if (carregando) return <div className="p-8 text-center text-gray-500">{tEditor('salvando')}</div>

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {status === 'salvando' ? t('salvando') : status === 'salvo' ? t('salvo') : ''}
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {tEditor('palavras', { count: contarPalavras(conteudo) })}
          </span>
          <button
            onClick={salvar}
            className="flex items-center gap-2 rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
          >
            <Save size={16} />
            {t('salvo') === t('salvando') ? '' : 'Salvar'}
          </button>
        </div>
      </div>

      <input
        type="text"
        value={titulo}
        onChange={(e) => { setTitulo(e.target.value); handleChange() }}
        placeholder={t('titulo')}
        className="mb-4 w-full border-b border-gray-200 pb-2 text-3xl font-bold outline-none focus:border-indigo-500"
      />

      <textarea
        value={conteudo}
        onChange={(e) => { setConteudo(e.target.value); handleChange() }}
        placeholder="Comece a escrever..."
        className="min-h-[60vh] w-full resize-none rounded border border-gray-200 p-4 text-lg leading-relaxed outline-none focus:border-indigo-500"
      />
    </div>
  )
}
