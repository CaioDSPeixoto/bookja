'use client'

import { useEffect, useState } from 'react'
import { Smile } from 'lucide-react'
import { reagirDocumento, listarReacoesDocumento } from '@/lib/documentos/interacoes'

const EMOJIS = ['❤️', '🔥', '😢', '👏', '😂', '🤔', '😍', '😱']

interface Props {
  documentoId: string
  podeReagir?: boolean
}

export default function ReacoesDocumento({ documentoId, podeReagir = false }: Props) {
  const [reacoes, setReacoes] = useState<Record<string, { contagem: number; reagiu: boolean }>>({})
  const [aberto, setAberto] = useState(false)
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    listarReacoesDocumento(documentoId).then(setReacoes).catch(() => {})
  }, [documentoId])

  async function handleReagir(emoji: string) {
    if (!podeReagir || ocupado) return
    setOcupado(true)
    try {
      await reagirDocumento(documentoId, emoji)
      setReacoes(await listarReacoesDocumento(documentoId))
    } finally {
      setOcupado(false)
      setAberto(false)
    }
  }

  const entradas = Object.entries(reacoes).filter(([, v]) => v.contagem > 0)

  return (
    <div className="mt-10 border-t border-gray-200 pt-6">
      <p className="mb-2 text-sm font-medium text-gray-600">O que você achou deste capítulo?</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {entradas.map(([emoji, { contagem, reagiu }]) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleReagir(emoji)}
            disabled={!podeReagir}
            className={`rounded-full border px-2.5 py-1 text-sm transition ${
              reagiu ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'
            } ${podeReagir ? '' : 'cursor-default'}`}
          >
            {emoji} {contagem}
          </button>
        ))}

        {podeReagir ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setAberto(!aberto)}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-sm text-gray-500 hover:bg-gray-50"
            >
              <Smile size={15} /> reagir
            </button>
            {aberto && (
              <div className="absolute bottom-full left-0 z-10 mb-1 flex flex-wrap gap-1 rounded-lg border bg-white p-2 shadow-lg">
                {EMOJIS.map((e) => (
                  <button key={e} type="button" onClick={() => handleReagir(e)} className="text-xl transition-transform hover:scale-125">
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          entradas.length === 0 && <span className="text-sm text-gray-400">Entre para reagir.</span>
        )}
      </div>
    </div>
  )
}
