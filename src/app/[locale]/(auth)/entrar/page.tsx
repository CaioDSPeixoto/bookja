'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { AlertCircle, BookOpen, Loader2, Lock, Mail } from 'lucide-react'
import { criarClienteBrowser } from '@/lib/supabase/client'
import CampoForm from '@/components/auth/CampoForm'
import OverlayCarregando from '@/components/ui/OverlayCarregando'

export default function EntrarPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const locale = useLocale()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    const supabase = criarClienteBrowser()
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      setErro(t('erroLogin'))
      setEnviando(false)
    } else {
      router.push(`/${locale}/biblioteca`)
      router.refresh()
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-xl shadow-indigo-100/40">
      <OverlayCarregando ativo={enviando} mensagem="Entrando…" />
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm">
          <BookOpen className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-bold text-gray-900">{t('entrar')}</h1>
        <p className="mt-1 text-sm text-gray-500">Bem-vindo de volta ao Bookja</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <CampoForm
          id="email-entrar"
          label={t('email')}
          icone={Mail}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="voce@exemplo.com"
        />
        <CampoForm
          id="senha-entrar"
          label={t('senha')}
          icone={Lock}
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="••••••••"
        />
        {erro && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{erro}</span>
          </div>
        )}
        <button
          type="submit"
          disabled={enviando}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {enviando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {t('entrar')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        {t('semConta')}{' '}
        <Link href={`/${locale}/cadastro`} className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
          {t('cadastrar')}
        </Link>
      </p>
    </div>
  )
}
