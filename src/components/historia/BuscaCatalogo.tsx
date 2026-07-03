'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Loader2, Search } from 'lucide-react'

/**
 * Campo de busca do catálogo com debounce: atualiza a URL (`?busca=`) 400ms
 * após o usuário parar de digitar, sem exigir clique em botão.
 */
export default function BuscaCatalogo() {
  const t = useTranslations('catalogo')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [valor, setValor] = useState(searchParams.get('busca') ?? '')
  const [buscando, setBuscando] = useState(false)

  useEffect(() => {
    const termo = valor.trim()
    // Nada a fazer se a URL já reflete o termo (cobre o mount e cliques em tags,
    // que mudam a URL sem alterar o texto digitado).
    if (termo === (searchParams.get('busca') ?? '').trim()) return

    setBuscando(true)
    const temporizador = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (termo) params.set('busca', termo)
      else params.delete('busca')
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
      setBuscando(false)
    }, 400)

    return () => clearTimeout(temporizador)
  }, [valor, pathname, router, searchParams])

  return (
    <div className="relative mb-6">
      <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder={t('buscar')}
        className="w-full rounded-xl border border-gray-300 bg-gray-50/60 py-2.5 pl-10 pr-10 text-sm transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
      />
      {buscando && (
        <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-indigo-500" aria-hidden="true" />
      )}
    </div>
  )
}
