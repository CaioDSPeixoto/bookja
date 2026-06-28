'use server'

import { erroOperacao, erroPublico } from '@/lib/actions/erros'
import { criarClienteServidor } from '@/lib/supabase/server'
import { eRegistro, validarUuid } from '@/lib/validacao/comum'

type DadosNotificacao = {
  usuario_id: string
  tipo: string
  projeto_id?: string | null
  documento_id?: string | null
  comentario_id?: string | null
  mensagem: string
}

async function obterUsuarioOuErro() {
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw erroPublico('Autenticação necessária')
  return { supabase, user }
}

function validarIdNotificacao(id: unknown): string {
  if (!validarUuid(id)) {
    throw erroPublico('Notificação inválida')
  }

  return id
}

function validarIdUsuario(id: unknown): string {
  if (!validarUuid(id)) {
    throw erroPublico('Usuário inválido')
  }

  return id
}

function validarIdOpcional(id: unknown, mensagem: string): string | null {
  if (id === undefined || id === null || id === '') return null
  if (!validarUuid(id)) throw erroPublico(mensagem)
  return id
}

function normalizarTextoObrigatorio(valor: unknown, mensagem: string): string {
  const texto = typeof valor === 'string' ? valor.trim() : ''
  if (!texto) throw erroPublico(mensagem)
  return texto
}

function normalizarNotificacao(dados: unknown): DadosNotificacao {
  if (!eRegistro(dados)) {
    throw erroPublico('Notificação inválida')
  }

  return {
    usuario_id: validarIdUsuario(dados.usuario_id),
    tipo: normalizarTextoObrigatorio(dados.tipo, 'Notificação inválida'),
    projeto_id: validarIdOpcional(dados.projeto_id, 'Projeto inválido'),
    documento_id: validarIdOpcional(dados.documento_id, 'Documento inválido'),
    comentario_id: validarIdOpcional(dados.comentario_id, 'Comentário inválido'),
    mensagem: normalizarTextoObrigatorio(dados.mensagem, 'Mensagem obrigatória'),
  }
}

export async function listarNotificacoes() {
  const { supabase, user } = await obterUsuarioOuErro()

  const { data, error } = await supabase
    .from('notificacao')
    .select('*')
    .eq('usuario_id', user.id)
    .order('criado_em', { ascending: false })
    .limit(50)

  if (error) throw erroOperacao('Não foi possível listar notificações')
  return data || []
}

export async function marcarComoLida(id: string) {
  const notificacaoId = validarIdNotificacao(id)
  const { supabase, user } = await obterUsuarioOuErro()

  const { error } = await supabase
    .from('notificacao')
    .update({ lida: true })
    .eq('id', notificacaoId)
    .eq('usuario_id', user.id)

  if (error) throw erroOperacao('Não foi possível marcar a notificação como lida')
}

export async function marcarTodasComoLidas() {
  const { supabase, user } = await obterUsuarioOuErro()

  const { error } = await supabase
    .from('notificacao')
    .update({ lida: true })
    .eq('usuario_id', user.id)
    .eq('lida', false)

  if (error) throw erroOperacao('Não foi possível marcar notificações como lidas')
}

export async function criarNotificacao(dados: DadosNotificacao) {
  const supabase = await criarClienteServidor()
  const payload = normalizarNotificacao(dados)

  const { error } = await supabase.rpc('criar_notificacao_sistema', {
    p_usuario_id: payload.usuario_id,
    p_tipo: payload.tipo,
    p_projeto_id: payload.projeto_id,
    p_documento_id: payload.documento_id,
    p_comentario_id: payload.comentario_id,
    p_mensagem: payload.mensagem,
  })

  if (error) throw erroOperacao('Não foi possível criar a notificação')
}

export async function notificarFavoritosNovoCapitulo(
  projetoId: string,
  documentoId: string,
  mensagem: string,
) {
  const payload = {
    projetoId: validarIdOpcional(projetoId, 'Projeto inválido'),
    documentoId: validarIdOpcional(documentoId, 'Documento inválido'),
    mensagem: normalizarTextoObrigatorio(mensagem, 'Mensagem obrigatória'),
  }

  if (!payload.projetoId || !payload.documentoId) {
    throw erroPublico('Notificação inválida')
  }

  const supabase = await criarClienteServidor()
  const { error } = await supabase.rpc('notificar_favoritos_capitulo_publicado', {
    p_projeto_id: payload.projetoId,
    p_documento_id: payload.documentoId,
    p_mensagem: payload.mensagem,
  })

  if (error) throw erroOperacao('Não foi possível notificar favoritos')
}
