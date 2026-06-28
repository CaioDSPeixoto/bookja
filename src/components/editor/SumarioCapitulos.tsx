'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2 } from 'lucide-react'
import { excluirDocumento, reordenarDocumentos } from '@/lib/documentos/actions'

type Capitulo = {
  id: string
  titulo: string
  ordem: number
  status?: 'rascunho' | 'revisao' | 'revisao_supervisionada' | 'publicado'
}

interface Props {
  capitulos: Capitulo[]
  capituloAtivoId: string | null
  onSelecionar: (id: string) => void | Promise<void>
  onNovo: () => void | Promise<void>
  projetoId: string
  onReordenar: () => void
}

const statusClasse: Record<string, string> = {
  rascunho: 'bg-gray-100 text-gray-500',
  revisao: 'bg-yellow-50 text-yellow-700',
  revisao_supervisionada: 'bg-purple-50 text-purple-700',
  publicado: 'bg-green-50 text-green-700',
}

const statusLabel: Record<string, string> = {
  rascunho: 'Rascunho',
  revisao: 'Revisão',
  revisao_supervisionada: 'Revisão supervisionada',
  publicado: 'Publicado',
}

export default function SumarioCapitulos({ capitulos, capituloAtivoId, onSelecionar, onNovo, projetoId, onReordenar }: Props) {
  const [operando, setOperando] = useState<string | null>(null)
  const [confirmandoExclusaoId, setConfirmandoExclusaoId] = useState<string | null>(null)

  async function mover(index: number, direcao: -1 | 1) {
    const novoIndex = index + direcao
    if (novoIndex < 0 || novoIndex >= capitulos.length) return
    const id = capitulos[index].id
    setOperando(id)
    try {
      const novaOrdem = capitulos.map((capitulo, indice) => {
        if (indice === index) return { id: capitulo.id, ordem: capitulos[novoIndex].ordem }
        if (indice === novoIndex) return { id: capitulo.id, ordem: capitulos[index].ordem }
        return { id: capitulo.id, ordem: capitulo.ordem }
      })
      await reordenarDocumentos(projetoId, novaOrdem)
      onReordenar()
    } finally {
      setOperando(null)
    }
  }

  async function handleExcluir(id: string) {
    if (confirmandoExclusaoId !== id) {
      setConfirmandoExclusaoId(id)
      return
    }

    setOperando(id)
    try {
      await excluirDocumento(id)
      setConfirmandoExclusaoId(null)
      onReordenar()
    } finally {
      setOperando(null)
    }
  }

  return (
    <aside className="flex w-64 flex-col border-r border-gray-100 bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Sumário</h2>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {capitulos.map((capitulo, index) => {
          const ativo = capitulo.id === capituloAtivoId
          const status = capitulo.status ?? 'rascunho'
          const operandoEste = operando === capitulo.id

          return (
            <div
              key={capitulo.id}
              className={`mb-1 rounded-lg border ${ativo ? 'border-indigo-200 bg-indigo-50' : 'border-transparent hover:bg-gray-50'}`}
            >
              <button
                onClick={() => onSelecionar(capitulo.id)}
                className="w-full px-3 pt-2.5 text-left text-sm"
              >
                <span className={`block truncate ${ativo ? 'font-semibold text-indigo-700' : 'text-gray-800'}`}>
                  {capitulo.titulo || `Capítulo ${index + 1}`}
                </span>
                <span className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] ${statusClasse[status]}`}>
                  {statusLabel[status]}
                </span>
              </button>

              <div className="flex items-center justify-end gap-1 px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => mover(index, -1)}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
                  disabled={index === 0 || operandoEste}
                  title="Mover para cima"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => mover(index, 1)}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
                  disabled={index === capitulos.length - 1 || operandoEste}
                  title="Mover para baixo"
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleExcluir(capitulo.id)}
                  className={`rounded px-1.5 py-1 text-[11px] ${
                    confirmandoExclusaoId === capitulo.id
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'text-red-500 hover:bg-red-50'
                  }`}
                  disabled={operandoEste}
                  title="Excluir capítulo"
                >
                  {operandoEste ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : confirmandoExclusaoId === capitulo.id ? (
                    'Confirmar'
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </nav>

      <div className="border-t border-gray-100 p-3">
        <button
          onClick={onNovo}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 py-2.5 text-sm text-gray-500 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
        >
          <Plus size={16} />
          Novo capítulo
        </button>
      </div>
    </aside>
  )
}
