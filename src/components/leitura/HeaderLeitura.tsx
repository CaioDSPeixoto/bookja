'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props {
  voltarHref: string
  titulo: string
  capituloAtual: number
  totalCapitulos: number
  voltarLabel: string
}

export default function HeaderLeitura({ voltarHref, titulo, capituloAtual, totalCapitulos, voltarLabel }: Props) {
  const [visivel, setVisivel] = useState(true)
  const lastScroll = useRef(0)

  useEffect(() => {
    function handleScroll() {
      const current = window.scrollY
      setVisivel(current < 50 || current < lastScroll.current)
      lastScroll.current = current
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-1 left-0 right-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur transition-transform duration-300 ${visivel ? 'translate-y-0' : '-translate-y-full'}`}
    >
      <div className="mx-auto flex max-w-prose items-center gap-3 px-4 py-2">
        <Link href={voltarHref} className="text-gray-500 hover:text-indigo-600" aria-label={voltarLabel}>
          <ArrowLeft size={20} />
        </Link>
        <span className="flex-1 truncate text-sm font-medium text-gray-700">{titulo}</span>
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {capituloAtual} / {totalCapitulos}
        </span>
      </div>
    </header>
  )
}
