'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Loader2, Plus, X, Tag, Users } from 'lucide-react'
import { criarProjeto } from '@/lib/projetos/actions'
import { convidarColaborador } from '@/lib/colaboradores/actions'
import { criarClienteBrowser } from '@/lib/supabase/client'

type TagItem = { id: string; nome: string; categoria: string }
type Colaborador = { nomeUsuario: string; papel: string }

export default function NovoProjetoPage() {
  const t = useTranslations('projeto')
  const tGeral = useTranslations('geral')
  const router = useRouter()
  const locale = useLocale()
  const [enviando, setEnviando] = useState(false)

  // Tags
  const [tags, setTags] = useState<TagItem[]>([])
  const [tagsSelecionadas, setTagsSelecionadas] = useState<string[]>([])

  // Colaboradores
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [nomeColab, setNomeColab] = useState('')
  const [papelColab, setPapelColab] = useState('coautor')

  useEffect(() => {
    const supabase = criarClienteBrowser()
    supabase.from('tag').select('*').order('categoria').then(({ data }) => {
      if (data) setTags(data)
    })
  }, [])

  function toggleTag(id: string) {
    setTagsSelecionadas(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  function adicionarColaborador() {
    const nome = nomeColab.trim()
    if (!nome || colaboradores.some(c => c.nomeUsuario === nome)) return
    setColaboradores(prev => [...prev, { nomeUsuario: nome, papel: papelColab }])
    setNomeColab('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviando(true)
    const formData = new FormData(e.currentTarget)
    try {
      const id = await criarProjeto(formData)

      if (tagsSelecionadas.length > 0) {
        const supabase = criarClienteBrowser()
        await supabase.from('projeto_tag').insert(
          tagsSelecionadas.map(tagId => ({ projeto_id: id, tag_id: tagId }))
        )
      }

      for (const c of colaboradores) {
        await convidarColaborador(id, c.nomeUsuario, c.papel)
      }

      router.push(`/${locale}/projeto/${id}/escrita`)
    } catch {
      setEnviando(false)
    }
  }

  const tagsPorCategoria = tags.reduce<Record<string, TagItem[]>>((acc, tag) => {
    ;(acc[tag.categoria] ??= []).push(tag)
    return acc
  }, {})

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">{t('criarProjeto')}</h1>
        <p className="mb-8 text-sm text-gray-400">Dê vida à sua próxima história.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
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

          {/* Sinopse */}
          <div>
            <label htmlFor="sinopse-novo-projeto" className="block text-sm font-medium text-gray-700">{t('sinopse')}</label>
            <textarea
              id="sinopse-novo-projeto"
              name="sinopse"
              rows={4}
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Uma breve descrição do seu projeto..."
            />
          </div>

          {/* Tags */}
          <div>
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <Tag size={14} /> Tags
            </h2>
            {Object.entries(tagsPorCategoria).map(([categoria, items]) => (
              <div key={categoria} className="mb-2">
                <span className="text-xs font-medium uppercase text-gray-400">{categoria}</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {items.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        tagsSelecionadas.includes(tag.id)
                          ? 'bg-indigo-600 text-white'
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

          {/* Colaboradores */}
          <div>
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <Users size={14} /> Colaboradores
            </h2>
            <div className="flex gap-2">
              <input
                value={nomeColab}
                onChange={e => setNomeColab(e.target.value)}
                placeholder="Nome de usuário"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <select
                value={papelColab}
                onChange={e => setPapelColab(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="coautor">Coautor</option>
                <option value="revisor">Revisor</option>
              </select>
              <button
                type="button"
                onClick={adicionarColaborador}
                className="rounded-lg bg-gray-100 px-3 py-2 text-gray-600 hover:bg-gray-200"
              >
                <Plus size={16} />
              </button>
            </div>
            {colaboradores.length > 0 && (
              <ul className="mt-2 space-y-1">
                {colaboradores.map((c, i) => (
                  <li key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-sm">
                    <span>{c.nomeUsuario} <span className="text-gray-400">({c.papel})</span></span>
                    <button type="button" onClick={() => setColaboradores(prev => prev.filter((_, idx) => idx !== i))}>
                      <X size={14} className="text-gray-400 hover:text-red-500" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
