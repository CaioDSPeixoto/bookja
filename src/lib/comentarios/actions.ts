'use server'

import { erroOperacao, erroPublico } from '@/lib/actions/erros'
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
    .select('dono_id')
    .eq('id', projetoIdValidado)
    .single()

  if (projetoDono && projetoDono.dono_id !== user.id) {
    await criarNotificacao({
      usuario_id: projetoDono.dono_id,
      tipo: 'comentario',
      projeto_id: projetoIdValidado,
      mensagem: 'Novo comentário no seu projeto',
    })
  }

  if (notaValidada) {
    const { data: stats } = await supabase
      .from('comentario')
      .select('nota')
      .eq('projeto_id', projetoIdValidado)
      .not('nota', 'is', null)

    if (stats) {
      const total = stats.length
      const media = stats.reduce((s, c) => s + (c.nota as number), 0) / total
      await supabase
        .from('projeto')
        .update({ media_avaliacao: Math.round(media * 10) / 10, contagem_avaliacoes: total })
        .eq('id', projetoIdValidado)
    }
  }
}

export async function excluirComentario(id: string) {
  const comentarioId = validarIdComentario(id)
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw erroPublico('Autenticação necessária')

  const { data: comentario } = await supabase
    .from('comentario')
    .select('autor_id')
    .eq('id', comentarioId)
    .single()

  if (!comentario || comentario.autor_id !== user.id) throw erroPublico('Sem permissão')

  const { error } = await supabase.from('comentario').delete().eq('id', comentarioId)
  if (error) throw erroComentario('Não foi possível excluir o comentário')
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
  return data || []
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

  const reacoes: Record<string, { contagem: number; reagiu: boolean }> = {}
  for (const r of data || []) {
    if (!reacoes[r.emoji]) reacoes[r.emoji] = { contagem: 0, reagiu: false }
    reacoes[r.emoji].contagem++
    if (user && r.usuario_id === user.id) reacoes[r.emoji].reagiu = true
  }
  return reacoes
}
