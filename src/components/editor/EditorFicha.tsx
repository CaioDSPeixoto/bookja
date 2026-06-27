'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Loader2, Plus, Trash2, Type, AlignLeft, GripVertical } from 'lucide-react'
import { atualizarDocumento } from '@/lib/documentos/actions'
import {
  parseFicha,
  presetPara,
  serializarFicha,
  novoCampo,
  type CampoFicha,
} from '@/lib/fichas/modelo'

type Documento = {
  id: string
  titulo: string
  tipo: string
  conteudo: unknown
}

interface Props {
  documento: Documento
  onAtualizado: () => void
}

const ROTULO_TIPO: Record<string, string> = {
  ficha_personagem: 'Ficha de personagem',
  biblia: 'Ambientação / bíblia',
  nota: 'Nota',
  outro: 'Documento',
}

export default function EditorFicha({ documento, onAtualizado }: Props) {
  const [titulo, setTitulo] = useState(documento.titulo || '')
  const [campos, setCampos] = useState<CampoFicha[]>(() => {
    const existentes = parseFicha(documento.conteudo)
    return existentes.length > 0 ? existentes : presetPara(documento.tipo)
  })
  const [status, setStatus] = useState<'salvo' | 'salvando' | 'pendente'>('salvo')
  const pendente = useRef(false)

  function marcarPendente() {
    pendente.current = true
    setStatus('pendente')
  }

  function atualizarCampo(id: string, patch: Partial<CampoFicha>) {
    setCampos((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
    marcarPendente()
  }

  function removerCampo(id: string) {
    setCampos((prev) => prev.filter((c) => c.id !== id))
    marcarPendente()
  }

  function adicionarCampo() {
    setCampos((prev) => [...prev, novoCampo('curto')])
    marcarPendente()
  }

  function aplicarModelo() {
    setCampos(presetPara(documento.tipo))
    marcarPendente()
  }

  const salvar = useCallback(async () => {
    setStatus('salvando')
    try {
      await atualizarDocumento(documento.id, {
        titulo: titulo.trim() || undefined,
        conteudo: serializarFicha(campos),
      })
      pendente.current = false
      setStatus('salvo')
      onAtualizado()
    } catch {
      setStatus('pendente')
    }
  }, [documento.id, titulo, campos, onAtualizado])

  // Auto-save com debounce curto
  useEffect(() => {
    if (!pendente.current) return
    const t = setTimeout(salvar, 2500)
    return () => clearTimeout(t)
  }, [status, salvar])

  // Aviso ao sair com alterações não salvas
  useEffect(() => {
    function aoSair(e: BeforeUnloadEvent) {
      if (pendente.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', aoSair)
    return () => window.removeEventListener('beforeunload', aoSair)
  }, [])

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Cabeçalho */}
      <div className="border-b border-gray-100 px-8 pt-6 pb-4">
        <span className="text-xs font-medium uppercase tracking-wider text-indigo-400">
          {ROTULO_TIPO[documento.tipo] || 'Documento'}
        </span>
        <input
          type="text"
          value={titulo}
          onChange={(e) => { setTitulo(e.target.value); marcarPendente() }}
          onBlur={salvar}
          placeholder="Nome / título"
          className="mt-1 w-full text-3xl font-bold text-gray-900 placeholder-gray-300 outline-none"
        />
      </div>

      {/* Campos */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-2xl space-y-5">
          {campos.map((c) => (
            <div key={c.id} className="group rounded-lg border border-gray-100 p-3 hover:border-gray-200">
              <div className="mb-1.5 flex items-center gap-2">
                <GripVertical size={14} className="shrink-0 text-gray-300" />
                <input
                  value={c.rotulo}
                  onChange={(e) => atualizarCampo(c.id, { rotulo: e.target.value })}
                  onBlur={salvar}
                  placeholder="Nome do campo"
                  className="flex-1 bg-transparent text-sm font-semibold text-gray-700 outline-none placeholder-gray-300"
                />
                <button
                  type="button"
                  onClick={() => atualizarCampo(c.id, { tipo: c.tipo === 'curto' ? 'longo' : 'curto' })}
                  title={c.tipo === 'curto' ? 'Transformar em texto longo' : 'Transformar em linha curta'}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-gray-400 hover:bg-gray-50 hover:text-indigo-600"
                >
                  {c.tipo === 'curto' ? <Type size={13} /> : <AlignLeft size={13} />}
                </button>
                <button
                  type="button"
                  onClick={() => removerCampo(c.id)}
                  title="Remover campo"
                  className="rounded-md p-1 text-gray-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              {c.tipo === 'curto' ? (
                <input
                  value={c.valor}
                  onChange={(e) => atualizarCampo(c.id, { valor: e.target.value })}
                  onBlur={salvar}
                  className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 outline-none focus:border-indigo-400"
                />
              ) : (
                <textarea
                  value={c.valor}
                  onChange={(e) => atualizarCampo(c.id, { valor: e.target.value })}
                  onBlur={salvar}
                  rows={3}
                  className="w-full resize-y rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 outline-none focus:border-indigo-400"
                />
              )}
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={adicionarCampo}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600"
            >
              <Plus size={14} /> Adicionar campo
            </button>
            {campos.length === 0 && (
              <button
                type="button"
                onClick={aplicarModelo}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50"
              >
                Usar modelo sugerido
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Barra de status */}
      <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-2.5">
        <span className="text-xs text-gray-400">{campos.length} campo(s)</span>
        <div className="flex items-center gap-3 text-xs">
          {status === 'salvando' && (
            <span className="flex items-center gap-1.5 text-indigo-500"><Loader2 size={12} className="animate-spin" /> Salvando</span>
          )}
          {status === 'salvo' && (
            <span className="flex items-center gap-1.5 text-green-500"><Check size={12} /> Salvo</span>
          )}
          {status === 'pendente' && <span className="text-gray-400">● Não salvo</span>}
          <button
            onClick={salvar}
            disabled={status === 'salvando'}
            className="rounded-md bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100 disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
