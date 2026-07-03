'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { MessageCircle, Trash2 } from 'lucide-react'
import { criarComentario, excluirComentario, listarComentarios, responderComentario } from '@/lib/comentarios/actions'
import { Estrelas } from './Estrelas'
import { Reacoes } from './Reacoes'

interface Comentario {
  id: string
  conteudo: string
  nota: number | null
  criado_em: string
  autor_id: string
  pai_id: string | null
  perfil: { nome_usuario: string; nome_exibicao: string; avatar_url?: string }
}

interface ListaComentariosProps {
  projetoId: string
  documentoId?: string | null
  usuarioId?: string | null
}

export function ListaComentarios({ projetoId, documentoId, usuarioId }: ListaComentariosProps) {
  const t = useTranslations('comentarios')
  const locale = useLocale()
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [conteudo, setConteudo] = useState('')
  const [respondendoId, setRespondendoId] = useState<string | null>(null)
  const [respostaTexto, setRespostaTexto] = useState('')
  const [enviando, setEnviando] = useState(false)

  const carregar = useCallback(async () => {
    const dados = await listarComentarios(projetoId, documentoId)
    setComentarios(dados as Comentario[])
  }, [projetoId, documentoId])

  useEffect(() => { carregar() }, [carregar])

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault()
    if (!conteudo.trim()) return
    setEnviando(true)
    await criarComentario(projetoId, documentoId || null, conteudo)
    setConteudo('')
    await carregar()
    setEnviando(false)
  }

  async function handleResponder(comentarioId: string) {
    if (!respostaTexto.trim()) return
    setEnviando(true)
    await responderComentario(comentarioId, respostaTexto)
    setRespondendoId(null)
    setRespostaTexto('')
    await carregar()
    setEnviando(false)
  }

  async function handleExcluir(id: string) {
    await excluirComentario(id)
    await carregar()
  }

  function dataRelativa(data: string) {
    const diff = Date.now() - new Date(data).getTime()
    const min = Math.floor(diff / 60000)
    if (min < 60) return `${t('ha')} ${min}m`
    const h = Math.floor(min / 60)
    if (h < 24) return `${t('ha')} ${h}h`
    const d = Math.floor(h / 24)
    return `${t('ha')} ${d}d`
  }

  const raiz = comentarios.filter((c) => !c.pai_id)
  const replies = (paiId: string) => comentarios.filter((c) => c.pai_id === paiId)

  function renderComentario(c: Comentario, isReply = false) {
    return (
      <div key={c.id} className={`flex gap-3 ${isReply ? 'ml-10 mt-3' : 'mt-4'}`}>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white">
          {(c.perfil.nome_exibicao || c.perfil.nome_usuario).charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/${locale}/perfil/${c.perfil.nome_usuario}`} className="text-sm font-medium hover:text-indigo-600 hover:underline">{c.perfil.nome_exibicao || c.perfil.nome_usuario}</Link>
            <span className="text-xs text-gray-400">{dataRelativa(c.criado_em)}</span>
            {c.nota && <Estrelas valor={c.nota} tamanho={12} />}
          </div>
          <p className="mt-1 text-sm text-gray-700 whitespace-pre-line break-words">{c.conteudo}</p>
          <div className="mt-2 flex items-center gap-3">
            <Reacoes comentarioId={c.id} />
            {!isReply && usuarioId && (
              <button
                onClick={() => setRespondendoId(respondendoId === c.id ? null : c.id)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600"
              >
                <MessageCircle size={12} /> {t('responder')}
              </button>
            )}
            {usuarioId === c.autor_id && (
              <button onClick={() => handleExcluir(c.id)} className="text-xs text-red-400 hover:text-red-600" aria-label="Excluir comentário">
                <Trash2 size={12} aria-hidden="true" />
              </button>
            )}
          </div>
          {respondendoId === c.id && (
            <div className="mt-2 flex gap-2">
              <input
                value={respostaTexto}
                onChange={(e) => setRespostaTexto(e.target.value)}
                placeholder={t('escrever')}
                className="flex-1 rounded-lg border border-gray-300 bg-gray-50/60 px-3 py-1.5 text-sm transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              <button
                onClick={() => handleResponder(c.id)}
                disabled={enviando}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {t('enviar')}
              </button>
            </div>
          )}
          {replies(c.id).map((r) => renderComentario(r, true))}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-10">
      <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
        <MessageCircle size={20} className="text-indigo-500" /> {t('titulo')}
      </h2>

      {usuarioId ? (
        <form onSubmit={handleEnviar} className="mt-4 space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <textarea
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            placeholder={t('escrever')}
            rows={3}
            className="w-full resize-none rounded-lg border border-gray-300 bg-gray-50/60 px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={enviando || !conteudo.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow disabled:opacity-50"
            >
              {t('enviar')}
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500">{t('loginParaComentar')}</p>
      )}

      {raiz.length === 0 ? (
        <p className="mt-6 text-center text-sm text-gray-400">{t('semComentarios')}</p>
      ) : (
        <div className="mt-4 divide-y divide-gray-100">{raiz.map((c) => renderComentario(c))}</div>
      )}
    </div>
  )
}
