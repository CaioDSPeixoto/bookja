'use server'

import { erroOperacao, erroPublico } from '@/lib/actions/erros'
import { criarClienteServidor } from '@/lib/supabase/server'
import { eRegistro } from '@/lib/validacao/comum'

type DadosPerfil = {
  nome_exibicao?: string | null
  bio?: string | null
  chave_pix?: string | null
  data_nascimento?: string | null
}

async function obterUsuarioOuErro() {
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw erroPublico('Autenticação necessária')
  return { supabase, user }
}

function normalizarTextoOpcional(valor: unknown): string | null {
  if (valor === undefined || valor === null) return null
  if (typeof valor !== 'string') return null

  const texto = valor.trim()
  return texto || null
}

function normalizarDataNascimento(valor: unknown): string | null {
  if (valor === undefined || valor === null) return null
  if (typeof valor !== 'string') return null

  const texto = valor.trim()
  if (!texto) return null

  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    throw erroPublico('Data de nascimento inválida')
  }

  const data = new Date(`${texto}T00:00:00`)
  if (Number.isNaN(data.getTime())) {
    throw erroPublico('Data de nascimento inválida')
  }

  const hoje = new Date()
  if (data > hoje) {
    throw erroPublico('A data de nascimento não pode estar no futuro')
  }
  if (data.getUTCFullYear() < 1900) {
    throw erroPublico('Data de nascimento inválida')
  }

  return texto
}

function normalizarNomeUsuario(nomeUsuario: unknown): string {
  const nome = typeof nomeUsuario === 'string' ? nomeUsuario.trim() : ''
  if (!nome) {
    throw erroPublico('Nome de usuário obrigatório')
  }

  return nome
}

function normalizarDadosPerfil(dados: unknown): DadosPerfil {
  if (!eRegistro(dados)) {
    throw erroPublico('Perfil inválido')
  }

  const payload: DadosPerfil = {}

  if ('nome_exibicao' in dados) {
    payload.nome_exibicao = normalizarTextoOpcional(dados.nome_exibicao)
  }

  if ('bio' in dados) {
    payload.bio = normalizarTextoOpcional(dados.bio)
  }

  if ('chave_pix' in dados) {
    payload.chave_pix = normalizarTextoOpcional(dados.chave_pix)
  }

  if ('data_nascimento' in dados) {
    payload.data_nascimento = normalizarDataNascimento(dados.data_nascimento)
  }

  return payload
}

export async function atualizarPerfil(dados: DadosPerfil) {
  const { supabase, user } = await obterUsuarioOuErro()
  const payload = normalizarDadosPerfil(dados)

  const { error } = await supabase
    .from('perfil')
    .update(payload)
    .eq('id', user.id)

  if (error) throw erroOperacao('Não foi possível atualizar o perfil')
}

export async function buscarPerfilPublico(nomeUsuario: string) {
  const supabase = await criarClienteServidor()
  const nomeUsuarioValidado = normalizarNomeUsuario(nomeUsuario)

  const { data: perfil, error } = await supabase
    .from('perfil')
    .select('id, nome_usuario, nome_exibicao, bio, avatar_url, chave_pix')
    .eq('nome_usuario', nomeUsuarioValidado)
    .single()

  if (error || !perfil) return null

  const { data: projetos } = await supabase
    .from('projeto')
    .select('id, titulo, sinopse, status, capa_url, media_avaliacao, contagem_avaliacoes, contagem_visualizacoes')
    .eq('dono_id', perfil.id)
    .eq('status', 'publicado')
    .order('criado_em', { ascending: false })

  const { data: leituras } = await supabase
    .from('leitura_atual')
    .select('projeto_id, ultimo_documento_id, projeto:projeto_id(id, titulo)')
    .eq('usuario_id', perfil.id)

  return { perfil, projetos: projetos || [], leituras: leituras || [] }
}

export async function obterMeuPerfil() {
  const { supabase, user } = await obterUsuarioOuErro()

  const { data, error } = await supabase
    .from('perfil')
    .select('nome_exibicao, bio, chave_pix, data_nascimento')
    .eq('id', user.id)
    .single()

  if (error || !data) throw erroOperacao('Não foi possível obter o perfil')
  return data
}
