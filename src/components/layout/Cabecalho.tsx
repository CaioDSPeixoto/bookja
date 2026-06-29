import Link from 'next/link'
import { getTranslations, getLocale } from 'next-intl/server'
import { BookOpen } from 'lucide-react'
import { criarClienteServidor } from '@/lib/supabase/server'
import { sair } from '@/lib/auth/actions'
import SeletorIdioma from './SeletorIdioma'
import MenuMobile from './MenuMobile'
import DropdownPerfil from './DropdownPerfil'
import NotificacoesPopup from './NotificacoesPopup'

export default async function Cabecalho() {
  const t = await getTranslations('navegacao')
  const tAuth = await getTranslations('auth')
  const locale = await getLocale()

  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()

  let nomeUsuario = ''
  let nomeExibicao = ''
  if (user) {
    const { data: perfil } = await supabase
      .from('perfil')
      .select('nome_usuario, nome_exibicao')
      .eq('id', user.id)
      .single()
    nomeUsuario = perfil?.nome_usuario || user.email?.split('@')[0] || ''
    nomeExibicao = perfil?.nome_exibicao || ''
  }

  const sairComLocale = sair.bind(null, locale)

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2 font-bold text-lg">
          <BookOpen className="h-6 w-6 text-indigo-600" />
          Bookja
        </Link>

        {/* Nav central - desktop */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href={`/${locale}`} className="text-sm font-medium hover:text-indigo-600">
            {t('inicio')}
          </Link>
          <Link href={`/${locale}/historias`} className="text-sm font-medium hover:text-indigo-600">
            {t('historias')}
          </Link>
          {user && (
            <Link href={`/${locale}/biblioteca`} className="text-sm font-medium hover:text-indigo-600">
              {t('biblioteca')}
            </Link>
          )}
        </nav>

        {/* Direita */}
        <div className="flex items-center gap-3">
          <SeletorIdioma />

          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <NotificacoesPopup locale={locale} />
              <DropdownPerfil
                nomeUsuario={nomeUsuario}
                nomeExibicao={nomeExibicao}
                email={user.email || ''}
                locale={locale}
                sairAction={sairComLocale}
              />
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link
                href={`/${locale}/entrar`}
                className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-gray-100"
              >
                {tAuth('entrar')}
              </Link>
              <Link
                href={`/${locale}/cadastro`}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                {tAuth('cadastrar')}
              </Link>
            </div>
          )}

          {/* Mobile menu */}
          <MenuMobile logado={!!user} nomeUsuario={nomeUsuario} sairAction={sairComLocale} />
        </div>
      </div>
    </header>
  )
}
