'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2, FileText, PenLine, Eye, Upload, Check, Tag, Users, Plus, Save } from 'lucide-react'
import { obterProjeto, atualizarProjeto, excluirProjeto } from '@/lib/projetos/actions'
import { criarClienteBrowser } from '@/lib/supabase/client'

const statusOpcoes = ['rascunho', 'revisao', 'publicado'] as const
const statusCores: Record<string, string> = {
  rascunho: 'bg-gray-100 text-gray-700',
  revisao: 'bg-yellow-100 text-yellow-700',
  publicado: 'bg-green-100 text-green-700',
}

export default function EditarProjetoPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('projeto')
  const tGeral = useTranslations('geral')
  const locale = useLocale()
  const router = useRouter()
  const [projeto, setProjeto] = useState<{ titulo: string; sinopse?: string; status: string; documento?: { id: string; titulo?: string; tipo?: string }[] } | null>(null)
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

  async function handleSalvar() {
    setSalvando(true)
    await atualizarProjeto(id, { titulo, sinopse: sinopse || null, status })
    setSalvando(false)
    setSalvoFeedback(true)
    setTimeout(() => setSalvoFeedback(false), 2000)
  }

  async function handleExcluir() {
    await excluirProjeto(id, locale)
    router.push(`/${locale}/biblioteca`)
  }

  function ciclarStatus() {
    const idx = statusOpcoes.indexOf(status as typeof statusOpcoes[number])
    setStatus(statusOpcoes[(idx + 1) % statusOpcoes.length])
  }

  if (!projeto) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-4">
      {/* Toolbar fixa */}
      <div className="sticky top-0 z-10 -mx-4 mb-6 flex items-center gap-2 border-b bg-white/95 px-4 py-3 backdrop-blur">
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="mr-auto min-w-0 flex-1 truncate border-none bg-transparent text-lg font-bold text-gray-900 focus:outline-none focus:ring-0"
          required
        />
        <button onClick={ciclarStatus} type="button" className={`rounded-full px-3 py-1 text-xs font-medium ${statusCores[status]}`}>
          {t(status)}
        </button>
        <button onClick={handleSalvar} disabled={salvando} className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
          {salvoFeedback ? <><Check size={14} /> Salvo</> : <><Save size={14} /> {tGeral('salvar')}</>}
        </button>
        <Link href={`/${locale}/projeto/${id}/escrita`} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
          <PenLine size={14} /> Editor
        </Link>
        <Link href={`/${locale}/projeto/${id}/importar`} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
          <Upload size={14} />
        </Link>
        <Link href={`/${locale}/projeto/${id}/previa`} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
          <Eye size={14} />
        </Link>
        {!confirmarExcluir ? (
          <button onClick={() => setConfirmarExcluir(true)} type="button" className="rounded-md p-1.5 text-red-500 hover:bg-red-50">
            <Trash2 size={14} />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button onClick={handleExcluir} type="button" className="rounded-md bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700">Excluir</button>
            <button onClick={() => setConfirmarExcluir(false)} type="button" className="rounded-md border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">Não</button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Sinopse */}
        <section className="rounded-lg border p-4">
          <label className="mb-1 block text-xs font-medium text-gray-500">{t('sinopse')}</label>
          <textarea
            value={sinopse}
            onChange={(e) => setSinopse(e.target.value)}
            rows={3}
            className="w-full resize-none border-none bg-transparent text-sm text-gray-800 focus:outline-none focus:ring-0"
            placeholder="Sinopse do projeto..."
          />
        </section>

        {/* Tags */}
        <section className="rounded-lg border p-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <Tag size={12} /> {t('tags')}
          </h3>
          {todasTags.length > 0 ? (
            <div className="space-y-2">
              {Array.from(new Set(todasTags.map(t => t.categoria))).map(cat => (
                <div key={cat}>
                  <span className="text-[10px] font-medium uppercase text-gray-400">{cat.replace('_', ' ')}</span>
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {todasTags.filter(t => t.categoria === cat).map(tag => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${
                          tagsSelecionadas.includes(tag.id)
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
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
            <p className="text-xs text-gray-400">Carregando...</p>
          )}
        </section>

        {/* Documentos */}
        <section className="rounded-lg border p-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <FileText size={12} /> {t('documentos')}
          </h3>
          {projeto.documento && projeto.documento.length > 0 ? (
            <ul className="divide-y">
              {projeto.documento.map((doc) => (
                <li key={doc.id}>
                  <Link
                    href={`/${locale}/projeto/${id}/escrita?doc=${doc.id}`}
                    className="flex items-center gap-2 py-2 text-sm text-gray-700 hover:text-indigo-600"
                  >
                    <FileText size={14} className="text-gray-400" />
                    <span className="flex-1">{doc.titulo || 'Sem título'}</span>
                    {doc.tipo && <span className="text-[10px] text-gray-400">{doc.tipo}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-400">{tGeral('semResultados')}</p>
          )}
        </section>

        {/* Colaboradores */}
        <section className="rounded-lg border p-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <Users size={12} /> Colaboradores
          </h3>
          <Link
            href={`/${locale}/projeto/${id}/colaboradores`}
            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
          >
            <Plus size={12} /> Gerenciar
          </Link>
        </section>
      </div>
    </div>
  )
}
