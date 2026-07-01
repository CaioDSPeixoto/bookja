'use client'

import { useFormStatus } from 'react-dom'
import { LogOut, Loader2 } from 'lucide-react'

interface Props {
  label: string
  className?: string
  comTile?: boolean
}

/** Botão de logout com estado de carregamento (usa o pending do form action). */
export default function BotaoSair({ label, className, comTile = false }: Props) {
  const { pending } = useFormStatus()
  const Icone = pending ? Loader2 : LogOut
  const icone = <Icone className={`h-[18px] w-[18px] ${pending ? 'animate-spin' : ''}`} aria-hidden="true" />

  return (
    <button type="submit" disabled={pending} className={className}>
      {comTile ? (
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
          {icone}
        </span>
      ) : (
        icone
      )}
      {label}
    </button>
  )
}
