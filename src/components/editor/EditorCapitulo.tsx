'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import UnderlineExt from '@tiptap/extension-underline'
import { Check, Loader2, Lock } from 'lucide-react'
import {
  alterarStatusDocumento,
  aprovarRevisaoDocumento,
  atualizarDocumento,
  type StatusDocumento,
} from '@/lib/documentos/actions'
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

interface Props {
  documento: Documento
  projetoId: string
  onAtualizado: () => void
  onRegistrarSalvamentoPendente?: (salvarPendente: (() => Promise<boolean>) | null) => void
}

const OPCOES_STATUS: Array<{ valor: StatusDocumento; rotulo: string }> = [
  { valor: 'rascunho', rotulo: 'Rascunho' },
  { valor: 'revisao', rotulo: 'Revisão' },
  { valor: 'revisao_supervisionada', rotulo: 'Revisão supervisionada' },
  { valor: 'publicado', rotulo: 'Publicado' },
]

function parseConteudo(conteudo: unknown) {
  if (!conteudo) return undefined
  if (typeof conteudo === 'object') return conteudo
  if (typeof conteudo === 'string') {
    try {
      return JSON.parse(conteudo)
    } catch {
      return undefined
    }
  }
  return undefined
}

function horarioAtual() {
  return new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function EditorCapitulo({
  documento,
  projetoId,
  onAtualizado,
  onRegistrarSalvamentoPendente,
}: Props) {
  const { somenteLeitura, travadoPor, carregando } = useLockEdicao(documento.id)
  const presentes = usePresencaDocumento(documento.id, !somenteLeitura)

  const [titulo, setTitulo] = useState(documento.titulo || '')
  const [statusEditorial, setStatusEditorial] = useState<StatusDocumento>(documento.status ?? 'rascunho')
  const [statusSalvamento, setStatusSalvamento] = useState<'salvo' | 'salvando' | 'pendente'>('salvo')
  const [alterandoStatus, setAlterandoStatus] = useState(false)
  const [aprovando, setAprovando] = useState(false)
  const [manualFeedback, setManualFeedback] = useState(false)
  const [erroSalvamento, setErroSalvamento] = useState<string | null>(null)
  const [ultimoSalvamento, setUltimoSalvamento] = useState<{
    tipo: 'automatico' | 'manual'
    horario: string
  } | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const pendente = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExt,
      Placeholder.configure({ placeholder: 'Escreva sua história...' }),
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
      setStatusSalvamento('pendente')
      pendente.current = true
    },
  })

  useEffect(() => {
    if (editor) editor.setEditable(!somenteLeitura)
  }, [somenteLeitura, editor])

  const salvar = useCallback(async (tipo: 'automatico' | 'manual' = 'automatico') => {
    if (somenteLeitura || !editor) return true
    setStatusSalvamento('salvando')
    setErroSalvamento(null)
    const json = editor.getJSON()
    const palavras = editor.storage.characterCount.words()

    try {
      await atualizarDocumento(documento.id, {
        titulo: titulo || undefined,
        conteudo: json,
        contagem_palavras: palavras,
      })
      setStatusSalvamento('salvo')
      setUltimoSalvamento({ tipo, horario: horarioAtual() })
      if (tipo === 'manual') {
        setManualFeedback(true)
        setTimeout(() => setManualFeedback(false), 2200)
      }
      pendente.current = false
      onAtualizado()
      return true
    } catch {
      setStatusSalvamento('pendente')
      setErroSalvamento('Não foi possível salvar. Revise sua conexão e tente novamente.')
      return false
    }
  }, [documento.id, titulo, somenteLeitura, editor, onAtualizado])

  const salvarPendente = useCallback(async () => {
    if (!pendente.current) return true
    return salvar('automatico')
  }, [salvar])

  useEffect(() => {
    onRegistrarSalvamentoPendente?.(salvarPendente)
    return () => onRegistrarSalvamentoPendente?.(null)
  }, [onRegistrarSalvamentoPendente, salvarPendente])

  useEffect(() => {
    if (somenteLeitura || !pendente.current) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => salvar('automatico'), 2500)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [statusSalvamento, somenteLeitura, salvar])

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
    setStatusSalvamento('pendente')
    pendente.current = true
  }

  async function mudarStatus(novoStatus: StatusDocumento) {
    if (somenteLeitura || novoStatus === statusEditorial) return
    if (pendente.current) {
      const salvou = await salvar('automatico')
      if (!salvou) return
    }

    const statusAnterior = statusEditorial
    setStatusEditorial(novoStatus)
    setAlterandoStatus(true)

    try {
      await alterarStatusDocumento(documento.id, novoStatus)
      onAtualizado()
    } catch {
      setStatusEditorial(statusAnterior)
      setErroSalvamento('Não foi possível alterar o status agora.')
    } finally {
      setAlterandoStatus(false)
    }
  }

  async function aprovarRevisao() {
    if (somenteLeitura || statusEditorial !== 'revisao_supervisionada') return
    setAprovando(true)
    try {
      await aprovarRevisaoDocumento(documento.id)
      onAtualizado()
    } finally {
      setAprovando(false)
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
        <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 text-sm text-amber-700 sm:px-6">
          <Lock size={14} />
          {`Travado por ${travadoPor}`}
        </div>
      )}

      <div className="border-b border-gray-100 px-4 pt-6 pb-4 sm:px-8">
        {presentes.length > 0 && (
          <div className="mb-2">
            <PresencaBarra usuarios={presentes} />
          </div>
        )}

        <input
          type="text"
          value={titulo}
          onChange={(e) => { setTitulo(e.target.value); marcarPendente() }}
          onBlur={() => salvar('automatico')}
          placeholder="Título do capítulo"
          disabled={somenteLeitura}
          className="w-full text-2xl font-bold text-gray-900 placeholder-gray-300 outline-none disabled:opacity-60 sm:text-3xl"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
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
          {statusEditorial === 'revisao_supervisionada' && !somenteLeitura && (
            <button
              type="button"
              onClick={aprovarRevisao}
              disabled={aprovando}
              className="rounded-md border border-purple-200 px-2 py-1 text-xs font-medium text-purple-700 hover:bg-purple-50 disabled:opacity-60"
            >
              {aprovando ? 'Aprovando...' : 'Aprovar revisão'}
            </button>
          )}
        </div>
      </div>

      {erroSalvamento && (
        <div className="flex items-center justify-between gap-3 border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700 sm:px-8">
          <span>{erroSalvamento}</span>
          {!somenteLeitura && (
            <button
              type="button"
              onClick={() => salvar('manual')}
              className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium hover:bg-red-100"
            >
              Tentar novamente
            </button>
          )}
        </div>
      )}

      {!somenteLeitura && <BarraFerramentas editor={editor} />}

      <div className="flex-1 overflow-y-auto rounded-b-lg bg-white shadow-inner">
        <EditorContent editor={editor} />
      </div>

      <PainelNotasAutor projetoId={projetoId} documentoId={documento.id} />

      <div className="flex items-center justify-between gap-2 border-t border-gray-100 bg-white px-4 py-2.5 sm:px-6">
        <span className="text-xs text-gray-400">
          {`${editor?.storage.characterCount.words() ?? 0} palavras`}
        </span>
        <div className="flex items-center gap-3 text-xs">
          {statusSalvamento === 'salvando' && (
            <span className="flex items-center gap-1.5 text-indigo-500">
              <Loader2 size={12} className="animate-spin" />
              Salvando
            </span>
          )}
          {statusSalvamento === 'salvo' && ultimoSalvamento && (
            <span className="flex items-center gap-1.5 text-green-500">
              <Check size={12} />
              {ultimoSalvamento.tipo === 'automatico'
                ? `Salvo automaticamente às ${ultimoSalvamento.horario}`
                : `Salvo manualmente às ${ultimoSalvamento.horario}`}
            </span>
          )}
          {statusSalvamento === 'pendente' && (
            <span className="text-gray-400">Não salvo</span>
          )}
          {!somenteLeitura && (
            <button
              onClick={() => salvar('manual')}
              disabled={statusSalvamento === 'salvando'}
              className="rounded-md bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100 disabled:opacity-50"
            >
              {manualFeedback ? 'Salvo manualmente' : 'Salvar manualmente'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
