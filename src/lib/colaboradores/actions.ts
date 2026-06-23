'use server'

import { criarClienteServidor } from '@/lib/supabase/server'

async function obterUsuarioOuErro() {
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  return { supabase, user }
}

async function verificarDono(supabase: Awaited<ReturnType<typeof criarClienteServidor>>, projetoId: string, userId: string) {
  const { data } = await supabase
    .from('projeto')
    .select('id')
    .eq('id', projetoId)
    .eq('dono_id', userId)
    .single()

  if (!data) throw new Error('Sem permissão')
}

export async function convidarColaborador(projetoId: string, nomeUsuario: string, papel: string) {
  const { supabase, user } = await obterUsuarioOuErro()
  await verificarDono(supabase, projetoId, user.id)

  const { data: convidado } = await supabase
    .from('perfil')
    .select('id')
    .eq('nome_usuario', nomeUsuario)
    .single()

  if (!convidado) throw new Error('Usuário não encontrado')

  const { error } = await supabase
    .from('projeto_colaborador')
    .insert({ projeto_id: projetoId, usuario_id: convidado.id, papel, convidado_em: new Date().toISOString() })

  if (error) throw new Error(error.message)
}

export async function removerColaborador(projetoId: string, usuarioId: string) {
  const { supabase, user } = await obterUsuarioOuErro()
  await verificarDono(supabase, projetoId, user.id)

  const { error } = await supabase
    .from('projeto_colaborador')
    .delete()
    .eq('projeto_id', projetoId)
    .eq('usuario_id', usuarioId)

  if (error) throw new Error(error.message)
}

export async function listarColaboradores(projetoId: string) {
  const { supabase } = await obterUsuarioOuErro()

  const { data, error } = await supabase
    .from('projeto_colaborador')
    .select('usuario_id, papel, convidado_em, aceito_em, perfil:usuario_id(nome_usuario, nome_exibicao, avatar_url)')
    .eq('projeto_id', projetoId)

  if (error) throw new Error(error.message)
  return data || []
}

export async function aceitarConvite(projetoId: string) {
  const { supabase, user } = await obterUsuarioOuErro()

  const { error } = await supabase
    .from('projeto_colaborador')
    .update({ aceito_em: new Date().toISOString() })
    .eq('projeto_id', projetoId)
    .eq('usuario_id', user.id)

  if (error) throw new Error(error.message)
}
