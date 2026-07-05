'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { MessageSquare, Send, Trash2, Reply, SmilePlus, Pencil } from 'lucide-react'
import { listarMural, criarComentarioMural, editarComentarioMural, excluirComentarioMural, reagirMural } from '@/lib/mural/actions'

type Autor = { id: string; nome_usuario: string; nome_exibicao: string | null; avatar_url: string | null }
type Comentario = { id: string; conteudo: string; criado_em: string; atualizado_em: string | null; pai_id: string | null; autor: Autor | Autor[] | null }
type Reacao = { comentario_id: string; emoji: string; usuario_id: string }

const EMOJIS = ['❤️', '🔥', '😂', '👏', '😢']

function tempoRelativo(data: string): string {
  const diff = Date.now() - new Date(data).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  return `${d}d`
}

export default function MuralPerfil({
  perfilId,
  usuarioLogadoId,
}: {
  perfilId: string
  usuarioLogadoId: string | null
}) {
  const t = useTranslations('mural')
  const locale = useLocale()
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [respostas, setRespostas] = useState<Comentario[]>([])
  const [reacoes, setReacoes] = useState<Reacao[]>([])
  const [novoTexto, setNovoTexto] = useState('')
  const [respondendoId, setRespondendoId] = useState<string | null>(null)
  const [textoResposta, setTextoResposta] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [edicaoTexto, setEdicaoTexto] = useState('')
  const [emojiAberto, setEmojiAberto] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const carregar = useCallback(async () => {
    const dados = await listarMural(perfilId)
    setComentarios(dados.comentarios as Comentario[])
    setRespostas(dados.respostas as Comentario[])
    setReacoes(dados.reacoes)
  }, [perfilId])

  useEffect(() => { carregar() }, [carregar])

  function handleEnviar(e: React.FormEvent) {
    e.preventDefault()
    if (!novoTexto.trim() || !usuarioLogadoId) return
    startTransition(async () => {
      await criarComentarioMural(perfilId, novoTexto.trim())
      setNovoTexto('')
      await carregar()
    })
  }

  function handleResponder(paiId: string) {
    if (!textoResposta.trim() || !usuarioLogadoId) return
    startTransition(async () => {
      await criarComentarioMural(perfilId, textoResposta.trim(), paiId)
      setTextoResposta('')
      setRespondendoId(null)
      await carregar()
    })
  }

  function handleExcluir(id: string) {
    startTransition(async () => {
      await excluirComentarioMural(id)
      await carregar()
    })
  }

  function iniciarEdicao(c: Comentario) {
    setEditandoId(c.id)
    setEdicaoTexto(c.conteudo)
  }

  function handleEditar(id: string) {
    if (!edicaoTexto.trim()) return
    startTransition(async () => {
      await editarComentarioMural(id, edicaoTexto.trim())
      setEditandoId(null)
      setEdicaoTexto('')
      await carregar()
    })
  }

  function handleReagir(comentarioId: string, emoji: string) {
    startTransition(async () => {
      await reagirMural(comentarioId, emoji)
      setEmojiAberto(null)
      await carregar()
    })
  }

  function getAutor(c: Comentario): Autor {
    return Array.isArray(c.autor) ? c.autor[0] : (c.autor as Autor)
  }

  function getReacoesAgrupadas(comentarioId: string) {
    const filtered = reacoes.filter(r => r.comentario_id === comentarioId)
    const agrupado: Record<string, { count: number; meu: boolean }> = {}
    for (const r of filtered) {
      if (!agrupado[r.emoji]) agrupado[r.emoji] = { count: 0, meu: false }
      agrupado[r.emoji].count++
      if (r.usuario_id === usuarioLogadoId) agrupado[r.emoji].meu = true
    }
    return agrupado
  }

  function podeDeletar(c: Comentario): boolean {
    if (!usuarioLogadoId) return false
    const autor = getAutor(c)
    return autor?.id === usuarioLogadoId || perfilId === usuarioLogadoId
  }

  function podeEditar(c: Comentario): boolean {
    if (!usuarioLogadoId) return false
    return getAutor(c)?.id === usuarioLogadoId
  }

  return (
    <section className="mt-8">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
        <MessageSquare size={20} />
        {t('titulo')}
      </h2>

      {/* Formulário novo comentário */}
      {usuarioLogadoId ? (
        <form onSubmit={handleEnviar} className="mb-6 flex gap-2">
          <input
            value={novoTexto}
            onChange={(e) => setNovoTexto(e.target.value)}
            placeholder={t('placeholder')}
            className="flex-1 rounded-lg border border-gray-300 bg-gray-50/60 px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          <button
            type="submit"
            disabled={!novoTexto.trim() || isPending}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow disabled:opacity-50"
          >
            <Send size={14} />
            {t('enviar')}
          </button>
        </form>
      ) : (
        <p className="mb-6 text-sm text-gray-500">{t('loginParaComentar')}</p>
      )}

      {/* Lista de comentários */}
      {comentarios.length === 0 ? (
        <p className="text-gray-400 text-sm">{t('vazio')}</p>
      ) : (
        <ul className="space-y-4">
          {comentarios.map((c) => {
            const autor = getAutor(c)
            const reacoesAgrupadas = getReacoesAgrupadas(c.id)
            const respostasDoComentario = respostas.filter(r => r.pai_id === c.id)
            return (
              <li key={c.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white">
                      {(autor?.nome_exibicao || autor?.nome_usuario || '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <Link href={`/${locale}/perfil/${autor?.nome_usuario}`} className="text-sm font-medium hover:text-indigo-600 hover:underline">{autor?.nome_exibicao || autor?.nome_usuario}</Link>
                      <span className="ml-2 text-xs text-gray-400">{tempoRelativo(c.criado_em)}</span>
                      {c.atualizado_em && <span className="ml-1 text-xs text-gray-400">· {t('editado')}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {podeEditar(c) && (
                      <button onClick={() => iniciarEdicao(c)} className="rounded p-1 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600" aria-label={t('editar')}>
                        <Pencil size={14} aria-hidden="true" />
                      </button>
                    )}
                    {podeDeletar(c) && (
                      <button onClick={() => handleExcluir(c.id)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label={t('excluir')}>
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>

                {editandoId === c.id ? (
                  <div className="mt-2">
                    <textarea
                      value={edicaoTexto}
                      onChange={(e) => setEdicaoTexto(e.target.value)}
                      rows={2}
                      className="w-full resize-none rounded-lg border border-gray-300 bg-gray-50/60 px-3 py-1.5 text-sm transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                    <div className="mt-1 flex gap-2">
                      <button
                        onClick={() => handleEditar(c.id)}
                        disabled={isPending || !edicaoTexto.trim()}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {t('salvar')}
                      </button>
                      <button
                        onClick={() => { setEditandoId(null); setEdicaoTexto('') }}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
                      >
                        {t('cancelar')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-700">{c.conteudo}</p>
                )}

                {/* Reações */}
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  {Object.entries(reacoesAgrupadas).map(([emoji, { count, meu }]) => (
                    <button
                      key={emoji}
                      onClick={() => usuarioLogadoId && handleReagir(c.id, emoji)}
                      className={`rounded-full border px-2 py-0.5 text-xs transition-colors ${
                        meu ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {emoji} {count}
                    </button>
                  ))}
                  {usuarioLogadoId && (
                    <div className="relative">
                      <button
                        onClick={() => setEmojiAberto(emojiAberto === c.id ? null : c.id)}
                        className="rounded-full border border-gray-200 p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                        aria-label="Adicionar reação"
                        aria-expanded={emojiAberto === c.id}
                      >
                        <SmilePlus size={12} aria-hidden="true" />
                      </button>
                      {emojiAberto === c.id && (
                        <div className="absolute left-0 top-8 z-10 flex gap-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                          {EMOJIS.map(em => (
                            <button key={em} onClick={() => handleReagir(c.id, em)} className="text-lg hover:scale-125 transition-transform" aria-label={`Reagir com ${em}`}>
                              {em}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Botão responder */}
                {usuarioLogadoId && (
                  <button
                    onClick={() => setRespondendoId(respondendoId === c.id ? null : c.id)}
                    className="mt-2 flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600"
                  >
                    <Reply size={12} />
                    {t('responder')}
                  </button>
                )}

                {/* Respostas */}
                {respostasDoComentario.length > 0 && (
                  <ul className="mt-3 space-y-2 border-l-2 border-gray-100 pl-4">
                    {respostasDoComentario.map(r => {
                      const autorR = getAutor(r)
                      return (
                        <li key={r.id} className="flex items-start justify-between">
                          <div>
                            <Link href={`/${locale}/perfil/${autorR?.nome_usuario}`} className="text-xs font-medium hover:text-indigo-600 hover:underline">{autorR?.nome_exibicao || autorR?.nome_usuario}</Link>
                            <span className="ml-1 text-xs text-gray-400">{tempoRelativo(r.criado_em)}</span>
                            <p className="text-sm text-gray-600">{r.conteudo}</p>
                          </div>
                          {podeDeletar(r) && (
                            <button onClick={() => handleExcluir(r.id)} className="rounded p-1 text-gray-400 hover:text-red-600" aria-label="Excluir resposta">
                              <Trash2 size={12} aria-hidden="true" />
                            </button>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}

                {/* Form de resposta */}
                {respondendoId === c.id && (
                  <div className="mt-3 flex gap-2 pl-4">
                    <input
                      value={textoResposta}
                      onChange={(e) => setTextoResposta(e.target.value)}
                      placeholder={t('placeholderResposta')}
                      className="flex-1 rounded-lg border border-gray-300 bg-gray-50/60 px-3 py-1.5 text-sm transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleResponder(c.id) }}
                    />
                    <button
                      onClick={() => handleResponder(c.id)}
                      disabled={!textoResposta.trim()}
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                      aria-label="Enviar resposta"
                    >
                      <Send size={12} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
