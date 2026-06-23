'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, ChevronDown, ChevronRight, X, Check, Filter } from 'lucide-react'
import { criarDocumento, atualizarDocumento, excluirDocumento } from '@/lib/documentos/actions'

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
  onAtualizado: () => void
}

const GRUPOS: { tipo: TipoDoc; chaveI18n: string; placeholder: string }[] = [
  { tipo: 'ficha_personagem', chaveI18n: 'personagens', placeholder: 'Nome do personagem...' },
  { tipo: 'biblia', chaveI18n: 'biblia', placeholder: 'Título da entrada...' },
  { tipo: 'nota', chaveI18n: 'notas', placeholder: 'Título da nota...' },
  { tipo: 'outro', chaveI18n: 'outros', placeholder: 'Título...' },
]

export default function BauInformacoes({ documentos, projetoId, onAtualizado }: Props) {
  const t = useTranslations('editor')
  const [expandido, setExpandido] = useState<string | null>(null)
  const [criando, setCriando] = useState<TipoDoc | null>(null)
  const [novoTitulo, setNovoTitulo] = useState('')
  const [novoConteudo, setNovoConteudo] = useState('')
  const [menuAberto, setMenuAberto] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  const [editConteudo, setEditConteudo] = useState('')
  const [filtroAtivo, setFiltroAtivo] = useState<TipoDoc | 'todos'>('todos')

  const docsFiltrados = filtroAtivo === 'todos'
    ? documentos
    : documentos.filter(d => d.tipo === filtroAtivo)

  function getGrupo(tipo: TipoDoc) {
    return GRUPOS.find(g => g.tipo === tipo)
  }

  async function handleCriar() {
    if (!criando || !novoTitulo.trim()) return
    await criarDocumento(projetoId, novoTitulo, criando)
    setNovoTitulo('')
    setNovoConteudo('')
    setCriando(null)
    onAtualizado()
  }

  async function handleSalvarEdicao(id: string) {
    await atualizarDocumento(id, { conteudo: editConteudo })
    setEditando(null)
    onAtualizado()
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
          >
            <Plus size={16} />
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
      <div className="flex items-center gap-1 border-b border-gray-100 px-3 py-2 overflow-x-auto">
        <Filter size={12} className="text-gray-400 shrink-0" />
        <button
          onClick={() => setFiltroAtivo('todos')}
          className={`rounded-full px-2 py-0.5 text-xs whitespace-nowrap transition-colors ${
            filtroAtivo === 'todos' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-500 hover:bg-gray-100'
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
              className={`rounded-full px-2 py-0.5 text-xs whitespace-nowrap transition-colors ${
                filtroAtivo === g.tipo ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {t(g.chaveI18n)} ({count})
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {/* Inline creator */}
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
            <textarea
              value={novoConteudo}
              onChange={e => setNovoConteudo(e.target.value)}
              placeholder="Conteúdo..."
              rows={3}
              className="mb-2 w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400"
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
                onClick={() => { setCriando(null); setNovoTitulo(''); setNovoConteudo('') }}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-50"
              >
                <X size={12} /> Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Groups */}
        {GRUPOS.map(grupo => {
          const docs = docsFiltrados.filter(d => d.tipo === grupo.tipo)
          if (docs.length === 0) return null
          return (
            <div key={grupo.tipo} className="mb-3">
              <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {t(grupo.chaveI18n)}
              </h3>
              {docs.map(doc => (
                <div key={doc.id} className="mb-1">
                  <button
                    onClick={() => setExpandido(expandido === doc.id ? null : doc.id)}
                    className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-gray-700 transition-all hover:bg-gray-50"
                  >
                    {expandido === doc.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span className="truncate">{doc.titulo || 'Sem título'}</span>
                  </button>
                  {expandido === doc.id && (
                    <div className="ml-5 mt-1 rounded-lg border border-gray-100 bg-gray-50 p-2.5">
                      {editando === doc.id ? (
                        <>
                          <textarea
                            value={editConteudo}
                            onChange={e => setEditConteudo(e.target.value)}
                            rows={4}
                            className="mb-2 w-full rounded border border-gray-200 bg-white px-2 py-1 text-xs outline-none focus:border-indigo-400"
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSalvarEdicao(doc.id)}
                              className="rounded bg-indigo-600 px-2 py-0.5 text-xs text-white hover:bg-indigo-700"
                            >
                              <Check size={10} />
                            </button>
                            <button
                              onClick={() => setEditando(null)}
                              className="rounded border px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="whitespace-pre-wrap text-xs text-gray-600">
                            {typeof doc.conteudo === 'string' ? doc.conteudo : (doc.conteudo ? JSON.stringify(doc.conteudo) : 'Sem conteúdo')}
                          </p>
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => { setEditando(doc.id); setEditConteudo(typeof doc.conteudo === 'string' ? doc.conteudo : '') }}
                              className="text-xs text-indigo-600 hover:underline"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleExcluir(doc.id)}
                              className="text-xs text-red-500 hover:underline"
                            >
                              Excluir
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
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
