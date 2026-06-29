'use server'

import { redirect } from 'next/navigation'

import { erroOperacao, erroPublico } from '@/lib/actions/erros'
import { criarClienteServidor } from '@/lib/supabase/server'
import { eRegistro, validarUuid } from '@/lib/validacao/comum'

export type StatusProjeto = 'rascunho' | 'revisao' | 'publicado'

type DadosAtualizacaoProjeto = {
  titulo?: string
  sinopse?: string | null
  status?: StatusProjeto
  capa_url?: string | null
}

const STATUS_PROJETO: StatusProjeto[] = ['rascunho', 'revisao', 'publicado']

async function obterUsuarioOuErro() {
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw erroPublico('Autenticação necessária')
  return { supabase, user }
}

function validarIdProjeto(id: unknown): string {
  if (!validarUuid(id)) {
    throw erroPublico('Projeto inválido')
  }

  return id
}

function normalizarTitulo(valor: unknown): string {
  const titulo = typeof valor === 'string' ? valor.trim() : ''
  if (!titulo) {
    throw erroPublico('Título obrigatório')
  }

  return titulo
}

function normalizarTextoOpcional(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null
  if (typeof valor !== 'string') return null

  const texto = valor.trim()
  return texto || null
}

function validarStatusProjeto(valor: unknown): valor is StatusProjeto {
  return typeof valor === 'string' && STATUS_PROJETO.includes(valor as StatusProjeto)
}

function normalizarDadosProjeto(dados: unknown): DadosAtualizacaoProjeto {
  if (!eRegistro(dados)) {
    throw erroPublico('Dados do projeto inválidos')
  }

  const payload: DadosAtualizacaoProjeto = {}

  if ('titulo' in dados) {
    payload.titulo = normalizarTitulo(dados.titulo)
  }

  if ('sinopse' in dados) {
    payload.sinopse = normalizarTextoOpcional(dados.sinopse)
  }

  if ('status' in dados) {
    if (!validarStatusProjeto(dados.status)) {
      throw erroPublico('Status de projeto inválido')
    }

    payload.status = dados.status
  }

  if ('capa_url' in dados) {
    if (typeof dados.capa_url !== 'string' && dados.capa_url !== null) {
      throw erroPublico('Capa inválida')
    }

    payload.capa_url = dados.capa_url
  }

  return payload
}

function normalizarDadosPublicacao(dados: unknown): Pick<DadosAtualizacaoProjeto, 'titulo' | 'sinopse'> {
  const payload = normalizarDadosProjeto(dados)
  return {
    ...(payload.titulo !== undefined ? { titulo: payload.titulo } : {}),
    ...(payload.sinopse !== undefined ? { sinopse: payload.sinopse } : {}),
  }
}

function erroProjeto(mensagem: string): Error {
  return erroOperacao(mensagem)
}

export async function criarProjeto(formData: FormData) {
  const { supabase, user } = await obterUsuarioOuErro()
  const titulo = normalizarTitulo(formData.get('titulo'))
  const sinopse = normalizarTextoOpcional(formData.get('sinopse'))

  const { data, error } = await supabase
    .from('projeto')
    .insert({ titulo, sinopse, dono_id: user.id, status: 'rascunho' })
    .select('id')
    .single()

  if (error || !data) throw erroProjeto('Não foi possível criar o projeto')
  return data.id
}

export async function atualizarProjeto(id: string, dados: DadosAtualizacaoProjeto) {
  const { supabase, user } = await obterUsuarioOuErro()
  const projetoId = validarIdProjeto(id)
  const payload = normalizarDadosProjeto(dados)

  const { error } = await supabase
    .from('projeto')
    .update(payload)
    .eq('id', projetoId)
    .eq('dono_id', user.id)

  if (error) throw erroProjeto('Não foi possível atualizar o projeto')
}

export async function publicarProjeto(id: string, dados: { titulo?: string; sinopse?: string | null }) {
  const { supabase, user } = await obterUsuarioOuErro()
  const projetoId = validarIdProjeto(id)
  const payload = normalizarDadosPublicacao(dados)

  const { data: documentos, error: erroDocumentos } = await supabase
    .from('documento')
    .select('id')
    .eq('projeto_id', projetoId)
    .eq('tipo', 'capitulo')
    .eq('status', 'publicado')
    .eq('publico', true)
    .limit(1)

  if (erroDocumentos) throw erroProjeto('Não foi possível validar os capítulos do projeto')
  if (!documentos || documentos.length === 0) {
    throw erroPublico('Projeto precisa ter pelo menos um capítulo publicado')
  }

  const agora = new Date().toISOString()

  const { error } = await supabase
    .from('projeto')
    .update({
      ...payload,
      status: 'publicado',
      publicado_em: agora,
      atualizado_em: agora,
    })
    .eq('id', projetoId)
    .eq('dono_id', user.id)

  if (error) throw erroProjeto('Não foi possível publicar o projeto')
}

export async function despublicarProjeto(id: string, dados: { titulo?: string; sinopse?: string | null }) {
  const { supabase, user } = await obterUsuarioOuErro()
  const projetoId = validarIdProjeto(id)
  const payload = normalizarDadosPublicacao(dados)
  const agora = new Date().toISOString()

  const { error } = await supabase
    .from('projeto')
    .update({
      ...payload,
      status: 'rascunho',
      publicado_em: null,
      atualizado_em: agora,
    })
    .eq('id', projetoId)
    .eq('dono_id', user.id)

  if (error) throw erroProjeto('Não foi possível despublicar o projeto')
}

export async function excluirProjeto(id: string, locale: string) {
  const { supabase, user } = await obterUsuarioOuErro()
  const projetoId = validarIdProjeto(id)

  const { error } = await supabase
    .from('projeto')
    .delete()
    .eq('id', projetoId)
    .eq('dono_id', user.id)

  if (error) throw erroProjeto('Não foi possível excluir o projeto')
  redirect(`/${locale}/biblioteca`)
}

export async function listarProjetos() {
  const { supabase, user } = await obterUsuarioOuErro()

  const { data, error } = await supabase
    .from('projeto')
    .select('*, documento(count), comentario(count)')
    .eq('dono_id', user.id)
    .order('criado_em', { ascending: false })

  if (error) {
    return []
  }
  return data ?? []
}

export async function obterProjeto(id: string) {
  const { supabase, user } = await obterUsuarioOuErro()
  const projetoId = validarIdProjeto(id)

  const { data, error } = await supabase
    .from('projeto')
    .select('*, documento(*)')
    .eq('id', projetoId)
    .eq('dono_id', user.id)
    .single()

  if (error || !data) throw erroPublico('Projeto não encontrado')
  return data
}
