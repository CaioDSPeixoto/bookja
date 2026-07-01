'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { AlertCircle, Loader2, Plus, X, Tag, Users } from 'lucide-react'
import { criarProjeto } from '@/lib/projetos/actions'
import { convidarColaborador } from '@/lib/colaboradores/actions'
import { criarClienteBrowser } from '@/lib/supabase/client'

type TagItem = { id: number; nome: string; categoria: string | null }
type Colaborador = { nomeUsuario: string; papel: string }

export default function NovoProjetoPage() {
  const t = useTranslations('projeto')
  const tGeral = useTranslations('geral')
  const router = useRouter()
  const locale = useLocale()
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const projetoCriadoRef = useRef<string | null>(null)

  // Tags
  const [tags, setTags] = useState<TagItem[]>([])
  const [tagsSelecionadas, setTagsSelecionadas] = useState<number[]>([])
  const [erroClassificacao, setErroClassificacao] = useState(false)

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

  function toggleTag(id: number) {
    setTagsSelecionadas(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  function adicionarColaborador() {
    const nome = nomeColab.trim().replace(/^@+/, '')
    if (!nome || colaboradores.some(c => c.nomeUsuario === nome)) return
    setColaboradores(prev => [...prev, { nomeUsuario: nome, papel: papelColab }])
    setNomeColab('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const temClassificacao = tagsSelecionadas.some(id => tags.find(t => t.id === id && t.categoria === 'publico_alvo'))
    if (!temClassificacao) {
      setErroClassificacao(true)
      return
    }
    setErroClassificacao(false)
    setErro('')
    setEnviando(true)
    const formData = new FormData(e.currentTarget)
    try {
      // Não recria o projeto se já foi criado numa tentativa anterior (ex.: convite falhou).
      let id = projetoCriadoRef.current
      if (!id) {
        id = await criarProjeto(formData)
        projetoCriadoRef.current = id

        if (tagsSelecionadas.length > 0) {
          const supabase = criarClienteBrowser()
          await supabase.from('projeto_tag').insert(
            tagsSelecionadas.map(tagId => ({ projeto_id: id!, tag_id: tagId }))
          )
        }
      }

      const falhas: string[] = []
      for (const c of colaboradores) {
        try {
          await convidarColaborador(id, c.nomeUsuario, c.papel)
        } catch {
          falhas.push(c.nomeUsuario)
        }
      }

      if (falhas.length > 0) {
        setErro(`Projeto criado, mas não foi possível convidar: ${falhas.join(', ')}. Verifique o nome de usuário (sem espaços/@) e tente novamente, ou gerencie depois em Colaboradores.`)
        setEnviando(false)
        return
      }

      router.push(`/${locale}/projeto/${id}/editar`)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível criar o projeto')
      setEnviando(false)
    }
  }

  const tagsPorCategoria = tags.reduce<Record<string, TagItem[]>>((acc, tag) => {
    const categoria = tag.categoria ?? 'geral'
    ;(acc[categoria] ??= []).push(tag)
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
              <div key={categoria} className={`mb-2 ${categoria === 'publico_alvo' ? `rounded-lg p-2 ${erroClassificacao ? 'border-2 border-red-400' : 'border border-gray-200'}` : ''}`}>
                <span className="text-xs font-medium uppercase text-gray-400">
                  {categoria === 'publico_alvo' ? 'Classificação etária (obrigatório)' : categoria}
                </span>
                {categoria === 'publico_alvo' && erroClassificacao && (
                  <p className="text-xs text-red-500">Selecione uma classificação etária</p>
                )}
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
          <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
              <Users size={14} /> Colaboradores
            </h2>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              Opcional. Convide pelo nome de usuário; a pessoa só acessa o projeto depois de aceitar nas notificações.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
              <input
                value={nomeColab}
                onChange={e => setNomeColab(e.target.value)}
                placeholder="@nome-de-usuario"
                className="min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
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
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
              >
                <Plus size={16} /> Adicionar
              </button>
            </div>
            {colaboradores.length > 0 && (
              <ul className="mt-3 space-y-2">
                {colaboradores.map((c, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-gray-200">
                    <span className="min-w-0 truncate">
                      @{c.nomeUsuario} <span className="text-gray-400">({c.papel === 'coautor' ? 'coautor' : 'revisor'})</span>
                    </span>
                    <button type="button" onClick={() => setColaboradores(prev => prev.filter((_, idx) => idx !== i))} aria-label="Remover colaborador da lista">
                      <X size={14} className="text-gray-400 hover:text-red-500" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {erro && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span>{erro}</span>
            </div>
          )}

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
