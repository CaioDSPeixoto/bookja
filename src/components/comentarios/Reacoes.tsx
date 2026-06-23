'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { reagir, listarReacoes } from '@/lib/comentarios/actions'

const EMOJIS = ['❤️', '🔥', '😢', '👏', '😂', '🤔']

interface ReacoesProps {
  comentarioId: string
}

export function Reacoes({ comentarioId }: ReacoesProps) {
  const [reacoes, setReacoes] = useState<Record<string, { contagem: number; reagiu: boolean }>>({})
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    listarReacoes(comentarioId).then(setReacoes)
  }, [comentarioId])

  async function handleReagir(emoji: string) {
    await reagir(comentarioId, emoji)
    setReacoes(await listarReacoes(comentarioId))
    setAberto(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {Object.entries(reacoes).map(([emoji, { contagem, reagiu }]) => (
        <button
          key={emoji}
          onClick={() => handleReagir(emoji)}
          className={`rounded-full border px-2 py-0.5 text-xs transition ${
            reagiu ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          {emoji} {contagem}
        </button>
      ))}
      <div className="relative">
        <button
          onClick={() => setAberto(!aberto)}
          className="rounded-full border border-gray-200 p-1 text-gray-400 hover:bg-gray-50"
        >
          <Plus size={12} />
        </button>
        {aberto && (
          <div className="absolute bottom-full left-0 z-10 mb-1 flex gap-1 rounded-lg border bg-white p-2 shadow-lg">
            {EMOJIS.map((e) => (
              <button key={e} onClick={() => handleReagir(e)} className="text-lg hover:scale-125 transition-transform">
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
