'use server'

import { criarClienteServidor } from '@/lib/supabase/server'

async function obterUsuarioOuErro() {
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  return { supabase, user }
}

export async function listarNotificacoes() {
  const { supabase, user } = await obterUsuarioOuErro()

  const { data, error } = await supabase
    .from('notificacao')
    .select('*')
    .eq('usuario_id', user.id)
    .order('criado_em', { ascending: false })
    .limit(50)

  if (error) throw new Error(error.message)
  return data || []
}

export async function marcarComoLida(id: string) {
  const { supabase, user } = await obterUsuarioOuErro()

  const { error } = await supabase
    .from('notificacao')
    .update({ lida: true })
    .eq('id', id)
    .eq('usuario_id', user.id)

  if (error) throw new Error(error.message)
}

export async function marcarTodasComoLidas() {
  const { supabase, user } = await obterUsuarioOuErro()

  const { error } = await supabase
    .from('notificacao')
    .update({ lida: true })
    .eq('usuario_id', user.id)
    .eq('lida', false)

  if (error) throw new Error(error.message)
}

export async function criarNotificacao(dados: {
  usuario_id: string
  tipo: string
  projeto_id?: string
  documento_id?: string
  comentario_id?: string
  mensagem: string
}) {
  const supabase = await criarClienteServidor()

  const { error } = await supabase
    .from('notificacao')
    .insert(dados)

  if (error) throw new Error(error.message)
}
