'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Menu, X, LogOut } from 'lucide-react'
import Link from 'next/link'

interface Props {
  logado: boolean
  nomeUsuario: string
  sairAction?: () => Promise<void>
}

export default function MenuMobile({ logado, nomeUsuario, sairAction }: Props) {
  const t = useTranslations('navegacao')
  const tAuth = useTranslations('auth')
  const locale = useLocale()
  const [aberto, setAberto] = useState(false)

  const links = logado
    ? [
        { href: `/${locale}`, label: t('inicio') },
        { href: `/${locale}/historias`, label: t('historias') },
        { href: `/${locale}/biblioteca`, label: t('biblioteca') },
        { href: `/${locale}/perfil/${nomeUsuario}`, label: t('meuPerfil') },
      ]
    : [
        { href: `/${locale}`, label: t('inicio') },
        { href: `/${locale}/historias`, label: t('historias') },
        { href: `/${locale}/entrar`, label: tAuth('entrar') },
        { href: `/${locale}/cadastro`, label: tAuth('cadastrar') },
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
          <nav className="absolute left-0 top-0 flex h-full w-64 flex-col bg-white p-4 shadow-lg" aria-label="Menu principal">
            <button
              onClick={() => setAberto(false)}
              className="mb-6 p-2 hover:bg-gray-100 rounded-md self-start"
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

            {logado && sairAction && (
              <form action={sairAction} className="mt-auto border-t pt-2">
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  {t('sair')}
                </button>
              </form>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
