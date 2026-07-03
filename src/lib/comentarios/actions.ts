'use server'

import { erroOperacao, erroPublico } from '@/lib/actions/erros'
import { listarIdsBloqueados } from '@/lib/bloqueio/actions'
import { criarNotificacao } from '@/lib/notificacoes/actions'
import { criarClienteServidor } from '@/lib/supabase/server'
import { validarUuid } from '@/lib/validacao/comum'

function validarIdProjeto(projetoId: unknown): string {
  if (!validarUuid(projetoId)) {
    throw erroPublico('Projeto inválido')
  }

  return projetoId
}

function validarIdDocumento(documentoId: unknown): string | null {
  if (documentoId === null || documentoId === undefined || documentoId === '') {
    return null
  }

  if (!validarUuid(documentoId)) {
    throw erroPublico('Documento inválido')
  }

  return documentoId
}

function validarIdComentario(comentarioId: unknown): string {
  if (!validarUuid(comentarioId)) {
    throw erroPublico('Comentário inválido')
  }

  return comentarioId
}

function normalizarConteudo(conteudo: unknown): string {
  const texto = typeof conteudo === 'string' ? conteudo.trim() : ''
  if (!texto) {
    throw erroPublico('Conteúdo obrigatório')
  }

  return texto
}

function normalizarNota(nota: unknown): number | null {
  if (nota === undefined || nota === null) return null
  if (typeof nota !== 'number' || !Number.isInteger(nota) || nota < 1 || nota > 5) {
    throw erroPublico('Nota inválida')
  }

  return nota
}

function normalizarEmoji(emoji: unknown): string {
  const valor = typeof emoji === 'string' ? emoji.trim() : ''
  if (!valor || valor.length > 16) {
    throw erroPublico('Emoji inválido')
  }

  return valor
}

function erroComentario(mensagem: string): Error {
  return erroOperacao(mensagem)
}

/** Recalcula média e contagem de avaliações de um projeto de forma atômica (RPC). */
async function recalcularAvaliacaoProjeto(
  supabase: Awaited<ReturnType<typeof criarClienteServidor>>,
  projetoId: string,
) {
  await supabase.rpc('recalcular_avaliacao_projeto', { p_projeto_id: projetoId })
}

export async function criarComentario(
  projetoId: string,
  documentoId: string | null,
  conteudo: string,
  nota?: number,
) {
  const projetoIdValidado = validarIdProjeto(projetoId)
  const documentoIdValidado = validarIdDocumento(documentoId)
  const conteudoValidado = normalizarConteudo(conteudo)
  const notaValidada = normalizarNota(nota)
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw erroPublico('Autenticação necessária')

  const { data: projeto } = await supabase
    .from('projeto')
    .select('status')
    .eq('id', projetoIdValidado)
    .single()

  if (!projeto || projeto.status !== 'publicado') throw erroPublico('Projeto não publicado')

  // Uma avaliação por usuário: zera a nota da avaliação anterior antes de registrar a nova.
  if (notaValidada) {
    await supabase
      .from('comentario')
      .update({ nota: null })
      .eq('projeto_id', projetoIdValidado)
      .eq('autor_id', user.id)
      .not('nota', 'is', null)
  }

  const { error } = await supabase.from('comentario').insert({
    projeto_id: projetoIdValidado,
    documento_id: documentoIdValidado,
    autor_id: user.id,
    conteudo: conteudoValidado,
    nota: notaValidada,
  })

  if (error) throw erroComentario('Não foi possível criar o comentário')

  const { data: projetoDono } = await supabase
    .from('projeto')
    .select('dono_id, titulo')
    .eq('id', projetoIdValidado)
    .single()

  if (projetoDono && projetoDono.dono_id !== user.id) {
    await criarNotificacao({
      usuario_id: projetoDono.dono_id,
      tipo: 'comentario',
      projeto_id: projetoIdValidado,
      documento_id: documentoIdValidado,
      mensagem: `Novo comentário em "${projetoDono.titulo || 'sua história'}"`,
    })
  }

  if (notaValidada) {
    await recalcularAvaliacaoProjeto(supabase, projetoIdValidado)
  }
}

/**
 * Retorna a nota que o usuário logado deu ao projeto (1 a 5) ou null se não
 * avaliou. Usada para pré-selecionar as estrelas no widget de avaliação.
 */
export async function obterMinhaAvaliacao(projetoId: string): Promise<number | null> {
  const projetoIdValidado = validarIdProjeto(projetoId)
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('comentario')
    .select('nota')
    .eq('projeto_id', projetoIdValidado)
    .eq('autor_id', user.id)
    .not('nota', 'is', null)
    .maybeSingle()

  return (data?.nota as number | undefined) ?? null
}

/**
 * Registra, atualiza ou remove (nota = 0) a avaliação por estrelas do usuário,
 * de forma independente de comentário. Mantém uma única nota por usuário no
 * projeto e recalcula a média de forma atômica.
 */
