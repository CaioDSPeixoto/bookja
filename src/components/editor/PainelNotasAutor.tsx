'use client'

import { useCallback, useEffect, useState } from 'react'
import { StickyNote, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { listarNotasDocumento, criarNotaDocumento, excluirNotaDocumento } from '@/lib/documentos/interacoes'

interface Props {
  projetoId: string
  documentoId: string
}

type Nota = {
  id: string
  conteudo: string
  criado_em: string
}

export default function PainelNotasAutor({ projetoId, documentoId }: Props) {
  const [notas, setNotas] = useState<Nota[]>([])
  const [aberto, setAberto] = useState(false)
  const [texto, setTexto] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const carregar = useCallback(async () => {
    try {
      const dados = await listarNotasDocumento(documentoId)
      setNotas(dados as Nota[])
    } catch {
      setNotas([])
    }
  }, [documentoId])

  useEffect(() => { carregar() }, [carregar])

  async function handleAdicionar() {
    if (!texto.trim() || ocupado) return
    setOcupado(true)
    try {
      await criarNotaDocumento(projetoId, documentoId, texto)
      setTexto('')
      await carregar()
    } finally {
      setOcupado(false)
    }
  }

  async function handleExcluir(id: string) {
    setOcupado(true)
    try {
      await excluirNotaDocumento(id)
      await carregar()
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="border-t border-gray-100 bg-amber-50/40">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="flex w-full items-center gap-2 px-4 py-2 text-xs font-medium text-amber-700 sm:px-6"
      >
        {aberto ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <StickyNote size={14} />
        Bastidores do capítulo{notas.length > 0 ? ` (${notas.length})` : ''}
      </button>

      {aberto && (
        <div className="max-h-56 overflow-y-auto px-4 pb-3 sm:px-6">
          <p className="mb-2 text-[11px] text-amber-700/80">
            Notas e curiosidades visíveis para as leitoras na página de leitura.
          </p>

          <div className="flex flex-wrap gap-2">
            {notas.map((n) => (
              <div key={n.id} className="relative w-48 rounded-md border border-amber-200 bg-amber-100/70 p-2 text-xs text-amber-900 shadow-sm">
                <p className="whitespace-pre-line break-words pr-4">{n.conteudo}</p>
                <button
                  type="button"
                  onClick={() => handleExcluir(n.id)}
                  className="absolute right-1 top-1 text-amber-500 hover:text-red-600"
                  aria-label="Excluir nota"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-start gap-2">
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={2}
              placeholder="Escreva uma curiosidade, contexto ou bastidor..."
              className="flex-1 resize-none rounded-md border border-amber-200 bg-white px-2 py-1.5 text-xs focus:border-amber-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAdicionar}
              disabled={ocupado || !texto.trim()}
              className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50"
            >
              <Plus size={12} /> Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
