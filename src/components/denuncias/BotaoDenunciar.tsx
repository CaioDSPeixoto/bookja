'use client'

import { useState } from 'react'
import { Flag, Loader2 } from 'lucide-react'
import { denunciar, type TipoAlvoDenuncia } from '@/lib/denuncias/actions'

interface Props {
  tipoAlvo: TipoAlvoDenuncia
  alvoId: string
}

/**
 * Botão de denúncia de conteúdo. Ao clicar, abre um campo para o motivo e envia
 * a denúncia. Fica desabilitado após o envio (ou se já havia sido denunciado).
 */
export default function BotaoDenunciar({ tipoAlvo, alvoId }: Props) {
  const [aberto, setAberto] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function handleEnviar() {
    if (!motivo.trim()) return
    setEnviando(true)
    try {
      await denunciar(tipoAlvo, alvoId, motivo)
      setEnviado(true)
      setAberto(false)
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return <span className="text-xs text-gray-400">Denúncia enviada</span>
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-600"
        aria-label="Denunciar conteúdo"
      >
        <Flag size={12} aria-hidden="true" />
      </button>
    )
  }

  return (
    <div className="mt-1 flex w-full max-w-sm flex-col gap-1">
      <input
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        placeholder="Motivo da denúncia"
        maxLength={500}
        className="rounded-lg border border-gray-300 bg-gray-50/60 px-3 py-1.5 text-sm transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
      />
      <div className="flex gap-2">
        <button
          onClick={handleEnviar}
          disabled={enviando || !motivo.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {enviando && <Loader2 size={12} className="animate-spin" aria-hidden="true" />}
          Denunciar
        </button>
        <button
          onClick={() => { setAberto(false); setMotivo('') }}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
