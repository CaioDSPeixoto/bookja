'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { Plus, FileText, BookOpen, Eye, Star, MessageSquare } from 'lucide-react'
import { listarProjetos } from '@/lib/projetos/actions'

type Projeto = {
  id: string
  titulo: string
  sinopse: string | null
  status: string
  criado_em: string
  tipo_acesso?: 'dono' | 'colaborador'
  papel_colaborador?: string | null
  contagem_visualizacoes?: number
  media_avaliacao?: number
  contagem_avaliacoes?: number
  documento?: { count: number }[]
  comentario?: { count: number }[]
}

const bordaStatus: Record<string, string> = {
  rascunho: 'border-l-gray-300',
  revisao: 'border-l-yellow-400',
  publicado: 'border-l-green-500',
}

const badgeStatus: Record<string, string> = {
  rascunho: 'bg-gray-100 text-gray-600',
  revisao: 'bg-yellow-50 text-yellow-700',
  publicado: 'bg-green-50 text-green-700',
}

const STATUS_FILTERS = ['todos', 'rascunho', 'revisao', 'publicado'] as const

export default function PainelPage() {
  const { locale } = useParams<{ locale: string }>()
  const t = useTranslations('projeto')
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [filtro, setFiltro] = useState<string>('todos')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listarProjetos().then((data) => { setProjetos(data); setLoading(false) })
  }, [])

  const filtrados = filtro === 'todos' ? projetos : projetos.filter(p => p.status === filtro)
  const contagem = (s: string) => s === 'todos' ? projetos.length : projetos.filter(p => p.status === s).length

  if (loading) return <div className="flex justify-center py-20"><div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" /></div>

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('meusProjetos')}</h1>
        <Link
          href={`/${locale}/projeto/novo`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-indigo-700"
        >
          <Plus size={14} />
          {t('criarProjeto')}
        </Link>
      </div>

      {/* Filtros */}
      <div className="mb-5 flex gap-2 overflow-x-auto">
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setFiltro(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
              filtro === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t(s)} ({contagem(s)})
          </button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-gray-200 px-6 py-12">
          <BookOpen size={28} className="mb-3 text-indigo-300" />
          <p className="text-sm font-medium text-gray-600">{t('semProjetos')}</p>
          <p className="mt-1 text-xs text-gray-400">Crie seu primeiro projeto e comece a escrever.</p>
          <Link
            href={`/${locale}/projeto/novo`}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-indigo-700"
          >
            <Plus size={14} />
            {t('criarProjeto')}
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((projeto) => (
            <Link
              key={projeto.id}
              href={`/${locale}/projeto/${projeto.id}/${projeto.tipo_acesso === 'colaborador' ? 'escrita' : 'editar'}`}
              className={`group block rounded-lg border border-gray-200 border-l-4 ${bordaStatus[projeto.status] || bordaStatus.rascunho} bg-white p-4 transition hover:shadow-md`}
            >
              <div className="flex items-start gap-2">
                <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900 group-hover:text-indigo-600">{projeto.titulo}</h2>
                {projeto.tipo_acesso === 'colaborador' && (
                  <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                    Colaborando
                  </span>
                )}
              </div>
              {projeto.sinopse && (
                <p className="mt-1 line-clamp-2 text-xs text-gray-500">{projeto.sinopse}</p>
              )}
              <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-400">
                <span>{new Date(projeto.criado_em).toLocaleDateString('pt-BR')}</span>
                <span className="flex items-center gap-0.5" title="Capítulos">
                  <FileText size={10} />
                  {projeto.documento?.[0]?.count ?? 0}
                </span>
                <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeStatus[projeto.status] || badgeStatus.rascunho}`}>
                  {projeto.tipo_acesso === 'colaborador'
                    ? projeto.papel_colaborador === 'revisor' ? 'Revisor' : 'Coautor'
                    : t(projeto.status)}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3 border-t border-gray-100 pt-2 text-[11px] text-gray-500">
                <span className="flex items-center gap-1" title="Visualizações">
                  <Eye size={11} className="text-gray-400" />
                  {projeto.contagem_visualizacoes ?? 0}
                </span>
                <span className="flex items-center gap-1" title="Nota média">
                  <Star size={11} className={projeto.contagem_avaliacoes ? 'text-yellow-500' : 'text-gray-300'} fill={projeto.contagem_avaliacoes ? 'currentColor' : 'none'} />
                  {projeto.contagem_avaliacoes
                    ? `${(projeto.media_avaliacao ?? 0).toFixed(1)} (${projeto.contagem_avaliacoes})`
                    : '—'}
                </span>
                <span className="flex items-center gap-1" title="Comentários">
                  <MessageSquare size={11} className="text-gray-400" />
                  {projeto.comentario?.[0]?.count ?? 0}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
