'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { criarClienteBrowser } from '@/lib/supabase/client'

export default function CadastroPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const locale = useLocale()
  const [email, setEmail] = useState('')
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (senha !== confirmarSenha) {
      setErro(t('senhasNaoCoincidem'))
      return
    }
    const supabase = criarClienteBrowser()
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome_usuario: nomeUsuario } },
    })
    if (error) {
      console.error('Erro signUp:', error.message, error)
      setErro(t('erroCadastro'))
    } else if (data.session) {
      // Login automático (confirmação de email desabilitada)
      router.push(`/${locale}/biblioteca`)
      router.refresh()
    } else {
      // Confirmação de email necessária - tenta logar direto
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (loginError) {
        // Email precisa confirmação - mostra mensagem
        setErro('Conta criada! Verifique seu e-mail para confirmar o cadastro.')
      } else {
        router.push(`/${locale}/biblioteca`)
        router.refresh()
      }
    }
  }

  return (
    <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
      <h1 className="mb-6 text-center text-2xl font-bold">{t('cadastrar')}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email-cadastro" className="block text-sm font-medium text-gray-700">{t('email')}</label>
          <input
            id="email-cadastro"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="nome-usuario-cadastro" className="block text-sm font-medium text-gray-700">{t('nomeUsuario')}</label>
          <input
            id="nome-usuario-cadastro"
            type="text"
            value={nomeUsuario}
            onChange={(e) => setNomeUsuario(e.target.value)}
            required
            autoComplete="username"
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="senha-cadastro" className="block text-sm font-medium text-gray-700">{t('senha')}</label>
          <input
            id="senha-cadastro"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            autoComplete="new-password"
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="confirmar-senha-cadastro" className="block text-sm font-medium text-gray-700">{t('confirmarSenha')}</label>
          <input
            id="confirmar-senha-cadastro"
            type="password"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            required
            autoComplete="new-password"
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {erro && <p className="text-sm text-red-600" role="alert">{erro}</p>}
        <button
          type="submit"
          className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {t('cadastrar')}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        {t('comConta')}{' '}
        <Link href={`/${locale}/entrar`} className="text-blue-600 hover:underline">
          {t('entrar')}
        </Link>
      </p>
    </div>
  )
}
