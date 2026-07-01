'use client'

import { Loader2 } from 'lucide-react'

interface Props {
  ativo: boolean
  mensagem?: string
}

/**
 * Overlay de carregamento em tela cheia. Enquanto ativo, cobre a tela e bloqueia
 * interações (cliques/teclado) com as demais ações.
 */
export default function OverlayCarregando({ ativo, mensagem }: Props) {
  if (!ativo) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-white/70 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="h-9 w-9 animate-spin text-indigo-600" aria-hidden="true" />
      {mensagem && <p className="text-sm font-medium text-gray-600">{mensagem}</p>}
      <span className="sr-only">Carregando…</span>
    </div>
  )
}
