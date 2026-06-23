'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
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
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [conteudo, setConteudo] = useState('')
  const [nota, setNota] = useState(0)
  const [respondendoId, setRespondendoId] = useState<string | null>(null)
  const [respostaTexto, setRespostaTexto] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function carregar() {
    const dados = await listarComentarios(projetoId, documentoId)
    setComentarios(dados as Comentario[])
  }

  useEffect(() => { carregar() }, [projetoId, documentoId])

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault()
    if (!conteudo.trim()) return
    setEnviando(true)
    await criarComentario(projetoId, documentoId || null, conteudo, nota || undefined)
    setConteudo('')
    setNota(0)
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
        <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
          {(c.perfil.nome_exibicao || c.perfil.nome_usuario).charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{c.perfil.nome_exibicao || c.perfil.nome_usuario}</span>
            <span className="text-xs text-gray-400">{dataRelativa(c.criado_em)}</span>
            {c.nota && <Estrelas valor={c.nota} tamanho={12} />}
          </div>
          <p className="mt-1 text-sm text-gray-700 whitespace-pre-line break-words">{c.conteudo}</p>
          <div className="mt-2 flex items-center gap-3">
            <Reacoes comentarioId={c.id} />
            {!isReply && usuarioId && (
              <button
                onClick={() => setRespondendoId(respondendoId === c.id ? null : c.id)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600"
              >
                <MessageCircle size={12} /> {t('responder')}
              </button>
            )}
            {usuarioId === c.autor_id && (
              <button onClick={() => handleExcluir(c.id)} className="text-xs text-red-400 hover:text-red-600">
                <Trash2 size={12} />
              </button>
            )}
          </div>
          {respondendoId === c.id && (
            <div className="mt-2 flex gap-2">
              <input
                value={respostaTexto}
                onChange={(e) => setRespostaTexto(e.target.value)}
                placeholder={t('escrever')}
                className="flex-1 rounded border px-3 py-1.5 text-sm"
              />
              <button
                onClick={() => handleResponder(c.id)}
                disabled={enviando}
                className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
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
      <h2 className="text-xl font-bold">{t('titulo')}</h2>

      {usuarioId ? (
        <form onSubmit={handleEnviar} className="mt-4 space-y-3">
          <textarea
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            placeholder={t('escrever')}
            rows={3}
            className="w-full rounded-lg border px-4 py-2 text-sm resize-none focus:border-blue-500 focus:outline-none"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{t('avaliacao')}:</span>
              <Estrelas valor={nota} onChange={setNota} tamanho={20} />
            </div>
            <button
              type="submit"
              disabled={enviando || !conteudo.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {t('enviar')}
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-4 text-sm text-gray-500">{t('loginParaComentar')}</p>
      )}

      {raiz.length === 0 ? (
        <p className="mt-6 text-center text-gray-400">{t('semComentarios')}</p>
      ) : (
        <div className="divide-y">{raiz.map((c) => renderComentario(c))}</div>
      )}
    </div>
  )
}
