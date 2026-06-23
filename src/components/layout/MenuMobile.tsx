'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'

export default function MenuMobile() {
  const t = useTranslations('navegacao')
  const locale = useLocale()
  const [aberto, setAberto] = useState(false)

  const links = [
    { href: `/${locale}`, label: t('inicio') },
    { href: `/${locale}/historias`, label: t('historias') },
    { href: `/${locale}/painel`, label: t('painel') },
    { href: `/${locale}/favoritos`, label: t('favoritos') },
    { href: `/${locale}/configuracoes`, label: t('configuracoes') },
  ]

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="md:hidden p-2 hover:bg-gray-100 rounded-md"
        aria-label="Abrir menu de navegação"
        aria-expanded={aberto}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu de navegação">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setAberto(false)}
            aria-hidden="true"
          />
          <nav className="absolute left-0 top-0 h-full w-64 bg-white p-4 shadow-lg" aria-label="Menu principal">
            <button
              onClick={() => setAberto(false)}
              className="mb-6 p-2 hover:bg-gray-100 rounded-md"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setAberto(false)}
                    className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </>
  )
}
