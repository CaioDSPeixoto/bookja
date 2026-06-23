'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { criarProjeto } from '@/lib/projetos/actions'

export default function NovoProjetoPage() {
  const t = useTranslations('projeto')
  const tGeral = useTranslations('geral')
  const router = useRouter()
  const locale = useLocale()
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviando(true)
    const formData = new FormData(e.currentTarget)
    try {
      const id = await criarProjeto(formData)
      router.push(`/${locale}/projeto/${id}/editar`)
    } catch {
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">{t('criarProjeto')}</h1>
        <p className="mb-8 text-sm text-gray-400">Dê vida à sua próxima história.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="titulo-novo-projeto" className="block text-sm font-medium text-gray-700">{t('titulo')}</label>
            <input
              id="titulo-novo-projeto"
              name="titulo"
              required
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Ex: O Último Capítulo"
            />
          </div>
          <div>
            <label htmlFor="sinopse-novo-projeto" className="block text-sm font-medium text-gray-700">{t('sinopse')}</label>
            <textarea
              id="sinopse-novo-projeto"
              name="sinopse"
              rows={5}
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Uma breve descrição do seu projeto..."
            />
          </div>
          <button
            type="submit"
            disabled={enviando}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-base font-medium text-white transition-all hover:bg-indigo-700 hover:shadow-md disabled:opacity-60"
          >
            {enviando ? (
              <><Loader2 size={18} className="animate-spin" /> {tGeral('carregando')}</>
            ) : (
              t('criarProjeto')
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