export async function avaliarProjeto(projetoId: string, nota: number) {
  const projetoIdValidado = validarIdProjeto(projetoId)
  const notaValidada = nota === 0 ? null : normalizarNota(nota)
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw erroPublico('Autenticação necessária')

  const { data: projeto } = await supabase
    .from('projeto')
    .select('status, dono_id')
    .eq('id', projetoIdValidado)
    .single()

  if (!projeto || projeto.status !== 'publicado') throw erroPublico('Projeto não publicado')
  if (projeto.dono_id === user.id) throw erroPublico('Você não pode avaliar a própria história')

  // Uma nota por usuário: zera a nota de qualquer avaliação anterior (inclusive
  // a que estiver em um comentário com texto).
  await supabase
    .from('comentario')
    .update({ nota: null })
    .eq('projeto_id', projetoIdValidado)
    .eq('autor_id', user.id)
    .not('nota', 'is', null)

  // Remove linhas de avaliação sem texto anteriores, evitando acúmulo.
  await supabase
    .from('comentario')
    .delete()
    .eq('projeto_id', projetoIdValidado)
    .eq('autor_id', user.id)
    .eq('conteudo', '')

  if (notaValidada) {
    const { error } = await supabase.from('comentario').insert({
      projeto_id: projetoIdValidado,
      documento_id: null,
      autor_id: user.id,
      conteudo: '',
      nota: notaValidada,
    })

    if (error) throw erroComentario('Não foi possível registrar a avaliação')
  }

  await recalcularAvaliacaoProjeto(supabase, projetoIdValidado)
}

export async function excluirComentario(id: string) {
  const comentarioId = validarIdComentario(id)
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw erroPublico('Autenticação necessária')

  const { data: comentario } = await supabase
    .from('comentario')
    .select('autor_id, projeto_id, nota')
    .eq('id', comentarioId)
    .single()

  if (!comentario || comentario.autor_id !== user.id) throw erroPublico('Sem permissão')

  const { error } = await supabase.from('comentario').delete().eq('id', comentarioId)
  if (error) throw erroComentario('Não foi possível excluir o comentário')

  // Mantém a avaliação do projeto consistente ao remover um comentário com nota.
  if (comentario.nota != null) {
    await recalcularAvaliacaoProjeto(supabase, comentario.projeto_id as string)
  }
}

export async function listarComentarios(projetoId: string, documentoId?: string | null) {
  const projetoIdValidado = validarIdProjeto(projetoId)
  const documentoIdValidado = validarIdDocumento(documentoId)
  const supabase = await criarClienteServidor()

  let query = supabase
    .from('comentario')
    .select('*, perfil:autor_id(nome_usuario, nome_exibicao, avatar_url)')
    .eq('projeto_id', projetoIdValidado)
    .order('criado_em', { ascending: false })

  if (documentoIdValidado) {
    query = query.eq('documento_id', documentoIdValidado)
  } else {
    query = query.is('documento_id', null)
  }

  const { data, error } = await query
  if (error) throw erroComentario('Não foi possível listar comentários')

  // Remove linhas de avaliação por estrelas (sem texto), que não são comentários.
  const comentarios = (data || []).filter((c) => ((c.conteudo as string) ?? '').trim() !== '')

  // Oculta comentários de usuários que o visitante bloqueou.
  const bloqueados = new Set(await listarIdsBloqueados())
  if (bloqueados.size === 0) return comentarios
  return comentarios.filter((c) => !bloqueados.has(c.autor_id as string))
}

export async function responderComentario(comentarioId: string, conteudo: string) {
  const comentarioIdValidado = validarIdComentario(comentarioId)
  const conteudoValidado = normalizarConteudo(conteudo)
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw erroPublico('Autenticação necessária')

  const { data: pai } = await supabase
    .from('comentario')
    .select('projeto_id, documento_id')
    .eq('id', comentarioIdValidado)
    .single()

  if (!pai) throw erroPublico('Comentário não encontrado')

  const { error } = await supabase.from('comentario').insert({
    projeto_id: pai.projeto_id,
    documento_id: pai.documento_id,
    autor_id: user.id,
    pai_id: comentarioIdValidado,
    conteudo: conteudoValidado,
  })

  if (error) throw erroComentario('Não foi possível responder o comentário')
}

export async function reagir(comentarioId: string, emoji: string) {
  const comentarioIdValidado = validarIdComentario(comentarioId)
  const emojiValidado = normalizarEmoji(emoji)
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw erroPublico('Autenticação necessária')

  const { data: existente } = await supabase
    .from('comentario_reacao')
    .select('*')
    .eq('comentario_id', comentarioIdValidado)
    .eq('usuario_id', user.id)
    .eq('emoji', emojiValidado)
    .maybeSingle()

  if (existente) {
    const { error } = await supabase
      .from('comentario_reacao')
      .delete()
      .eq('comentario_id', comentarioIdValidado)
      .eq('usuario_id', user.id)
      .eq('emoji', emojiValidado)

    if (error) throw erroComentario('Não foi possível remover a reação')
  } else {
    const { error } = await supabase.from('comentario_reacao').insert({
      comentario_id: comentarioIdValidado,
      usuario_id: user.id,
      emoji: emojiValidado,
    })

    if (error) throw erroComentario('Não foi possível adicionar a reação')
  }
}

export async function listarReacoes(comentarioId: string) {
  const comentarioIdValidado = validarIdComentario(comentarioId)
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('comentario_reacao')
    .select('emoji, usuario_id')
    .eq('comentario_id', comentarioIdValidado)

  if (error) throw erroComentario('Não foi possível listar reações')

  // Ignora reações de usuários que o visitante bloqueou.
  const bloqueados = new Set(await listarIdsBloqueados())

  const reacoes: Record<string, { contagem: number; reagiu: boolean }> = {}
  for (const r of data || []) {
    if (bloqueados.has(r.usuario_id as string)) continue
    if (!reacoes[r.emoji]) reacoes[r.emoji] = { contagem: 0, reagiu: false }
    reacoes[r.emoji].contagem++
    if (user && r.usuario_id === user.id) reacoes[r.emoji].reagiu = true
  }
  return reacoes
}
