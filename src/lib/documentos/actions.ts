'use server'

import { erroOperacao, erroPublico } from '@/lib/actions/erros'
import { notificarFavoritosNovoCapitulo } from '@/lib/notificacoes/actions'
import { obterUsuarioAutenticado, verificarAcessoProjeto } from '@/lib/projetos/acesso'
import { criarClienteServidor } from '@/lib/supabase/server'
import type { Json } from '@/types/database'
import { eJson, eRegistro, validarUuid } from '@/lib/validacao/comum'

type TipoDocumento = 'capitulo' | 'ficha_personagem' | 'biblia' | 'nota' | 'outro'
export type StatusDocumento = 'rascunho' | 'revisao' | 'revisao_supervisionada' | 'publicado'
type DadosDocumento = {
  titulo?: string
  conteudo?: Json | null
  contagem_palavras?: number
  publico?: boolean
  status?: StatusDocumento
}
type OrdemDocumento = { id: string; ordem: number }
type ClienteSupabase = Awaited<ReturnType<typeof criarClienteServidor>>

const TIPOS_DOCUMENTO: TipoDocumento[] = ['capitulo', 'ficha_personagem', 'biblia', 'nota', 'outro']
const STATUS_DOCUMENTO: StatusDocumento[] = ['rascunho', 'revisao', 'revisao_supervisionada', 'publicado']

async function verificarAcesso(supabase: ClienteSupabase, projetoId: string) {
  const user = await obterUsuarioAutenticado(supabase)
  await verificarAcessoProjeto(supabase, projetoId, user.id)
  return user.id
}

function validarIdProjeto(id: unknown): string {
  if (!validarUuid(id)) {
    throw erroPublico('Projeto inválido')
  }

  return id
}

function validarIdDocumento(id: unknown): string {
  if (!validarUuid(id)) {
    throw erroPublico('Documento inválido')
  }

  return id
}

function validarTipoDocumento(tipo: unknown): tipo is TipoDocumento {
  return typeof tipo === 'string' && TIPOS_DOCUMENTO.includes(tipo as TipoDocumento)
}

function validarStatusDocumento(status: unknown): status is StatusDocumento {
  return typeof status === 'string' && STATUS_DOCUMENTO.includes(status as StatusDocumento)
}

