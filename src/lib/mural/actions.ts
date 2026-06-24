'use server'

import { criarClienteServidor } from '@/lib/supabase/server'

async function obterUsuarioOuErro() {
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  return { supabase, user }
}

export async function listarMural(perfilId: string) {
  const supabase = await criarClienteServidor()

  const { data, error } = await supabase
    .from('mural_comentario')
    .select('id, conteudo, criado_em, pai_id, autor:autor_id(id, nome_usuario, nome_exibicao, avatar_url)')
    .eq('perfil_id', perfilId)
    .is('pai_id', null)
    .order('criado_em', { ascending: false })
    .limit(50)

  if (error) throw new Error(error.message)

  // Buscar respostas
  const ids = (data || []).map(c => c.id)
  let respostas: typeof data = []
  if (ids.length > 0) {
    const { data: resp } = await supabase
      .from('mural_comentario')
      .select('id, conteudo, criado_em, pai_id, autor:autor_id(id, nome_usuario, nome_exibicao, avatar_url)')
      .in('pai_id', ids)
      .order('criado_em', { ascending: true })
    respostas = resp || []
  }

  // Buscar reações
  const todosIds = [...ids, ...(respostas || []).map(r => r.id)]
  let reacoes: { comentario_id: string; emoji: string; usuario_id: string }[] = []
  if (todosIds.length > 0) {
    const { data: react } = await supabase
      .from('mural_reacao')
      .select('comentario_id, emoji, usuario_id')
      .in('comentario_id', todosIds)
    reacoes = react || []
  }

  return { comentarios: data || [], respostas: respostas || [], reacoes }
}

export async function criarComentarioMural(perfilId: string, conteudo: string, paiId?: string) {
  const { supabase, user } = await obterUsuarioOuErro()

  const { error } = await supabase
    .from('mural_comentario')
    .insert({
      perfil_id: perfilId,
      autor_id: user.id,
      conteudo,
      pai_id: paiId || null,
    })

  if (error) throw new Error(error.message)
}

export async function excluirComentarioMural(comentarioId: string) {
  const { supabase } = await obterUsuarioOuErro()

  const { error } = await supabase
    .from('mural_comentario')
    .delete()
    .eq('id', comentarioId)

  if (error) throw new Error(error.message)
}

export async function reagirMural(comentarioId: string, emoji: string) {
  const { supabase, user } = await obterUsuarioOuErro()

  // Toggle: se já existe, remove; senão, insere
  const { data: existente } = await supabase
    .from('mural_reacao')
    .select('emoji')
    .eq('comentario_id', comentarioId)
    .eq('usuario_id', user.id)
    .eq('emoji', emoji)
    .single()

  if (existente) {
    await supabase
      .from('mural_reacao')
      .delete()
      .eq('comentario_id', comentarioId)
      .eq('usuario_id', user.id)
      .eq('emoji', emoji)
  } else {
    await supabase
      .from('mural_reacao')
      .insert({ comentario_id: comentarioId, usuario_id: user.id, emoji })
  }
}
