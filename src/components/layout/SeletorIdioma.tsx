'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Globe } from 'lucide-react'

const idiomas = [{ codigo: 'pt-BR', nome: 'ptBR' }] as const

export default function SeletorIdioma() {
  const t = useTranslations('idioma')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [aberto, setAberto] = useState(false)

  function trocarIdioma(novoLocale: string) {
    const novoPath = pathname.replace(`/${locale}`, `/${novoLocale}`)
    router.push(novoPath)
    setAberto(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setAberto(!aberto)}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        aria-label={t('seletor')}
        aria-expanded={aberto}
        aria-haspopup="true"
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">{t('ptBR')}</span>
      </button>
      {aberto && (
        <div className="absolute right-0 top-full mt-1 rounded-md border bg-white py-1 shadow-md z-50" role="menu">
          {idiomas.map((idioma) => (
            <button
              key={idioma.codigo}
              onClick={() => trocarIdioma(idioma.codigo)}
              role="menuitem"
              className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                locale === idioma.codigo ? 'font-semibold' : ''
              }`}
            >
              {t(idioma.nome)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
