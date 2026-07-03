'use client'

import { useState, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { toggleFavorito } from '@/lib/favoritos/actions'

export function BotaoFavoritar({ projetoId, favoritado, usuarioLogado }: { projetoId: string; favoritado: boolean; usuarioLogado: boolean }) {
  const [ativo, setAtivo] = useState(favoritado)
  const [, startTransition] = useTransition()

  function handleClick() {
    if (!usuarioLogado) return
    setAtivo(!ativo)
    startTransition(async () => {
      const res = await toggleFavorito(projetoId)
      setAtivo(res.favoritado)
    })
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1"
      title={usuarioLogado ? undefined : 'Faça login para favoritar'}
      aria-label={ativo ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      aria-pressed={ativo}
    >
      <Heart size={16} className={ativo ? 'fill-red-500 text-red-500' : 'text-gray-500'} aria-hidden="true" />
    </button>
  )
}
