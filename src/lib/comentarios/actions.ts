'use server'

import { criarClienteServidor } from '@/lib/supabase/server'

export async function criarComentario(
  projetoId: string,
  documentoId: string | null,
  conteudo: string,
  nota?: number
) {
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: projeto } = await supabase
    .from('projeto')
    .select('status')
    .eq('id', projetoId)
    .single()

  if (!projeto || projeto.status !== 'publicado') throw new Error('Projeto não publicado')

  const { error } = await supabase.from('comentario').insert({
    projeto_id: projetoId,
    documento_id: documentoId,
    autor_id: user.id,
    conteudo,
    nota: nota || null,
  })

  if (error) throw new Error(error.message)

  if (nota) {
    const { data: stats } = await supabase
      .from('comentario')
      .select('nota')
      .eq('projeto_id', projetoId)
      .not('nota', 'is', null)

    if (stats) {
      const total = stats.length
      const media = stats.reduce((s, c) => s + (c.nota as number), 0) / total
      await supabase
        .from('projeto')
        .update({ media_avaliacao: Math.round(media * 10) / 10, contagem_avaliacoes: total })
        .eq('id', projetoId)
    }
  }
}

export async function excluirComentario(id: string) {
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: comentario } = await supabase
    .from('comentario')
    .select('autor_id')
    .eq('id', id)
    .single()

  if (!comentario || comentario.autor_id !== user.id) throw new Error('Sem permissão')

  await supabase.from('comentario').delete().eq('id', id)
}

export async function listarComentarios(projetoId: string, documentoId?: string | null) {
  const supabase = await criarClienteServidor()

  let query = supabase
    .from('comentario')
    .select('*, perfil:autor_id(nome_usuario, nome_exibicao, avatar_url)')
    .eq('projeto_id', projetoId)
    .order('criado_em', { ascending: false })

  if (documentoId) {
    query = query.eq('documento_id', documentoId)
  } else {
    query = query.is('documento_id', null)
  }

  const { data } = await query
  return data || []
}

export async function responderComentario(comentarioId: string, conteudo: string) {
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: pai } = await supabase
    .from('comentario')
    .select('projeto_id, documento_id')
    .eq('id', comentarioId)
    .single()

  if (!pai) throw new Error('Comentário não encontrado')

  await supabase.from('comentario').insert({
    projeto_id: pai.projeto_id,
    documento_id: pai.documento_id,
    autor_id: user.id,
    pai_id: comentarioId,
    conteudo,
  })
}

export async function reagir(comentarioId: string, emoji: string) {
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: existente } = await supabase
    .from('comentario_reacao')
    .select('*')
    .eq('comentario_id', comentarioId)
    .eq('usuario_id', user.id)
    .eq('emoji', emoji)
    .maybeSingle()

  if (existente) {
    await supabase
      .from('comentario_reacao')
      .delete()
      .eq('comentario_id', comentarioId)
      .eq('usuario_id', user.id)
      .eq('emoji', emoji)
  } else {
    await supabase.from('comentario_reacao').insert({
      comentario_id: comentarioId,
      usuario_id: user.id,
      emoji,
    })
  }
}

export async function listarReacoes(comentarioId: string) {
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('comentario_reacao')
    .select('emoji, usuario_id')
    .eq('comentario_id', comentarioId)

  const reacoes: Record<string, { contagem: number; reagiu: boolean }> = {}
  for (const r of data || []) {
    if (!reacoes[r.emoji]) reacoes[r.emoji] = { contagem: 0, reagiu: false }
    reacoes[r.emoji].contagem++
    if (user && r.usuario_id === user.id) reacoes[r.emoji].reagiu = true
  }
  return reacoes
}
