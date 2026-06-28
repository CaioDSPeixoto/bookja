'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import UnderlineExt from '@tiptap/extension-underline'
import { Check, Loader2, Lock } from 'lucide-react'
import { alterarStatusDocumento, atualizarDocumento, type StatusDocumento } from '@/lib/documentos/actions'
import { useLockEdicao } from '@/hooks/useLockEdicao'
import BarraFerramentas from './BarraFerramentas'
import PainelNotasAutor from './PainelNotasAutor'
import PresencaBarra from './PresencaBarra'
import { usePresencaDocumento } from '@/hooks/usePresencaDocumento'

type Documento = {
  id: string
  titulo: string
  conteudo: unknown
  status?: StatusDocumento
}

const OPCOES_STATUS: Array<{ valor: StatusDocumento; rotulo: string }> = [
  { valor: 'rascunho', rotulo: 'Rascunho' },
  { valor: 'revisao', rotulo: 'Revisão' },
  { valor: 'revisao_supervisionada', rotulo: 'Revisão supervisionada' },
  { valor: 'publicado', rotulo: 'Publicado' },
]

interface Props {
  documento: Documento
  projetoId: string
  onAtualizado: () => void
}

function parseConteudo(conteudo: unknown) {
  if (!conteudo) return undefined
  if (typeof conteudo === 'object') return conteudo
  if (typeof conteudo === 'string') {
    try { return JSON.parse(conteudo) } catch { return undefined }
  }
  return undefined
}

export default function EditorCapitulo({ documento, projetoId, onAtualizado }: Props) {
  const t = useTranslations('editor')
  const tGeral = useTranslations('geral')
  const { somenteLeitura, travadoPor, carregando } = useLockEdicao(documento.id)
  const presentes = usePresencaDocumento(documento.id, !somenteLeitura)

  const [titulo, setTitulo] = useState(documento.titulo || '')
  const [statusEditorial, setStatusEditorial] = useState<StatusDocumento>(documento.status ?? 'rascunho')
  const [status, setStatus] = useState<'salvo' | 'salvando' | 'pendente'>('salvo')
  const [alterandoStatus, setAlterandoStatus] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const pendente = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExt,
      Placeholder.configure({ placeholder: t('escrevaSuaHistoria') }),
      CharacterCount,
    ],
    editorProps: {
      attributes: {
        spellcheck: 'true',
        lang: 'pt-BR',
      },
    },
    editable: !somenteLeitura,
    content: parseConteudo(documento.conteudo) || (typeof documento.conteudo === 'string' ? `<p>${documento.conteudo}</p>` : ''),
    onUpdate: () => {
      setStatus('pendente')
      pendente.current = true
    },
  })

  useEffect(() => {
    if (editor) editor.setEditable(!somenteLeitura)
  }, [somenteLeitura, editor])

  const salvar = useCallback(async () => {
    if (somenteLeitura || !editor) return
    setStatus('salvando')
    const json = editor.getJSON()
    const palavras = editor.storage.characterCount.words()
    try {
      await atualizarDocumento(documento.id, {
        titulo: titulo || undefined,
        conteudo: json,
        contagem_palavras: palavras,
      })
      setStatus('salvo')
      pendente.current = false
      onAtualizado()
    } catch {
      setStatus('pendente')
    }
  }, [documento.id, titulo, somenteLeitura, editor, onAtualizado])

  // Auto-save com debounce curto (reduz janela de perda)
  useEffect(() => {
    if (somenteLeitura || !pendente.current) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(salvar, 2500)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [status, somenteLeitura, salvar])

  // Save on unmount
  useEffect(() => {
    return () => {
      if (pendente.current && !somenteLeitura && editor) {
        const json = editor.getJSON()
        const palavras = editor.storage.characterCount.words()
        atualizarDocumento(documento.id, {
          titulo: titulo || undefined,
          conteudo: json,
          contagem_palavras: palavras,
        }).catch(() => {})
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Aviso ao sair com alteracoes nao salvas (fechar aba / recarregar)
  useEffect(() => {
    function aoSair(e: BeforeUnloadEvent) {
      if (pendente.current && !somenteLeitura) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', aoSair)
    return () => window.removeEventListener('beforeunload', aoSair)
  }, [somenteLeitura])

  function marcarPendente() {
    setStatus('pendente')
    pendente.current = true
  }

  async function mudarStatus(novoStatus: StatusDocumento) {
    if (somenteLeitura || novoStatus === statusEditorial) return
    const statusAnterior = statusEditorial
    setStatusEditorial(novoStatus)
    setAlterandoStatus(true)
    try {
      await alterarStatusDocumento(documento.id, novoStatus)
      onAtualizado()
    } catch {
      setStatusEditorial(statusAnterior)
    } finally {
      setAlterandoStatus(false)
    }
  }

  if (carregando) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {somenteLeitura && travadoPor && (
        <div className="flex items-center gap-2 bg-amber-50 px-6 py-2 text-sm text-amber-700">
          <Lock size={14} />
          {t('travadoPor', { nome: travadoPor })}
        </div>
      )}

      {/* Title */}
      <div className="border-b border-gray-100 px-8 pt-6 pb-4">
        {presentes.length > 0 && (
          <div className="mb-2">
            <PresencaBarra usuarios={presentes} />
          </div>
        )}
        <input
          type="text"
          value={titulo}
          onChange={(e) => { setTitulo(e.target.value); marcarPendente() }}
          onBlur={salvar}
          placeholder={t('tituloCapitulo')}
          disabled={somenteLeitura}
          className="w-full text-3xl font-bold text-gray-900 placeholder-gray-300 outline-none disabled:opacity-60"
        />
        <div className="mt-3 flex items-center gap-2">
          <label htmlFor={`status-${documento.id}`} className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Status
          </label>
          <select
            id={`status-${documento.id}`}
            value={statusEditorial}
            onChange={(e) => mudarStatus(e.target.value as StatusDocumento)}
            disabled={somenteLeitura || alterandoStatus}
            className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none transition focus:border-indigo-400 disabled:opacity-60"
          >
            {OPCOES_STATUS.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </option>
            ))}
          </select>
          {alterandoStatus && <Loader2 size={12} className="animate-spin text-indigo-500" />}
        </div>
      </div>

      {/* Toolbar */}
      {!somenteLeitura && <BarraFerramentas editor={editor} />}

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto bg-white rounded-b-lg shadow-inner">
        <EditorContent editor={editor} />
      </div>

      {/* Bastidores: notas do autor visiveis na leitura */}
      <PainelNotasAutor projetoId={projetoId} documentoId={documento.id} />

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-2.5">
        <span className="text-xs text-gray-400">
          {t('palavras', { count: editor?.storage.characterCount.words() ?? 0 })}
        </span>
        <div className="flex items-center gap-3 text-xs">
          {status === 'salvando' && (
            <span className="flex items-center gap-1.5 text-indigo-500">
              <Loader2 size={12} className="animate-spin" />
              {t('salvando')}
            </span>
          )}
          {status === 'salvo' && (
            <span className="flex items-center gap-1.5 text-green-500">
              <Check size={12} />
              {t('salvo')}
            </span>
          )}
          {status === 'pendente' && (
            <span className="text-gray-400">● Não salvo</span>
          )}
          {!somenteLeitura && (
            <button
              onClick={salvar}
              disabled={status === 'salvando'}
              className="rounded-md bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100 disabled:opacity-50"
            >
              {tGeral('salvar')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
