'use server'

import { erroOperacao, erroPublico } from '@/lib/actions/erros'
import { criarClienteServidor } from '@/lib/supabase/server'
import { validarUuid } from '@/lib/validacao/comum'

async function obterUsuarioOuErro() {
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw erroPublico('Autenticação necessária')
  return { supabase, user }
}

function validarAlvo(usuarioId: unknown, proprioId: string): string {
  if (!validarUuid(usuarioId)) throw erroPublico('Usuário inválido')
  if (usuarioId === proprioId) throw erroPublico('Você não pode bloquear a si mesmo')
  return usuarioId
}

export async function bloquearUsuario(usuarioId: string) {
  const { supabase, user } = await obterUsuarioOuErro()
  const alvo = validarAlvo(usuarioId, user.id)

  const { error } = await supabase
    .from('bloqueio')
    .upsert({ bloqueador_id: user.id, bloqueado_id: alvo })

  if (error) throw erroOperacao('Não foi possível bloquear o usuário')
  return { bloqueado: true }
}

export async function desbloquearUsuario(usuarioId: string) {
  const { supabase, user } = await obterUsuarioOuErro()
  if (!validarUuid(usuarioId)) throw erroPublico('Usuário inválido')

  const { error } = await supabase
    .from('bloqueio')
    .delete()
    .eq('bloqueador_id', user.id)
    .eq('bloqueado_id', usuarioId)

  if (error) throw erroOperacao('Não foi possível desbloquear o usuário')
  return { bloqueado: false }
}

/** Indica se o usuário atual bloqueou o alvo. */
export async function estaBloqueado(usuarioId: string): Promise<boolean> {
  if (!validarUuid(usuarioId)) return false
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('bloqueio')
    .select('bloqueado_id')
    .eq('bloqueador_id', user.id)
    .eq('bloqueado_id', usuarioId)
    .maybeSingle()

  return !!data
}

/** IDs dos usuários que o usuário atual bloqueou (para ocultar conteúdo). */
export async function listarIdsBloqueados(): Promise<string[]> {
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('bloqueio')
    .select('bloqueado_id')
    .eq('bloqueador_id', user.id)

  return (data || []).map((b) => b.bloqueado_id as string)
}
