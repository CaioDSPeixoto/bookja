'use server'

import { erroOperacao, erroPublico } from '@/lib/actions/erros'
import { criarClienteServidor } from '@/lib/supabase/server'
import { validarUuid } from '@/lib/validacao/comum'

async function obterUsuarioOuErro() {
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw erroPublico('Autenticação necessária')
  return { supabase, user }
}

function validarIdPerfil(perfilId: unknown): string {
  if (!validarUuid(perfilId)) {
    throw erroPublico('Perfil inválido')
  }

  return perfilId
}

function validarIdComentario(comentarioId: unknown): string {
  if (!validarUuid(comentarioId)) {
    throw erroPublico('Comentário inválido')
  }

  return comentarioId
}

function validarIdComentarioOpcional(comentarioId: unknown): string | null {
  if (comentarioId === undefined || comentarioId === null || comentarioId === '') {
    return null
  }

  return validarIdComentario(comentarioId)
}

function normalizarConteudo(conteudo: unknown): string {
  const texto = typeof conteudo === 'string' ? conteudo.trim() : ''
  if (!texto) {
    throw erroPublico('Conteúdo obrigatório')
  }

  return texto
}

function normalizarEmoji(emoji: unknown): string {
  const valor = typeof emoji === 'string' ? emoji.trim() : ''
  if (!valor || valor.length > 16) {
    throw erroPublico('Emoji inválido')
  }

  return valor
}

export async function listarMural(perfilId: string) {
  const supabase = await criarClienteServidor()
  const perfilIdValidado = validarIdPerfil(perfilId)

  const { data, error } = await supabase
    .from('mural_comentario')
    .select('id, conteudo, criado_em, pai_id, autor:perfil!mural_comentario_autor_id_fkey(id, nome_usuario, nome_exibicao, avatar_url)')
    .eq('perfil_id', perfilIdValidado)
    .is('pai_id', null)
    .order('criado_em', { ascending: false })
    .limit(50)

  if (error) throw erroOperacao('Não foi possível listar o mural')

  const ids = (data || []).map((comentario) => comentario.id)
  let respostas: typeof data = []
  if (ids.length > 0) {
    const { data: resp, error: erroRespostas } = await supabase
      .from('mural_comentario')
      .select('id, conteudo, criado_em, pai_id, autor:perfil!mural_comentario_autor_id_fkey(id, nome_usuario, nome_exibicao, avatar_url)')
      .in('pai_id', ids)
      .order('criado_em', { ascending: true })

    if (erroRespostas) throw erroOperacao('Não foi possível listar respostas do mural')
    respostas = resp || []
  }

  const todosIds = [...ids, ...(respostas || []).map((resposta) => resposta.id)]
  let reacoes: { comentario_id: string; emoji: string; usuario_id: string }[] = []
  if (todosIds.length > 0) {
    const { data: react, error: erroReacoes } = await supabase
      .from('mural_reacao')
      .select('comentario_id, emoji, usuario_id')
      .in('comentario_id', todosIds)

    if (erroReacoes) throw erroOperacao('Não foi possível listar reações do mural')
    reacoes = react || []
  }

  return { comentarios: data || [], respostas: respostas || [], reacoes }
}

export async function criarComentarioMural(perfilId: string, conteudo: string, paiId?: string) {
  const { supabase, user } = await obterUsuarioOuErro()
  const perfilIdValidado = validarIdPerfil(perfilId)
  const conteudoValidado = normalizarConteudo(conteudo)
  const paiIdValidado = validarIdComentarioOpcional(paiId)

  const { error } = await supabase
    .from('mural_comentario')
    .insert({
      perfil_id: perfilIdValidado,
      autor_id: user.id,
      conteudo: conteudoValidado,
      pai_id: paiIdValidado,
    })

  if (error) throw erroOperacao('Não foi possível criar o comentário no mural')
}

export async function excluirComentarioMural(comentarioId: string) {
  const { supabase } = await obterUsuarioOuErro()
  const comentarioIdValidado = validarIdComentario(comentarioId)

  const { error } = await supabase
    .from('mural_comentario')
    .delete()
    .eq('id', comentarioIdValidado)

  if (error) throw erroOperacao('Não foi possível excluir o comentário do mural')
}

export async function reagirMural(comentarioId: string, emoji: string) {
  const { supabase, user } = await obterUsuarioOuErro()
  const comentarioIdValidado = validarIdComentario(comentarioId)
  const emojiValidado = normalizarEmoji(emoji)

  const { data: existente } = await supabase
    .from('mural_reacao')
    .select('emoji')
    .eq('comentario_id', comentarioIdValidado)
    .eq('usuario_id', user.id)
    .eq('emoji', emojiValidado)
    .single()

  if (existente) {
    const { error } = await supabase
      .from('mural_reacao')
      .delete()
      .eq('comentario_id', comentarioIdValidado)
      .eq('usuario_id', user.id)
      .eq('emoji', emojiValidado)

    if (error) throw erroOperacao('Não foi possível remover a reação do mural')
  } else {
    const { error } = await supabase
      .from('mural_reacao')
      .insert({ comentario_id: comentarioIdValidado, usuario_id: user.id, emoji: emojiValidado })

    if (error) throw erroOperacao('Não foi possível adicionar a reação do mural')
  }
}
