'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { criarClienteBrowser } from '@/lib/supabase/client'

export default function EntrarPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const locale = useLocale()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    const supabase = criarClienteBrowser()
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      setErro(t('erroLogin'))
    } else {
      router.push(`/${locale}/biblioteca`)
      router.refresh()
    }
  }

  return (
    <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
      <h1 className="mb-6 text-center text-2xl font-bold">{t('entrar')}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email-entrar" className="block text-sm font-medium text-gray-700">{t('email')}</label>
          <input
            id="email-entrar"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="senha-entrar" className="block text-sm font-medium text-gray-700">{t('senha')}</label>
          <input
            id="senha-entrar"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {erro && <p className="text-sm text-red-600" role="alert">{erro}</p>}
        <button
          type="submit"
          className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {t('entrar')}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        {t('semConta')}{' '}
        <Link href={`/${locale}/cadastro`} className="text-blue-600 hover:underline">
          {t('cadastrar')}
        </Link>
      </p>
    </div>
  )
}
