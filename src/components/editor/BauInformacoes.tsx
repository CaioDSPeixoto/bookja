'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, X, Check, Filter, Trash2, FileText } from 'lucide-react'
import { criarDocumento, excluirDocumento } from '@/lib/documentos/actions'
import { parseFicha, resumoFicha } from '@/lib/fichas/modelo'

type Documento = {
  id: string
  titulo: string
  tipo: string
  conteudo: unknown
}

type TipoDoc = 'ficha_personagem' | 'biblia' | 'nota' | 'outro'

interface Props {
  documentos: Documento[]
  projetoId: string
  ativoId?: string | null
  onSelecionar: (id: string) => void
  onAtualizado: () => void
}

const GRUPOS: { tipo: TipoDoc; chaveI18n: string; placeholder: string }[] = [
  { tipo: 'ficha_personagem', chaveI18n: 'personagens', placeholder: 'Nome do personagem...' },
  { tipo: 'biblia', chaveI18n: 'biblia', placeholder: 'Nome do local, facção, conceito...' },
  { tipo: 'nota', chaveI18n: 'notas', placeholder: 'Título da nota...' },
  { tipo: 'outro', chaveI18n: 'outros', placeholder: 'Título...' },
]

export default function BauInformacoes({ documentos, projetoId, ativoId, onSelecionar, onAtualizado }: Props) {
  const t = useTranslations('editor')
  const [criando, setCriando] = useState<TipoDoc | null>(null)
  const [novoTitulo, setNovoTitulo] = useState('')
  const [menuAberto, setMenuAberto] = useState(false)
  const [filtroAtivo, setFiltroAtivo] = useState<TipoDoc | 'todos'>('todos')

  const docsFiltrados = filtroAtivo === 'todos'
    ? documentos
    : documentos.filter(d => d.tipo === filtroAtivo)

  function getGrupo(tipo: TipoDoc) {
    return GRUPOS.find(g => g.tipo === tipo)
  }

  async function handleCriar() {
    if (!criando || !novoTitulo.trim()) return
    const novo = await criarDocumento(projetoId, novoTitulo, criando)
    setNovoTitulo('')
    setCriando(null)
    onAtualizado()
    if (novo?.id) onSelecionar(novo.id)
  }

  async function handleExcluir(id: string) {
    await excluirDocumento(id)
    onAtualizado()
  }

  const placeholder = criando ? (getGrupo(criando)?.placeholder || 'Título...') : 'Título...'

  return (
    <aside className="flex w-64 flex-col border-l border-gray-100 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {t('bauInformacoes')}
        </h2>
        <div className="relative">
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
            title={t('novoItem')}
            aria-label={t('novoItem')}
            aria-expanded={menuAberto}
          >
            <Plus size={16} aria-hidden="true" />
          </button>
          {menuAberto && (
            <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
              {GRUPOS.map(g => (
                <button
                  key={g.tipo}
                  onClick={() => { setCriando(g.tipo); setMenuAberto(false) }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  {t(g.chaveI18n)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filtro por tipo */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-100 px-3 py-2">
        <Filter size={12} className="shrink-0 text-gray-400" />
        <button
          onClick={() => setFiltroAtivo('todos')}
          className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs transition-colors ${
            filtroAtivo === 'todos' ? 'bg-indigo-100 font-medium text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          Todos
        </button>
        {GRUPOS.map(g => {
          const count = documentos.filter(d => d.tipo === g.tipo).length
          if (count === 0) return null
          return (
            <button
              key={g.tipo}
              onClick={() => setFiltroAtivo(g.tipo)}
              className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs transition-colors ${
                filtroAtivo === g.tipo ? 'bg-indigo-100 font-medium text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {t(g.chaveI18n)} ({count})
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {/* Criador inline */}
        {criando && (
          <div className="mb-3 rounded-xl border border-indigo-200 bg-indigo-50/50 p-3">
            <div className="mb-2 text-xs font-medium text-indigo-600">
              {t(getGrupo(criando)?.chaveI18n || 'outros')}
            </div>
            <input
              autoFocus
              value={novoTitulo}
              onChange={e => setNovoTitulo(e.target.value)}
              placeholder={placeholder}
              className="mb-2 w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400"
              onKeyDown={e => e.key === 'Enter' && handleCriar()}
            />
            <div className="flex gap-1.5">
              <button
                onClick={handleCriar}
                disabled={!novoTitulo.trim()}
                className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <Check size={12} /> Criar
              </button>
              <button
                onClick={() => { setCriando(null); setNovoTitulo('') }}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-50"
              >
                <X size={12} /> Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Grupos */}
        {GRUPOS.map(grupo => {
          const docs = docsFiltrados.filter(d => d.tipo === grupo.tipo)
          if (docs.length === 0) return null
          return (
            <div key={grupo.tipo} className="mb-3">
              <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {t(grupo.chaveI18n)}
              </h3>
              {docs.map(doc => {
                const ativo = ativoId === doc.id
                const resumo = resumoFicha(parseFicha(doc.conteudo))
                return (
                  <div
                    key={doc.id}
                    className={`group mb-1 cursor-pointer rounded-lg px-2 py-1.5 transition-all ${
                      ativo ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => onSelecionar(doc.id)}
                  >
                    <div className="flex items-center gap-1.5">
                      <FileText size={13} className={ativo ? 'text-indigo-500' : 'text-gray-300'} />
                      <span className={`flex-1 truncate text-sm ${ativo ? 'font-medium text-indigo-700' : 'text-gray-700'}`}>
                        {doc.titulo || 'Sem título'}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleExcluir(doc.id) }}
                        title="Excluir"
                        aria-label="Excluir item"
                        className="rounded p-0.5 text-gray-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                      >
                        <Trash2 size={12} aria-hidden="true" />
                      </button>
                    </div>
                    <p className="ml-5 truncate text-[11px] text-gray-400">{resumo}</p>
                  </div>
                )
              })}
            </div>
          )
        })}

        {docsFiltrados.length === 0 && !criando && (
          <div className="py-8 text-center text-xs text-gray-400">
            Nenhum item ainda. Clique no + para adicionar.
          </div>
        )}
      </div>
    </aside>
  )
}
