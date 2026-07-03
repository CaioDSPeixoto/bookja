'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Estrelas } from '@/components/comentarios/Estrelas'
import { avaliarProjeto, obterMinhaAvaliacao } from '@/lib/comentarios/actions'

interface Props {
  projetoId: string
}

/**
 * Widget de avaliação por estrelas independente do comentário. Carrega a nota
 * atual do usuário e salva imediatamente ao clicar em uma estrela.
 */
export default function AvaliacaoHistoria({ projetoId }: Props) {
  const [nota, setNota] = useState(0)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    obterMinhaAvaliacao(projetoId).then((n) => setNota(n ?? 0))
  }, [projetoId])

  async function handleAvaliar(valor: number) {
    // Clicar na mesma estrela remove a avaliação.
    const nova = valor === nota ? 0 : valor
    setNota(nova)
    setSalvando(true)
    setSalvo(false)
    try {
      await avaliarProjeto(projetoId, nova)
      setSalvo(true)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <span className="text-sm font-medium text-gray-700">Sua avaliação:</span>
      <Estrelas valor={nota} onChange={handleAvaliar} tamanho={26} />
      {salvando && <Loader2 size={16} className="animate-spin text-indigo-500" aria-hidden="true" />}
      {!salvando && salvo && (
        <span className="text-sm text-gray-400">{nota > 0 ? 'Avaliação salva!' : 'Avaliação removida'}</span>
      )}
    </div>
  )
}
