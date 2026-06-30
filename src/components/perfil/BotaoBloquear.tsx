'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Ban, Check } from 'lucide-react'
import { bloquearUsuario, desbloquearUsuario } from '@/lib/bloqueio/actions'

interface Props {
  usuarioId: string
  bloqueadoInicial: boolean
}

export default function BotaoBloquear({ usuarioId, bloqueadoInicial }: Props) {
  const t = useTranslations('perfil')
  const [bloqueado, setBloqueado] = useState(bloqueadoInicial)
  const [pending, startTransition] = useTransition()

  function alternar() {
    startTransition(async () => {
      const resultado = bloqueado
        ? await desbloquearUsuario(usuarioId)
        : await bloquearUsuario(usuarioId)
      setBloqueado(resultado.bloqueado)
    })
  }

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={pending}
      className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
        bloqueado
          ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
          : 'border-red-200 text-red-600 hover:bg-red-50'
      }`}
    >
      {bloqueado ? <Check size={15} /> : <Ban size={15} />}
      <span className="hidden sm:inline">{bloqueado ? t('desbloquear') : t('bloquear')}</span>
    </button>
  )
}
