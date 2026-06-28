'use client'

import { useTranslations } from 'next-intl'
import { Plus, ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { reordenarDocumentos, excluirDocumento } from '@/lib/documentos/actions'
import { useState } from 'react'

type Capitulo = {
  id: string
  titulo: string
  ordem: number
  status?: 'rascunho' | 'revisao' | 'revisao_supervisionada' | 'publicado'
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

interface Props {
  capitulos: Capitulo[]
  capituloAtivoId: string | null
  onSelecionar: (id: string) => void
  onNovo: () => void
  projetoId: string
  onReordenar: () => void
}

export default function SumarioCapitulos({ capitulos, capituloAtivoId, onSelecionar, onNovo, projetoId, onReordenar }: Props) {
  const t = useTranslations('editor')
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [operando, setOperando] = useState<string | null>(null)

  async function mover(index: number, direcao: -1 | 1) {
    const novoIndex = index + direcao
    if (novoIndex < 0 || novoIndex >= capitulos.length) return
    const id = capitulos[index].id
    setOperando(id)
    try {
      const novaOrdem = capitulos.map((c, i) => {
        if (i === index) return { id: c.id, ordem: capitulos[novoIndex].ordem }
        if (i === novoIndex) return { id: c.id, ordem: capitulos[index].ordem }
        return { id: c.id, ordem: c.ordem }
      })
      await reordenarDocumentos(projetoId, novaOrdem)
      onReordenar()
    } finally {
      setOperando(null)
    }
  }

  async function handleExcluir(id: string) {
    setOperando(id)
    try {
      await excluirDocumento(id)
      onReordenar()
    } finally {
      setOperando(null)
    }
  }

  return (
    <aside className="flex w-56 flex-col border-r border-gray-100 bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {t('sumario')}
        </h2>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {capitulos.map((cap, index) => {
          const ativo = cap.id === capituloAtivoId
          return (
            <div
              key={cap.id}
              className="relative"
              onMouseEnter={() => setHoverId(cap.id)}
              onMouseLeave={() => setHoverId(null)}
            >
              <button
                onClick={() => onSelecionar(cap.id)}
                className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-200 ${
                  ativo
                    ? 'bg-indigo-600 font-medium text-white shadow-md'
                    : 'text-gray-700 hover:bg-indigo-50'
                }`}
              >
                <span className="block truncate">
                  {cap.titulo || t('capitulo', { numero: index + 1 })}
                </span>
                <span className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] ${statusClasse[cap.status ?? 'rascunho']}`}>
                  {statusLabel[cap.status ?? 'rascunho']}
                </span>
              </button>

              {hoverId === cap.id && !ativo && (
                <div className={`absolute right-1 top-1/2 flex -translate-y-1/2 gap-0.5 ${operando === cap.id ? 'opacity-50' : ''}`}>
                  <button
                    onClick={() => mover(index, -1)}
                    className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    disabled={index === 0 || operando === cap.id}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => mover(index, 1)}
                    className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    disabled={index === capitulos.length - 1 || operando === cap.id}
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    onClick={() => handleExcluir(cap.id)}
                    className="rounded p-0.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    title={t('excluirCapitulo')}
                    disabled={operando === cap.id}
                  >
                    {operando === cap.id ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="border-t border-gray-100 p-3">
        <button
          onClick={onNovo}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 py-2.5 text-sm text-gray-500 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
        >
          <Plus size={16} />
          {t('novoCapitulo')}
        </button>
      </div>
    </aside>
  )
}
