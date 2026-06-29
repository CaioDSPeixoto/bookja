'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { AlertCircle, Calendar, CheckCircle2, Lock, Loader2, Mail, Sparkles, User } from 'lucide-react'
import { criarClienteBrowser } from '@/lib/supabase/client'
import CampoForm from '@/components/auth/CampoForm'

export default function CadastroPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const locale = useLocale()
  const [email, setEmail] = useState('')
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)
  const hoje = new Date().toISOString().slice(0, 10)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setAviso('')
    if (senha !== confirmarSenha) {
      setErro(t('senhasNaoCoincidem'))
      return
    }
    setEnviando(true)
    const supabase = criarClienteBrowser()
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome_usuario: nomeUsuario, data_nascimento: dataNascimento } },
    })
    if (error) {
      setErro(t('erroCadastro'))
      setEnviando(false)
    } else if (data.session) {
      await supabase.from('perfil').update({ data_nascimento: dataNascimento }).eq('id', data.user!.id)
      router.push(`/${locale}/biblioteca`)
      router.refresh()
    } else {
      // Confirmação de email necessária - tenta logar direto
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (loginError) {
        // Email precisa confirmação - mostra mensagem
        setAviso('Conta criada! Verifique seu e-mail para confirmar o cadastro.')
        setEnviando(false)
      } else {
        router.push(`/${locale}/biblioteca`)
        router.refresh()
      }
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-xl shadow-indigo-100/40">
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm">
          <Sparkles className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-bold text-gray-900">{t('cadastrar')}</h1>
        <p className="mt-1 text-sm text-gray-500">Crie sua conta e comece a escrever</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <CampoForm
          id="email-cadastro"
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
          id="nome-usuario-cadastro"
          label={t('nomeUsuario')}
          icone={User}
          type="text"
          value={nomeUsuario}
          onChange={(e) => setNomeUsuario(e.target.value)}
          required
          autoComplete="username"
          placeholder="seu_usuario"
        />
        <CampoForm
          id="data-nascimento-cadastro"
          label="Data de nascimento"
          icone={Calendar}
          type="date"
          value={dataNascimento}
          max={hoje}
          onChange={(e) => setDataNascimento(e.target.value)}
          required
          ajuda="Usamos para adequar o conteúdo à sua faixa etária"
        />
        <CampoForm
          id="senha-cadastro"
          label={t('senha')}
          icone={Lock}
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          autoComplete="new-password"
          placeholder="••••••••"
        />
        <CampoForm
          id="confirmar-senha-cadastro"
          label={t('confirmarSenha')}
          icone={Lock}
          type="password"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          required
          autoComplete="new-password"
          placeholder="••••••••"
        />
        {erro && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{erro}</span>
          </div>
        )}
        {aviso && (
          <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700" role="status">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{aviso}</span>
          </div>
        )}
        <button
          type="submit"
          disabled={enviando}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {enviando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {t('cadastrar')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        {t('comConta')}{' '}
        <Link href={`/${locale}/entrar`} className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
          {t('entrar')}
        </Link>
      </p>
    </div>
  )
}
