'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { User, LogOut, ChevronDown } from 'lucide-react'

interface Props {
  nomeUsuario: string
  nomeExibicao: string
  email: string
  locale: string
  sairAction: () => Promise<void>
}

export default function DropdownPerfil({ nomeUsuario, nomeExibicao, email, locale, sairAction }: Props) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const inicial = (nomeExibicao || nomeUsuario || email)[0].toUpperCase()

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAberto(!aberto)}
        className="flex items-center gap-1.5 rounded-full p-1 hover:bg-gray-100"
        aria-expanded={aberto}
        aria-haspopup="true"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-700">
          {inicial}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
      </button>

      {aberto && (
        <div className="absolute right-0 mt-2 w-56 rounded-md border bg-white py-1 shadow-lg">
          <div className="border-b px-4 py-2">
            <p className="text-sm font-medium">{nomeExibicao || nomeUsuario}</p>
            <p className="text-xs text-gray-500">{email}</p>
          </div>
          <Link
            href={`/${locale}/perfil/${nomeUsuario}`}
            onClick={() => setAberto(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
          >
            <User className="h-4 w-4" /> Meu perfil
          </Link>
          <div className="border-t" />
          <form action={sairAction}>
            <button className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
