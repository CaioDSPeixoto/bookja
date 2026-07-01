'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Menu, X, Home, BookOpen, Library, User, LogIn, UserPlus, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import BotaoSair from './BotaoSair'

interface Props {
  logado: boolean
  nomeUsuario: string
  nomeExibicao?: string
  sairAction?: () => Promise<void>
}

export default function MenuMobile({ logado, nomeUsuario, nomeExibicao = '', sairAction }: Props) {
  const t = useTranslations('navegacao')
  const tAuth = useTranslations('auth')
  const locale = useLocale()
  const [aberto, setAberto] = useState(false)

  const links: { href: string; label: string; icone: LucideIcon }[] = logado
    ? [
        { href: `/${locale}`, label: t('inicio'), icone: Home },
        { href: `/${locale}/historias`, label: t('historias'), icone: BookOpen },
        { href: `/${locale}/biblioteca`, label: t('biblioteca'), icone: Library },
        { href: `/${locale}/perfil/${nomeUsuario}`, label: t('meuPerfil'), icone: User },
      ]
    : [
        { href: `/${locale}`, label: t('inicio'), icone: Home },
        { href: `/${locale}/historias`, label: t('historias'), icone: BookOpen },
        { href: `/${locale}/entrar`, label: tAuth('entrar'), icone: LogIn },
        { href: `/${locale}/cadastro`, label: tAuth('cadastrar'), icone: UserPlus },
      ]

  const nomeMostrado = nomeExibicao || nomeUsuario
  const inicial = (nomeMostrado || '?').charAt(0).toUpperCase()

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="md:hidden rounded-md p-2 hover:bg-gray-100"
        aria-label="Abrir menu de navegação"
        aria-expanded={aberto}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu de navegação">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm [animation:menu-overlay-in_0.2s_ease-out]"
            onClick={() => setAberto(false)}
            aria-hidden="true"
          />
          <nav
            className="absolute right-0 top-0 flex h-full w-72 max-w-[82vw] flex-col bg-white shadow-2xl [animation:menu-panel-in_0.24s_cubic-bezier(0.22,1,0.36,1)]"
            aria-label="Menu principal"
          >
            {/* Cabeçalho do painel */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              {logado ? (
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-base font-semibold text-white shadow-sm">
                    {inicial}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{nomeMostrado}</p>
                    {nomeUsuario && <p className="truncate text-xs text-gray-400">@{nomeUsuario}</p>}
                  </div>
                </div>
              ) : (
                <span className="flex items-center gap-2 text-base font-bold text-gray-900">
                  <BookOpen className="h-5 w-5 text-indigo-600" aria-hidden="true" /> Bookja
                </span>
              )}
              <button
                onClick={() => setAberto(false)}
                className="flex-shrink-0 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Itens */}
            <ul className="flex-1 space-y-1 overflow-y-auto p-3">
              {links.map((link, i) => {
                const Icone = link.icone
                return (
                  <li
                    key={link.href}
                    className="opacity-0 [animation:menu-item-in_0.3s_ease-out_forwards]"
                    style={{ animationDelay: `${60 + i * 45}ms` }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setAberto(false)}
                      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-colors group-hover:bg-indigo-100 group-hover:text-indigo-600">
                        <Icone className="h-[18px] w-[18px]" aria-hidden="true" />
                      </span>
                      {link.label}
                    </Link>
                  </li>
                )
              })}
            </ul>

            {/* Rodapé */}
            {logado && sairAction && (
              <div className="border-t border-gray-100 p-3">
                <form action={sairAction}>
                  <BotaoSair
                    comTile
                    label={t('sair')}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                  />
                </form>
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