function normalizarTitulo(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

function normalizarDadosDocumento(dados: unknown): DadosDocumento {
  if (!eRegistro(dados)) {
    throw erroPublico('Dados do documento inválidos')
  }

  const payload: DadosDocumento = {}

  if ('titulo' in dados) {
    payload.titulo = normalizarTitulo(dados.titulo)
  }

  if ('conteudo' in dados) {
    if (!eJson(dados.conteudo)) {
      throw erroPublico('Conteúdo do documento inválido')
    }

    payload.conteudo = dados.conteudo
  }

  if ('contagem_palavras' in dados) {
    if (
      typeof dados.contagem_palavras !== 'number'
      || !Number.isFinite(dados.contagem_palavras)
      || dados.contagem_palavras < 0
    ) {
      throw erroPublico('Contagem de palavras inválida')
    }

    payload.contagem_palavras = Math.floor(dados.contagem_palavras)
  }

  if ('publico' in dados) {
    if (typeof dados.publico !== 'boolean') {
      throw erroPublico('Visibilidade do documento inválida')
    }

    payload.publico = dados.publico
  }

  if ('status' in dados) {
    if (!validarStatusDocumento(dados.status)) {
      throw erroPublico('Status do documento inválido')
    }

    payload.status = dados.status
  }

  return payload
}

function dadosStatusDocumento(status: StatusDocumento) {
  const agora = new Date().toISOString()

  if (status === 'publicado') {
    return {
      status,
      publico: true,
      publicado_em: agora,
      atualizado_em: agora,
    }
  }

  return {
    status,
    publico: false,
    publicado_em: null,
    atualizado_em: agora,
  }
}

function normalizarOrdens(ordens: unknown): OrdemDocumento[] {
  if (!Array.isArray(ordens)) {
    throw erroPublico('Ordem dos documentos inválida')
  }

  return ordens.map((item) => {
    if (!eRegistro(item) || !validarUuid(item.id)) {
      throw erroPublico('Ordem dos documentos inválida')
    }

    if (typeof item.ordem !== 'number' || !Number.isInteger(item.ordem) || item.ordem < 0) {
      throw erroPublico('Ordem dos documentos inválida')
    }

    return { id: item.id, ordem: item.ordem }
  })
}

function erroDocumento(mensagem: string): Error {
  return erroOperacao(mensagem)
}

async function criarAprovacoesPendentes(
  supabase: ClienteSupabase,
  documentoId: string,
  projetoId: string,
) {
  await supabase
    .from('documento_aprovacao')
    .delete()
    .eq('documento_id', documentoId)

  const { data: colaboradores } = await supabase
    .from('projeto_colaborador')
    .select('usuario_id')
    .eq('projeto_id', projetoId)
    .not('aceito_em', 'is', null)

  const aprovacoes = (colaboradores || []).map((colaborador) => ({
    documento_id: documentoId,
    usuario_id: colaborador.usuario_id,
  }))

  if (aprovacoes.length === 0) return

  const { error } = await supabase
    .from('documento_aprovacao')
    .insert(aprovacoes)

  if (error) throw erroDocumento('Não foi possível criar aprovações de revisão')
}

async function validarPublicacaoDocumento(
  supabase: ClienteSupabase,
  documentoId: string,
  statusAnterior: StatusDocumento,
) {
  if (statusAnterior !== 'revisao' && statusAnterior !== 'revisao_supervisionada') {
    throw erroPublico('Capítulo precisa passar por revisão antes de ser publicado')
  }

  if (statusAnterior !== 'revisao_supervisionada') return

  const { data: pendentes } = await supabase
    .from('documento_aprovacao')
    .select('usuario_id')
    .eq('documento_id', documentoId)
    .is('aprovado_em', null)
    .limit(1)

  if (pendentes && pendentes.length > 0) {
    throw erroPublico('Aprovação dos colaboradores pendente')
  }
}

export async function criarDocumento(projetoId: string, titulo: string, tipo: TipoDocumento) {
  const supabase = await criarClienteServidor()
  const projetoIdValidado = validarIdProjeto(projetoId)
  await verificarAcesso(supabase, projetoIdValidado)

  if (!validarTipoDocumento(tipo)) {
    throw erroPublico('Tipo de documento inválido')
  }

  const { data: ultimo } = await supabase
    .from('documento')
    .select('ordem')
    .eq('projeto_id', projetoIdValidado)
    .order('ordem', { ascending: false })
    .limit(1)
    .single()

  const ordem = (ultimo?.ordem ?? 0) + 1

  const { data, error } = await supabase
    .from('documento')
    .insert({
      projeto_id: projetoIdValidado,
      titulo: normalizarTitulo(titulo),
      tipo,
      ordem,
      publico: false,
      status: 'rascunho',
    })
    .select()
    .single()

  if (error || !data) throw erroDocumento('Não foi possível criar o documento')
  return data
}

export async function alterarStatusDocumento(id: string, status: StatusDocumento) {
  const supabase = await criarClienteServidor()
  const documentoId = validarIdDocumento(id)

  if (!validarStatusDocumento(status)) {
    throw erroPublico('Status do documento inválido')
  }

  const { data: doc } = await supabase
    .from('documento')
    .select('id, projeto_id, titulo, status')
    .eq('id', documentoId)
    .single()

  if (!doc) throw erroPublico('Documento não encontrado')
  await verificarAcesso(supabase, doc.projeto_id)

  const statusAnterior = doc.status as StatusDocumento
  if (status === 'publicado') {
    await validarPublicacaoDocumento(supabase, documentoId, statusAnterior)
  }

  const { data, error } = await supabase
    .from('documento')
    .update(dadosStatusDocumento(status))
    .eq('id', documentoId)
    .select('id, projeto_id, titulo, status, publico, publicado_em')
    .single()

  if (error || !data) throw erroDocumento('Não foi possível atualizar o status do documento')

  if (status === 'revisao_supervisionada') {
    await criarAprovacoesPendentes(supabase, data.id, data.projeto_id)
  }

  if (status === 'publicado' && statusAnterior !== 'publicado') {
    const { data: projeto } = await supabase
      .from('projeto')
      .select('titulo')
      .eq('id', data.projeto_id)
      .single()
    const tituloObra = projeto?.titulo || 'uma história que você acompanha'
    const tituloCapitulo = data.titulo || 'Novo capítulo'
    await notificarFavoritosNovoCapitulo(
      data.projeto_id,
      data.id,
      `${tituloObra}: novo capítulo "${tituloCapitulo}"`,
    ).catch(() => undefined)
  }

  return data
}

export async function aprovarRevisaoDocumento(id: string) {
  const supabase = await criarClienteServidor()
  const documentoId = validarIdDocumento(id)
  const user = await obterUsuarioAutenticado(supabase)

  const { data: doc } = await supabase
    .from('documento')
    .select('id, projeto_id, status')
    .eq('id', documentoId)
    .single()

  if (!doc) throw erroPublico('Documento não encontrado')
  await verificarAcesso(supabase, doc.projeto_id)

  const { data, error } = await supabase
    .from('documento_aprovacao')
    .update({ aprovado_em: new Date().toISOString() })
    .eq('documento_id', documentoId)
    .eq('usuario_id', user.id)
    .is('aprovado_em', null)
    .select('documento_id')
    .single()

  if (error || !data) throw erroPublico('Você não possui aprovação pendente para este capítulo')
}

export async function atualizarDocumento(
  id: string,
  dados: DadosDocumento,
) {
  const supabase = await criarClienteServidor()
  const documentoId = validarIdDocumento(id)
  const payload = normalizarDadosDocumento(dados)

  const { data: doc } = await supabase
    .from('documento')
    .select('projeto_id')
    .eq('id', documentoId)
    .single()

  if (!doc) throw erroPublico('Documento não encontrado')
  await verificarAcesso(supabase, doc.projeto_id)

  const { data, error } = await supabase
    .from('documento')
    .update({ ...payload, atualizado_em: new Date().toISOString() })
    .eq('id', documentoId)
    .select()
    .single()

  if (error || !data) throw erroDocumento('Não foi possível atualizar o documento')
  return data
}

export async function excluirDocumento(id: string) {
  const supabase = await criarClienteServidor()
  const documentoId = validarIdDocumento(id)

  const { data: doc } = await supabase
    .from('documento')
    .select('projeto_id')
    .eq('id', documentoId)
    .single()

  if (!doc) throw erroPublico('Documento não encontrado')
  await verificarAcesso(supabase, doc.projeto_id)

  const { error } = await supabase.from('documento').delete().eq('id', documentoId)
  if (error) throw erroDocumento('Não foi possível excluir o documento')
}

export async function listarDocumentos(projetoId: string) {
  const supabase = await criarClienteServidor()
  const projetoIdValidado = validarIdProjeto(projetoId)
  await verificarAcesso(supabase, projetoIdValidado)

  const { data, error } = await supabase
    .from('documento')
    .select('*')
    .eq('projeto_id', projetoIdValidado)
    .order('ordem', { ascending: true })

  if (error) throw erroDocumento('Não foi possível listar os documentos')
  return data
}

export async function obterDocumento(id: string) {
  const supabase = await criarClienteServidor()
  const documentoId = validarIdDocumento(id)

  const { data: doc, error } = await supabase
    .from('documento')
    .select('*')
    .eq('id', documentoId)
    .single()

  if (error || !doc) throw erroPublico('Documento não encontrado')
  await verificarAcesso(supabase, doc.projeto_id)
  return doc
}

export async function reordenarDocumentos(projetoId: string, ordens: OrdemDocumento[]) {
  const supabase = await criarClienteServidor()
  const projetoIdValidado = validarIdProjeto(projetoId)
  const ordensValidadas = normalizarOrdens(ordens)
  await verificarAcesso(supabase, projetoIdValidado)

  // Reordenação atômica via RPC: todas as ordens são aplicadas de uma vez
  // (tudo ou nada), evitando ordem parcialmente aplicada se algo falhar.
  const { error } = await supabase.rpc('reordenar_documentos', {
    p_projeto_id: projetoIdValidado,
    p_ordens: ordensValidadas,
  })

  if (error) throw erroDocumento('Não foi possível reordenar os documentos')
}
