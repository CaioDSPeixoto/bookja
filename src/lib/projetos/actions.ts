'use server'

import { criarClienteServidor } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

async function obterUsuarioOuErro() {
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  return { supabase, user }
}

export async function criarProjeto(formData: FormData) {
  const { supabase, user } = await obterUsuarioOuErro()
  const titulo = formData.get('titulo') as string
  const sinopse = formData.get('sinopse') as string | null

  const { data, error } = await supabase
    .from('projeto')
    .insert({ titulo, sinopse: sinopse || null, dono_id: user.id, status: 'rascunho' })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data.id
}

export async function atualizarProjeto(id: string, dados: { titulo?: string; sinopse?: string | null; status?: string }) {
  const { supabase, user } = await obterUsuarioOuErro()

  const { error } = await supabase
    .from('projeto')
    .update(dados)
    .eq('id', id)
    .eq('dono_id', user.id)

  if (error) throw new Error(error.message)
}

export async function excluirProjeto(id: string, locale: string) {
  const { supabase, user } = await obterUsuarioOuErro()

  const { error } = await supabase
    .from('projeto')
    .delete()
    .eq('id', id)
    .eq('dono_id', user.id)

  if (error) throw new Error(error.message)
  redirect(`/${locale}/biblioteca`)
}

export async function listarProjetos() {
  const { supabase, user } = await obterUsuarioOuErro()

  console.log('[DEBUG] listarProjetos - user.id:', user.id)

  const { data, error } = await supabase
    .from('projeto')
    .select('*, documento(count)')
    .eq('dono_id', user.id)
    .order('criado_em', { ascending: false })

  console.log('[DEBUG] listarProjetos - data:', data?.length, 'error:', error)

  if (error) {
    console.error('Erro listarProjetos:', error)
    return []
  }
  return data ?? []
}

export async function obterProjeto(id: string) {
  const { supabase, user } = await obterUsuarioOuErro()

  const { data, error } = await supabase
    .from('projeto')
    .select('*, documento(*)')
    .eq('id', id)
    .eq('dono_id', user.id)
    .single()

  if (error) throw new Error(error.message)
  return data
}
