'use server'

import { erroOperacao, erroPublico } from '@/lib/actions/erros'
import { criarNotificacao } from '@/lib/notificacoes/actions'
import { obterUsuarioAutenticado, verificarDonoProjeto } from '@/lib/projetos/acesso'
import { criarClienteServidor } from '@/lib/supabase/server'
import { validarUuid } from '@/lib/validacao/comum'

type PapelColaborador = 'coautor' | 'revisor'
type ClienteSupabase = Awaited<ReturnType<typeof criarClienteServidor>>

const PAPEIS_COLABORADOR: PapelColaborador[] = ['coautor', 'revisor']

async function obterUsuarioOuErro() {
  const supabase = await criarClienteServidor()
  const user = await obterUsuarioAutenticado(supabase)
  return { supabase, user }
}

async function verificarDono(supabase: ClienteSupabase, projetoId: string, userId: string) {
  await verificarDonoProjeto(supabase, projetoId, userId)
}

function validarIdProjeto(projetoId: unknown): string {
  if (!validarUuid(projetoId)) {
    throw erroPublico('Projeto inválido')
  }

  return projetoId
}

function validarIdUsuario(usuarioId: unknown): string {
  if (!validarUuid(usuarioId)) {
    throw erroPublico('Usuário inválido')
  }

  return usuarioId
}

function normalizarNomeUsuario(nomeUsuario: unknown): string {
  const nome = typeof nomeUsuario === 'string' ? nomeUsuario.trim().replace(/^@+/, '') : ''
  if (!nome) {
    throw erroPublico('Nome de usuário obrigatório')
  }

  return nome
}

function normalizarBuscaUsuario(termo: unknown): string {
  const busca = typeof termo === 'string' ? termo.trim().replace(/^@+/, '') : ''
  if (busca.length < 2) {
    throw erroPublico('Digite pelo menos 2 caracteres')
  }

  return busca.replaceAll('%', '').replaceAll('_', '').slice(0, 40)
}

function validarPapelColaborador(papel: unknown): PapelColaborador {
  if (typeof papel !== 'string' || !PAPEIS_COLABORADOR.includes(papel as PapelColaborador)) {
    throw erroPublico('Papel de colaborador inválido')
  }

  return papel as PapelColaborador
}

function erroColaborador(mensagem: string): Error {
  return erroOperacao(mensagem)
}

export async function convidarColaborador(projetoId: string, nomeUsuario: string, papel: string) {
  const { supabase, user } = await obterUsuarioOuErro()
  const projetoIdValidado = validarIdProjeto(projetoId)
  const nomeUsuarioValidado = normalizarNomeUsuario(nomeUsuario)
  const papelValidado = validarPapelColaborador(papel)
  await verificarDono(supabase, projetoIdValidado, user.id)

  const { data: convidado } = await supabase
    .from('perfil')
    .select('id, nome_usuario, nome_exibicao, avatar_url')
    .eq('nome_usuario', nomeUsuarioValidado)
    .single()

  if (!convidado) throw erroPublico('Usuário não encontrado')
  if (convidado.id === user.id) throw erroPublico('Você já é o dono do projeto')

  const { data: existente } = await supabase
    .from('projeto_colaborador')
    .select('usuario_id')
    .eq('projeto_id', projetoIdValidado)
    .eq('usuario_id', convidado.id)
    .maybeSingle()

  if (existente) throw erroPublico('Este usuário já foi convidado')

  const convidadoEm = new Date().toISOString()

  const { error } = await supabase
    .from('projeto_colaborador')
    .insert({
      projeto_id: projetoIdValidado,
      usuario_id: convidado.id,
      papel: papelValidado,
      convidado_em: convidadoEm,
    })

  if (error) throw erroColaborador('Não foi possível convidar o colaborador')

  const { data: projeto } = await supabase
    .from('projeto')
    .select('titulo')
    .eq('id', projetoIdValidado)
    .single()

  await criarNotificacao({
    usuario_id: convidado.id,
    tipo: 'convite',
    projeto_id: projetoIdValidado,
    mensagem: projeto?.titulo || 'Projeto',
  })

  return {
    usuario_id: convidado.id,
    papel: papelValidado,
    convidado_em: convidadoEm,
    aceito_em: null,
    perfil: {
      nome_usuario: convidado.nome_usuario,
      nome_exibicao: convidado.nome_exibicao,
      avatar_url: convidado.avatar_url,
    },
  }
}

export async function buscarUsuariosParaConvite(projetoId: string, termo: string) {
  const { supabase, user } = await obterUsuarioOuErro()
  const projetoIdValidado = validarIdProjeto(projetoId)
  const busca = normalizarBuscaUsuario(termo)
  await verificarDono(supabase, projetoIdValidado, user.id)

  const { data: convidados } = await supabase
    .from('projeto_colaborador')
    .select('usuario_id')
    .eq('projeto_id', projetoIdValidado)

  const idsConvidados = new Set((convidados || []).map((item) => item.usuario_id))
  idsConvidados.add(user.id)

  const { data, error } = await supabase
    .from('perfil')
    .select('id, nome_usuario, nome_exibicao, avatar_url')
    .or(`nome_usuario.ilike.%${busca}%,nome_exibicao.ilike.%${busca}%`)
    .limit(8)

  if (error) throw erroColaborador('Não foi possível buscar usuários')

  return (data || []).filter((perfil) => !idsConvidados.has(perfil.id))
}

export async function removerColaborador(projetoId: string, usuarioId: string) {
  const { supabase, user } = await obterUsuarioOuErro()
  const projetoIdValidado = validarIdProjeto(projetoId)
  const usuarioIdValidado = validarIdUsuario(usuarioId)
  await verificarDono(supabase, projetoIdValidado, user.id)

  const { error } = await supabase
    .from('projeto_colaborador')
    .delete()
    .eq('projeto_id', projetoIdValidado)
    .eq('usuario_id', usuarioIdValidado)

  if (error) throw erroColaborador('Não foi possível remover o colaborador')
}

export async function listarColaboradores(projetoId: string) {
  const { supabase } = await obterUsuarioOuErro()
  const projetoIdValidado = validarIdProjeto(projetoId)

  const { data, error } = await supabase
    .from('projeto_colaborador')
    .select('usuario_id, papel, convidado_em, aceito_em, perfil:usuario_id(nome_usuario, nome_exibicao, avatar_url)')
    .eq('projeto_id', projetoIdValidado)

  if (error) throw erroColaborador('Não foi possível listar colaboradores')
  return data || []
}

export async function aceitarConvite(projetoId: string) {
  const { supabase, user } = await obterUsuarioOuErro()
  const projetoIdValidado = validarIdProjeto(projetoId)

  const { error } = await supabase
    .from('projeto_colaborador')
    .update({ aceito_em: new Date().toISOString() })
    .eq('projeto_id', projetoIdValidado)
    .eq('usuario_id', user.id)

  if (error) throw erroColaborador('Não foi possível aceitar o convite')
}
