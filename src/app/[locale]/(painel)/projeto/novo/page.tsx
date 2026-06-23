'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
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
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t('criarProjeto')}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="titulo-novo-projeto" className="block text-sm font-medium text-gray-700">{t('titulo')}</label>
          <input
            id="titulo-novo-projeto"
            name="titulo"
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="sinopse-novo-projeto" className="block text-sm font-medium text-gray-700">{t('sinopse')}</label>
          <textarea
            id="sinopse-novo-projeto"
            name="sinopse"
            rows={4}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {enviando ? tGeral('carregando') : t('criarProjeto')}
        </button>
      </form>
    </div>
  )
}
