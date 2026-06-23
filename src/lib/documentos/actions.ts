'use server'

import { criarClienteServidor } from '@/lib/supabase/server'

type TipoDocumento = 'capitulo' | 'ficha_personagem' | 'biblia' | 'nota' | 'outro'

async function verificarAcesso(supabase: Awaited<ReturnType<typeof criarClienteServidor>>, projetoId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: projeto } = await supabase
    .from('projeto')
    .select('dono_id')
    .eq('id', projetoId)
    .single()

  if (!projeto) throw new Error('Projeto não encontrado')

  if (projeto.dono_id === user.id) return user.id

  const { data: colaborador } = await supabase
    .from('colaborador')
    .select('id')
    .eq('projeto_id', projetoId)
    .eq('usuario_id', user.id)
    .single()

  if (!colaborador) throw new Error('Sem permissão')
  return user.id
}

export async function criarDocumento(projetoId: string, titulo: string, tipo: TipoDocumento) {
  const supabase = await criarClienteServidor()
  await verificarAcesso(supabase, projetoId)

  const { data: ultimo } = await supabase
    .from('documento')
    .select('ordem')
    .eq('projeto_id', projetoId)
    .order('ordem', { ascending: false })
    .limit(1)
    .single()

  const ordem = (ultimo?.ordem ?? 0) + 1

  const { data, error } = await supabase
    .from('documento')
    .insert({ projeto_id: projetoId, titulo, tipo, ordem })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function atualizarDocumento(
  id: string,
  dados: { titulo?: string; conteudo?: unknown; contagem_palavras?: number; publico?: boolean }
) {
  const supabase = await criarClienteServidor()

  const { data: doc } = await supabase
    .from('documento')
    .select('projeto_id')
    .eq('id', id)
    .single()

  if (!doc) throw new Error('Documento não encontrado')
  await verificarAcesso(supabase, doc.projeto_id)

  const { data, error } = await supabase
    .from('documento')
    .update({ ...dados, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function excluirDocumento(id: string) {
  const supabase = await criarClienteServidor()

  const { data: doc } = await supabase
    .from('documento')
    .select('projeto_id')
    .eq('id', id)
    .single()

  if (!doc) throw new Error('Documento não encontrado')
  await verificarAcesso(supabase, doc.projeto_id)

  const { error } = await supabase.from('documento').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function listarDocumentos(projetoId: string) {
  const supabase = await criarClienteServidor()
  await verificarAcesso(supabase, projetoId)

  const { data, error } = await supabase
    .from('documento')
    .select('*')
    .eq('projeto_id', projetoId)
    .order('ordem', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

export async function obterDocumento(id: string) {
  const supabase = await criarClienteServidor()

  const { data: doc, error } = await supabase
    .from('documento')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !doc) throw new Error('Documento não encontrado')
  await verificarAcesso(supabase, doc.projeto_id)
  return doc
}

export async function reordenarDocumentos(projetoId: string, ordens: { id: string; ordem: number }[]) {
  const supabase = await criarClienteServidor()
  await verificarAcesso(supabase, projetoId)

  for (const { id, ordem } of ordens) {
    const { error } = await supabase
      .from('documento')
      .update({ ordem })
      .eq('id', id)
      .eq('projeto_id', projetoId)

    if (error) throw new Error(error.message)
  }
}
