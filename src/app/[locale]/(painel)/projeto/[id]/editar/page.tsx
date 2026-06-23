'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2, FileText, PenLine, Eye, Users, Check, Tag } from 'lucide-react'
import { obterProjeto, atualizarProjeto, excluirProjeto } from '@/lib/projetos/actions'
import { criarClienteBrowser } from '@/lib/supabase/client'

const statusOpcoes = ['rascunho', 'revisao', 'publicado'] as const
const statusCores: Record<string, string> = {
  rascunho: 'border-gray-300 bg-gray-50 text-gray-700',
  revisao: 'border-yellow-400 bg-yellow-50 text-yellow-700',
  publicado: 'border-green-400 bg-green-50 text-green-700',
}
const statusCoresAtivo: Record<string, string> = {
  rascunho: 'border-gray-500 bg-gray-100 text-gray-900 ring-2 ring-gray-300',
  revisao: 'border-yellow-500 bg-yellow-100 text-yellow-900 ring-2 ring-yellow-300',
  publicado: 'border-green-500 bg-green-100 text-green-900 ring-2 ring-green-300',
}

export default function EditarProjetoPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('projeto')
  const tGeral = useTranslations('geral')
  const locale = useLocale()
  const router = useRouter()
  const [projeto, setProjeto] = useState<{ titulo: string; sinopse?: string; status: string; documento?: { id: string; titulo?: string }[] } | null>(null)
  const [titulo, setTitulo] = useState('')
  const [sinopse, setSinopse] = useState('')
  const [status, setStatus] = useState('rascunho')
  const [salvando, setSalvando] = useState(false)
  const [salvoFeedback, setSalvoFeedback] = useState(false)
  const [confirmarExcluir, setConfirmarExcluir] = useState(false)
  const [id, setId] = useState('')
  const [todasTags, setTodasTags] = useState<{ id: number; nome: string; categoria: string }[]>([])
  const [tagsSelecionadas, setTagsSelecionadas] = useState<number[]>([])

  useEffect(() => {
    params.then(({ id }) => {
      setId(id)
      obterProjeto(id).then((data) => {
        setProjeto(data)
        setTitulo(data.titulo)
        setSinopse(data.sinopse || '')
        setStatus(data.status)
      })
      // Carregar tags
      const supabase = criarClienteBrowser()
      supabase.from('tag').select('*').order('categoria').then(({ data }) => {
        setTodasTags(data || [])
      })
      supabase.from('projeto_tag').select('tag_id').eq('projeto_id', id).then(({ data }) => {
        setTagsSelecionadas((data || []).map(t => t.tag_id))
      })
    })
  }, [params])

  async function toggleTag(tagId: number) {
    const supabase = criarClienteBrowser()
    if (tagsSelecionadas.includes(tagId)) {
      await supabase.from('projeto_tag').delete().eq('projeto_id', id).eq('tag_id', tagId)
      setTagsSelecionadas(prev => prev.filter(t => t !== tagId))
    } else {
      await supabase.from('projeto_tag').insert({ projeto_id: id, tag_id: tagId })
      setTagsSelecionadas(prev => [...prev, tagId])
    }
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    await atualizarProjeto(id, { titulo, sinopse: sinopse || null, status })
    setSalvando(false)
    setSalvoFeedback(true)
    setTimeout(() => setSalvoFeedback(false), 2000)
  }

  async function handleExcluir() {
    await excluirProjeto(id, locale)
    router.push(`/${locale}/painel`)
  }

  if (!projeto) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">{tGeral('editar')}</h1>

      <form onSubmit={handleSalvar} className="space-y-6">
        {/* Informações */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Informações</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="titulo-editar-projeto" className="block text-sm font-medium text-gray-700">{t('titulo')}</label>
              <input
                id="titulo-editar-projeto"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div>
              <label htmlFor="sinopse-editar-projeto" className="block text-sm font-medium text-gray-700">{t('sinopse')}</label>
              <textarea
                id="sinopse-editar-projeto"
                value={sinopse}
                onChange={(e) => setSinopse(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>
        </section>

        {/* Status */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">{t('status')}</h2>
          <div className="flex gap-3">
            {statusOpcoes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${status === s ? statusCoresAtivo[s] : statusCores[s]} hover:opacity-80`}
              >
                {t(s)}
              </button>
            ))}
          </div>
        </section>

        {/* Tags */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            <Tag size={14} /> {t('tags')}
          </h2>
          {todasTags.length > 0 ? (
            <div className="space-y-3">
              {Array.from(new Set(todasTags.map(t => t.categoria))).map(cat => (
                <div key={cat}>
                  <span className="mb-1 block text-xs font-medium text-gray-400 capitalize">{cat.replace('_', ' ')}</span>
                  <div className="flex flex-wrap gap-2">
                    {todasTags.filter(t => t.categoria === cat).map(tag => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                          tagsSelecionadas.includes(tag.id)
                            ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {tag.nome}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Carregando tags...</p>
          )}
        </section>

        {/* Ações */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Ações</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/${locale}/projeto/${id}/escrita`}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-700 hover:shadow-md"
            >
              <PenLine size={16} />
              Abrir Editor
            </Link>
            <Link
              href={`/${locale}/projeto/${id}/previa`}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
            >
              <Eye size={16} />
              Prévia
            </Link>
            <Link
              href={`/${locale}/projeto/${id}/colaboradores`}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
            >
              <Users size={16} />
              Colaboradores
            </Link>
          </div>
        </section>

        {/* Salvar + Excluir */}
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={salvando}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-700 disabled:opacity-50"
          >
            {salvoFeedback ? (
              <><Check size={16} /> Salvo</>
            ) : salvando ? (
              <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> {tGeral('carregando')}</>
            ) : (
              tGeral('salvar')
            )}
          </button>

          {!confirmarExcluir ? (
            <button
              type="button"
              onClick={() => setConfirmarExcluir(true)}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-50"
            >
              <Trash2 size={16} />
              {tGeral('excluir')}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600">Confirmar exclusão?</span>
              <button
                type="button"
                onClick={handleExcluir}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
              >
                Sim, excluir
              </button>
              <button
                type="button"
                onClick={() => setConfirmarExcluir(false)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </form>

      {/* Documentos */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t('documentos')}</h2>
          <Link
            href={`/${locale}/projeto/${id}/escrita`}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-indigo-700 hover:shadow-md"
          >
            <FileText size={16} />
            {t('documentos')}
          </Link>
        </div>

        {projeto.documento && projeto.documento.length > 0 ? (
          <ul className="space-y-2">
            {projeto.documento.map((doc: { id: string; titulo?: string }) => (
              <li key={doc.id}>
                <Link
                  href={`/${locale}/projeto/${id}/doc/${doc.id}`}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-indigo-200 hover:shadow-sm"
                >
                  <FileText size={16} className="text-indigo-400" />
                  <span className="font-medium text-gray-700">{doc.titulo || 'Sem título'}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">{tGeral('semResultados')}</p>
        )}
      </section>
    </div>
  )
}
