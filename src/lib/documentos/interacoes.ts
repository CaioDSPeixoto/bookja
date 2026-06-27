'use server'

import { erroOperacao, erroPublico } from '@/lib/actions/erros'
import { criarClienteServidor } from '@/lib/supabase/server'
import { validarUuid } from '@/lib/validacao/comum'
import { verificarAcessoProjeto } from '@/lib/projetos/acesso'

function validarId(valor: unknown, rotulo: string): string {
  if (!validarUuid(valor)) {
    throw erroPublico(`${rotulo} inválido`)
  }
  return valor as string
}

function normalizarConteudo(conteudo: unknown): string {
  const texto = typeof conteudo === 'string' ? conteudo.trim() : ''
  if (!texto) throw erroPublico('Conteúdo obrigatório')
  if (texto.length > 2000) throw erroPublico('Nota muito longa')
  return texto
}

function normalizarEmoji(emoji: unknown): string {
  const valor = typeof emoji === 'string' ? emoji.trim() : ''
  if (!valor || valor.length > 16) throw erroPublico('Emoji inválido')
  return valor
}

// ===== Notas de autor (post-its) por capítulo =====

export async function listarNotasDocumento(documentoId: string) {
  const id = validarId(documentoId, 'Documento')
  const supabase = await criarClienteServidor()
  const { data, error } = await supabase
    .from('documento_nota')
    .select('*, perfil:autor_id(nome_usuario, nome_exibicao, avatar_url)')
    .eq('documento_id', id)
    .order('criado_em', { ascending: true })

  if (error) throw erroOperacao('Não foi possível listar as notas')
  return data || []
}

export async function criarNotaDocumento(projetoId: string, documentoId: string, conteudo: string) {
  const projeto = validarId(projetoId, 'Projeto')
  const documento = validarId(documentoId, 'Documento')
  const texto = normalizarConteudo(conteudo)
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw erroPublico('Autenticação necessária')

  // Garante que o usuário é dono/colaborador e que o documento pertence ao projeto
  await verificarAcessoProjeto(supabase, projeto, user.id)
  const { data: doc } = await supabase
    .from('documento')
    .select('id')
    .eq('id', documento)
    .eq('projeto_id', projeto)
    .single()
  if (!doc) throw erroPublico('Documento inválido')

  const { error } = await supabase.from('documento_nota').insert({
    documento_id: documento,
    autor_id: user.id,
    conteudo: texto,
  })
  if (error) throw erroOperacao('Não foi possível criar a nota')
}

export async function excluirNotaDocumento(notaId: string) {
  const id = validarId(notaId, 'Nota')
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw erroPublico('Autenticação necessária')

  const { data: nota } = await supabase
    .from('documento_nota')
    .select('autor_id')
    .eq('id', id)
    .single()
  if (!nota || nota.autor_id !== user.id) throw erroPublico('Sem permissão')

  const { error } = await supabase.from('documento_nota').delete().eq('id', id)
  if (error) throw erroOperacao('Não foi possível excluir a nota')
}

// ===== Reações de leitores por capítulo =====

export async function reagirDocumento(documentoId: string, emoji: string) {
  const id = validarId(documentoId, 'Documento')
  const emojiValidado = normalizarEmoji(emoji)
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw erroPublico('Autenticação necessária')

  const { data: existente } = await supabase
    .from('documento_reacao')
    .select('emoji')
    .eq('documento_id', id)
    .eq('usuario_id', user.id)
    .eq('emoji', emojiValidado)
    .maybeSingle()

  if (existente) {
    const { error } = await supabase
      .from('documento_reacao')
      .delete()
      .eq('documento_id', id)
      .eq('usuario_id', user.id)
      .eq('emoji', emojiValidado)
    if (error) throw erroOperacao('Não foi possível remover a reação')
  } else {
    const { error } = await supabase.from('documento_reacao').insert({
      documento_id: id,
      usuario_id: user.id,
      emoji: emojiValidado,
    })
    if (error) throw erroOperacao('Não foi possível adicionar a reação')
  }
}

export async function listarReacoesDocumento(documentoId: string) {
  const id = validarId(documentoId, 'Documento')
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('documento_reacao')
    .select('emoji, usuario_id')
    .eq('documento_id', id)

  if (error) throw erroOperacao('Não foi possível listar reações')

  const reacoes: Record<string, { contagem: number; reagiu: boolean }> = {}
  for (const r of data || []) {
    if (!reacoes[r.emoji]) reacoes[r.emoji] = { contagem: 0, reagiu: false }
    reacoes[r.emoji].contagem++
    if (user && r.usuario_id === user.id) reacoes[r.emoji].reagiu = true
  }
  return reacoes
}
