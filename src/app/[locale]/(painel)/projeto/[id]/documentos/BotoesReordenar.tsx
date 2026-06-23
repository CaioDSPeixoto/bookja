'use client'

import { useRouter } from 'next/navigation'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { reordenarDocumentos } from '@/lib/documentos/actions'

interface Doc { id: string; ordem: number }

export default function BotoesReordenar({
  projetoId,
  documentos,
  index,
}: {
  projetoId: string
  documentos: Doc[]
  index: number
}) {
  const router = useRouter()

  async function mover(direcao: -1 | 1) {
    const alvo = index + direcao
    if (alvo < 0 || alvo >= documentos.length) return

    const ordens = documentos.map((d, i) => {
      if (i === index) return { id: d.id, ordem: documentos[alvo].ordem }
      if (i === alvo) return { id: d.id, ordem: documentos[index].ordem }
      return { id: d.id, ordem: d.ordem }
    })

    await reordenarDocumentos(projetoId, ordens)
    router.refresh()
  }

  return (
    <div className="flex flex-col">
      <button
        onClick={() => mover(-1)}
        disabled={index === 0}
        className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
      >
        <ChevronUp size={16} />
      </button>
      <button
        onClick={() => mover(1)}
        disabled={index === documentos.length - 1}
        className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
      >
        <ChevronDown size={16} />
      </button>
    </div>
  )
}
