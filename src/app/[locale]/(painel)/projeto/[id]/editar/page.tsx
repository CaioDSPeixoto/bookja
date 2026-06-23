'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { Trash2, FileText, Plus } from 'lucide-react'
import { obterProjeto, atualizarProjeto, excluirProjeto } from '@/lib/projetos/actions'

export default function EditarProjetoPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('projeto')
  const tGeral = useTranslations('geral')
  const locale = useLocale()
  const [projeto, setProjeto] = useState<{ titulo: string; sinopse?: string; status: string; documento?: { id: string; titulo?: string }[] } | null>(null)
  const [titulo, setTitulo] = useState('')
  const [sinopse, setSinopse] = useState('')
  const [status, setStatus] = useState('rascunho')
  const [salvando, setSalvando] = useState(false)
  const [id, setId] = useState('')

  useEffect(() => {
    params.then(({ id }) => {
      setId(id)
      obterProjeto(id).then((data) => {
        setProjeto(data)
        setTitulo(data.titulo)
        setSinopse(data.sinopse || '')
        setStatus(data.status)
      })
    })
  }, [params])

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    await atualizarProjeto(id, { titulo, sinopse: sinopse || null, status })
    setSalvando(false)
  }

  async function handleExcluir() {
    if (confirm(tGeral('confirmar') + '?')) {
      await excluirProjeto(id, locale)
    }
  }

  if (!projeto) return <div className="p-8 text-center">{tGeral('carregando')}</div>

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{tGeral('editar')}</h1>
      <form onSubmit={handleSalvar} className="space-y-4">
        <div>
          <label htmlFor="titulo-editar-projeto" className="block text-sm font-medium text-gray-700">{t('titulo')}</label>
          <input
            id="titulo-editar-projeto"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="sinopse-editar-projeto" className="block text-sm font-medium text-gray-700">{t('sinopse')}</label>
          <textarea
            id="sinopse-editar-projeto"
            value={sinopse}
            onChange={(e) => setSinopse(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="status-editar-projeto" className="block text-sm font-medium text-gray-700">{t('status')}</label>
          <select
            id="status-editar-projeto"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="rascunho">{t('rascunho')}</option>
            <option value="revisao">{t('revisao')}</option>
            <option value="publicado">{t('publicado')}</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={salvando}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {salvando ? tGeral('carregando') : tGeral('salvar')}
          </button>
          <button
            type="button"
            onClick={handleExcluir}
            aria-label={tGeral('excluir')}
            className="inline-flex items-center gap-2 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <Trash2 size={16} aria-hidden="true" />
            {tGeral('excluir')}
          </button>
        </div>
      </form>

      <hr className="my-8" />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{t('novoDocumento').replace('Novo ', '') + 's'}</h2>
        <Link
          href={`/${locale}/projeto/${id}/documento/novo`}
          className="inline-flex items-center gap-2 rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          {t('novoDocumento')}
        </Link>
      </div>

      {projeto.documento && projeto.documento.length > 0 ? (
        <ul className="space-y-2">
          {projeto.documento.map((doc: { id: string; titulo?: string }) => (
            <li key={doc.id}>
              <Link
                href={`/${locale}/projeto/${id}/documento/${doc.id}`}
                className="flex items-center gap-2 rounded border border-gray-200 p-3 hover:bg-gray-50"
              >
                <FileText size={16} className="text-gray-400" />
                <span>{doc.titulo || 'Sem título'}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">{tGeral('semResultados')}</p>
      )}
    </div>
  )
}
